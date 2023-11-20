import {
  loadFixture,
  mine,
  time,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect, use } from "chai";
import { Contract } from 'ethers';
import { ethers, network } from "hardhat";
import { deployVRFContracts } from '../scripts/test/deployMockVrfContracts';
import { configureVRFV2Wrapper } from '../scripts/test/configureVrfWrapper';
import { fundSubscription } from '../scripts/test/fundSubscription';
import { RPSRaffleInitializeParams } from '../utils/types';
import { deployRPSRaffle } from '../scripts/test/deployRPSRaffle';
import { AddressZero } from '@ethersproject/constants';
import { ROUTER } from '../Addresses';
import { deployRPSRouter } from '../scripts/test/deployRPSRouter';
import { dealLINKToAddress } from '../scripts/test/dealLinkToAddress';
import { DefaultPRSRaffleParams, getRandomFloat } from '../utils/utils';
import { encodeStakingCall } from '../scripts/test/encodeStakingCall';
import { applyTradeFee } from '../scripts/test/applyTradeFee';

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
    console.log('Stating deployments');
    const { V3Aggregator, VRFCoordinator, VRFV2Wrapper } = 
      await deployAndConfigureVRFContracts();

    // Configure initilize parameters
    const params = DefaultPRSRaffleParams;
    const [owner] = await ethers.getSigners();

    params.owner = await owner.getAddress();
    params.router = ROUTER[network.config.chainId!];

    // Deploy protocol
    console.log("Deploying protocol");
    const Protocol = await deployProtocol();

    // Deploy Router
    console.log("Deploying router");
    const RPSRouter = await deployTestRPSRouter(
      Protocol.target.toString(), 
      params.owner
    );

    console.log("Deploying raffle");
    const RPSRaffle = await deployRPSRaffle(params, VRFV2Wrapper);

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
      default_raffle_params.tradeFeeInBps, 
      staking_amount
    );

    // Resetting ticket cost
    const new_ticket_cost = ethers.parseEther(getRandomFloat(0.01, 0.3).toFixed(5));
    console.log("Setting ticket cost");
    await RPSRaffle.setRaffleTicketCost(new_ticket_cost);

    console.log("Executing...");
    await RPSRouter.execute(data, {value: trade_amount});
    console.log("Done");

    expect(await Protocol.staked(user_addr)).to.equal(
      staking_amount, "Staked amount is incorrect"
    );
  });

  // TODO try setters (randomized value)
});
