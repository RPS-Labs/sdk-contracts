import {
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect, use } from "chai";
import { Contract, Signer } from 'ethers';
import { ethers, network } from "hardhat";
import { deployVRFContracts } from '../scripts/test/deployMockVrfContracts';
import { configureVRFV2Wrapper } from '../scripts/test/configureVrfWrapper';
import { fundSubscription } from '../scripts/test/fundSubscription';
import { deployRPSRaffle } from '../scripts/test/deployRPSRaffle';
import { deployRPSRouter } from '../scripts/test/deployRPSRouter';
import { dealLINKToAddress } from '../scripts/test/dealLinkToAddress';
import { DefaultPRSRaffleParams, getRandomFloat } from '../utils/utils';
import { encodeStakingCall } from '../scripts/test/encodeStakingCall';
import { applyTradeFee } from '../scripts/test/applyTradeFee';
import { getProtocolFeeFromDelta } from '../scripts/test/getProtocolFee';
import { calcPendingAmounts } from '../scripts/test/calcPendingAmount';
import { tradeToFillPot } from '../scripts/test/tradeToFillPot';

describe("RPS Raffle", function() {
  async function deployAndConfigureVRFContracts(): Promise<{
    V3Aggregator: Contract,
    VRFCoordinator: Contract,
    VRFV2Wrapper: Contract
  }> {
    let { V3Aggregator, VRFCoordinator, VRFV2Wrapper } = await deployVRFContracts();
    VRFV2Wrapper = await configureVRFV2Wrapper(VRFV2Wrapper);
    VRFCoordinator = await fundSubscription(VRFCoordinator);

    return {
      V3Aggregator, 
      VRFCoordinator,
      VRFV2Wrapper
    }
  }

  async function deployEverythingFixture(): Promise<{
    V3Aggregator: Contract, 
    VRFCoordinator: Contract, 
    VRFV2Wrapper: Contract,
    RPSRaffle: Contract,
    RPSRouter: Contract,
    Protocol: Contract
  }> {
    const { V3Aggregator, VRFCoordinator, VRFV2Wrapper } = 
      await deployAndConfigureVRFContracts();

    // Configure initilize parameters
    const params = DefaultPRSRaffleParams;
    const [owner] = await ethers.getSigners();

    params.owner = await owner.getAddress();

    // Deploy protocol
    const Protocol = await deployProtocol();

    // Deploy Router
    const RPSRouter = await deployTestRPSRouter(
      Protocol.target.toString(), 
      params.owner
    );
    params.router = RPSRouter.target.toString();

    const RPSRaffle = await deployRPSRaffle(params, VRFV2Wrapper);

    // Set raffle
    await RPSRouter.setRaffleAddress(RPSRaffle.target);

    // Fund raffle with LINK
    await dealLINKToAddress(RPSRaffle.target.toString(), 100);

    return {
      V3Aggregator,
      VRFCoordinator,
      VRFV2Wrapper,
      RPSRaffle,
      RPSRouter,
      Protocol
    };
  }

  async function deployTestRPSRouter(
    protocol: string,
    owner_addr?: string
  ): Promise<Contract> {
    if (!owner_addr) {
      const [owner] = await ethers.getSigners();
      owner_addr = await owner.getAddress();
    }
    if (!protocol) {
      throw new Error("Protocol not specified");
    }

    const RPSRouter = await deployRPSRouter(protocol, owner_addr);

    return RPSRouter;
  }

  async function deployProtocol(): Promise<Contract> {
    const protocol = await ethers.deployContract("StakingMock");
  
    await protocol.waitForDeployment();

    return protocol;
  }

  it('Should execute the call', async function() {
    const {
      RPSRaffle,
      RPSRouter,
      Protocol
    } = await loadFixture(deployEverythingFixture);

    const default_raffle_params = DefaultPRSRaffleParams;

    const [user] = await ethers.getSigners();
    const user_addr = await user.getAddress();

    const staking_amount = ethers.parseEther(getRandomFloat(0.3, 5).toFixed(5));
    const data = encodeStakingCall(user_addr, staking_amount);
    const trade_amount = applyTradeFee(
      staking_amount,
      default_raffle_params.tradeFeeInBps, 
    );

    // Resetting ticket cost
    const new_ticket_cost = ethers.parseEther(getRandomFloat(0.01, 0.3).toFixed(5));
    await RPSRaffle.setRaffleTicketCost(new_ticket_cost);

    await RPSRouter.execute(data, trade_amount, {value: trade_amount});

    expect(await Protocol.staked(user_addr)).to.equal(
      staking_amount, "Staked amount is incorrect"
    );
  });

  it('Two executions correctly update raffle data', async function() {
    const {
      RPSRaffle,
      RPSRouter,
      Protocol
    } = await loadFixture(deployEverythingFixture);

    const [owner, user] = await ethers.getSigners();
    const user_addr = await user.getAddress();

    /*
    
      FIRST CALL
    
    */
    const staking_amount1 = ethers.parseEther(getRandomFloat(0.3, 5).toFixed(5));
    const data1 = encodeStakingCall(user_addr, staking_amount1);
    const trade_amount1 = applyTradeFee(
      staking_amount1,
      DefaultPRSRaffleParams.tradeFeeInBps, 
    );
    const raffle_delta1 = trade_amount1 - staking_amount1;

    // @ts-ignore
    await RPSRouter.connect(user).execute(data1, trade_amount1, {value: trade_amount1});

    /* 

      SECOND CALL

    */
    const staking_amount2 = ethers.parseEther(getRandomFloat(1, 5).toFixed(5));
    const data2 = encodeStakingCall(user_addr, staking_amount2);
    const trade_amount2 = applyTradeFee(
      staking_amount2,
      DefaultPRSRaffleParams.tradeFeeInBps, 
    );
    const raffle_delta2 = trade_amount2 - staking_amount2;

    // @ts-ignore
    await RPSRouter.connect(user).execute(data2, trade_amount2, {value: trade_amount2});

    // Checking state
    const scale = 10n ** 10n;
    const protocol_fee_scaled = getProtocolFeeFromDelta(scale * (raffle_delta1 + raffle_delta2));
    const expected_pot_size_scaled = scale * (raffle_delta1 + raffle_delta2) - protocol_fee_scaled;
    const expected_pending_amount = await calcPendingAmounts(trade_amount1 + trade_amount2);

    // Balances
    const raffle_bal = await ethers.provider.getBalance(RPSRaffle.target);
    expect(raffle_bal).to.equal(raffle_delta1 + raffle_delta2, "Raffle balance incorrect");

    // State
    const pot_size = await RPSRaffle.currentPotSize();
    const delta = 10n ** 6n;
    expect(pot_size).to.be.closeTo(expected_pot_size_scaled / scale, delta, "Pot size incorrect");
    expect(await RPSRaffle.pendingAmounts(user_addr)).to.equal(expected_pending_amount, "Unexpected pending amount");
  });

  it('Insufficient value reverts', async function() {
    const {
      RPSRaffle,
      RPSRouter,
      Protocol
    } = await loadFixture(deployEverythingFixture);

    const [owner, user] = await ethers.getSigners();
    const user_addr = await user.getAddress();
    const staking_amount = ethers.parseEther(getRandomFloat(0.3, 5).toFixed(5));
    const data = encodeStakingCall(user_addr, staking_amount);
    const trade_amount = applyTradeFee(
      staking_amount,
      DefaultPRSRaffleParams.tradeFeeInBps, 
    );

    // @ts-ignore
    const ex = RPSRouter.connect(user).execute(data, trade_amount, {value: trade_amount - 1n});
    expect(ex).to.be.revertedWith("Insufficient funds");
  });

  it('Should request Chainlink randomness when the pot is filled', async function () {
    const {
      RPSRaffle,
      RPSRouter,
      Protocol
    } = await loadFixture(deployEverythingFixture);

    await tradeToFillPot(RPSRouter);
    
    const request_id = await RPSRaffle.lastRequestId();
    let request_created;
    expect(request_id).to.not.equal(0, "Last request id is not set");
    expect(await RPSRaffle.requestIds(0)).to.equal(request_id, "Request ids array is not updated");
    [, request_created, ] = await RPSRaffle.chainlinkRequests(request_id);
    expect(request_created).to.equal(true, "Request status is not set to true");
  });

  // TODO try setters (randomized value)
});
