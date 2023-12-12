import {
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect, use } from "chai";
import { Contract, Signer } from 'ethers';
import { ethers, network } from "hardhat";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DefaultPRSRaffleCustomVrfParams, DefaultPRSRaffleParams, DefaultRPSPrizeAmounts, getRandomFloat, isCustomVrfNetwork } from '../utils/utils';
import { deployRPSRaffle } from '../scripts/test/deployRPSRaffle';
import { deployRPSRouter } from '../scripts/test/deployRPSRouter';
import { encodeStakingCall } from '../scripts/test/encodeStakingCall';
import { applyTradeFee } from '../scripts/test/applyTradeFee';
import { getProtocolFeeFromDelta } from '../scripts/test/getProtocolFee';
import { calcPendingAmounts } from '../scripts/test/calcPendingAmount';
import { BatchTradeParams } from '../utils/types';
import { tradeToFillPot } from '../scripts/test/tradeToFillPot';

if (!isCustomVrfNetwork(Number(process.env.CHAIN_ID))) {
  throw new Error("Cannot test custom vrf raffle - this chain is not supported. Did you mean to run a signle-file test?");
}

describe('RPS Raffle (no Chainlink VRF)', async () => {
  async function deployEverythingFixture(): Promise<{
    RPSRaffle: Contract,
    RPSRouter: Contract,
    Protocol: Contract,
    owner: SignerWithAddress,
    operator: SignerWithAddress
  }> {

    // Configure initilize parameters
    const params = DefaultPRSRaffleCustomVrfParams;
    const [owner, operator] = await ethers.getSigners();

    params.owner = await owner.getAddress();
    params.operator = await operator.getAddress();

    // Deploy protocol
    const Protocol = await deployProtocol();

    // Deploy Router
    const RPSRouter = await deployTestRPSRouter(
      Protocol.target.toString(),
      params.owner
    );
    params.router = RPSRouter.target.toString();

    const RPSRaffle = await deployRPSRaffle(params);

    // Set raffle
    await RPSRouter.setRaffleAddress(RPSRaffle.target);

    // Set winning amounts
    const num_of_winners = 1;
    await RPSRaffle.updatePrizeDistribution(
      DefaultRPSPrizeAmounts,
      num_of_winners
    );

    return {
      RPSRaffle,
      RPSRouter,
      Protocol,
      owner,
      operator
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

  it('Should execute the call', async function () {
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

    await RPSRouter.execute(data, trade_amount, { value: trade_amount });

    expect(await Protocol.staked(user_addr)).to.equal(
      staking_amount, "Staked amount is incorrect"
    );
  });

  it('Two executions correctly update raffle data', async function () {
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
    await RPSRouter.connect(user).execute(data1, trade_amount1, { value: trade_amount1 });

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
    await RPSRouter.connect(user).execute(data2, trade_amount2, { value: trade_amount2 });

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

  it('Execute batch', async function () {
    const {
      RPSRaffle,
      RPSRouter,
      Protocol
    } = await loadFixture(deployEverythingFixture);

    const [owner, user, user2] = await ethers.getSigners();
    const user_addr = await user.getAddress();
    const user_2_addr = await user2.getAddress();

    const staking_amount_1 = ethers.parseEther(getRandomFloat(1.3, 5).toFixed(5));
    const staking_amount_2 = ethers.parseEther(getRandomFloat(0.7, 3).toFixed(5));
    const total_staking_amount = staking_amount_1 + staking_amount_2;
    const data = encodeStakingCall(user_addr, total_staking_amount);

    const trade_amount1 = applyTradeFee(
      staking_amount_1,
      DefaultPRSRaffleParams.tradeFeeInBps,
    );
    const trade_amount2 = applyTradeFee(
      staking_amount_2,
      DefaultPRSRaffleParams.tradeFeeInBps,
    );
    const params: BatchTradeParams[] = [
      {
        tradeAmount: trade_amount1,
        user: user_addr
      },
      {
        tradeAmount: trade_amount2,
        user: user_2_addr
      }
    ];

    const eth_buffer = ethers.parseEther("0.4");
    //@ts-ignore
    await RPSRouter.connect(user).executeBatch(data, params, {
      value: trade_amount1 + trade_amount2 + eth_buffer
    });

    /* 
      CHECK STATE
     */
    const raffle_delta = trade_amount1 + trade_amount2 - total_staking_amount;
    const scale = 10n ** 10n;
    const protocol_fee_scaled = getProtocolFeeFromDelta(scale * raffle_delta);
    const expected_pot_size_scaled = scale * raffle_delta - protocol_fee_scaled;
    const expected_pending_amount_1 = await calcPendingAmounts(trade_amount1);
    const expected_pending_amount_2 = await calcPendingAmounts(trade_amount2);

    // Balances
    const raffle_bal = await ethers.provider.getBalance(RPSRaffle.target);
    const delta = 10n ** 6n;
    expect(raffle_bal).to.closeTo(raffle_delta, delta, "Raffle balance incorrect");

    // State
    const pot_size = await RPSRaffle.currentPotSize();
    expect(pot_size).to.be.closeTo(expected_pot_size_scaled / scale, delta, "Pot size incorrect");
    expect(await RPSRaffle.pendingAmounts(user_addr)).to.equal(expected_pending_amount_1, "Unexpected pending amount user 1");
    expect(await RPSRaffle.pendingAmounts(user_2_addr)).to.equal(expected_pending_amount_2, "Unexpected pending amount user 2");
  });

  it('Insufficient value reverts', async function () {
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
    const ex = RPSRouter.connect(user).execute(data, trade_amount, { value: trade_amount - 1n });
    expect(ex).to.be.revertedWith("Insufficient funds");
  });

  it('Restricted access should work', async function () {
    const {
      RPSRaffle,
      RPSRouter,
    } = await loadFixture(deployEverythingFixture);

    const [, , user] = await ethers.getSigners();

    /*
    
        CHECKING ACCESS CONTROL
    
     */
    //@ts-ignore
    expect(RPSRaffle.connect(user).executeRaffle([user])).to.be.revertedWith(
      "Caller must be the operator"
    );

    const amount = ethers.parseEther("1.0");
    const user_addr = await user.getAddress();
    //@ts-ignore
    expect(RPSRaffle.connect(user).executeTrade(amount, user_addr)).to.be.revertedWith(
      "Unathorized call - not a router"
    );

    //@ts-ignore
    expect(RPSRaffle.connect(user).setPotLimit(amount)).to.be.reverted;

    //@ts-ignore
    expect(RPSRouter.connect(user).migrateProtocol(user_addr)).to.be.reverted;
  });

  it('Owner can withdraw fees', async function () {
    const {
      RPSRaffle,
      RPSRouter,
      Protocol,
      owner
    } = await loadFixture(deployEverythingFixture);

    /* 
      SIMPLE TRADE
    */
    const [, , user] = await ethers.getSigners();
    const user_addr = await user.getAddress();
    const staking_amount = ethers.parseEther(getRandomFloat(0.01, 0.3).toFixed(5));
    const data = encodeStakingCall(user_addr, staking_amount);
    const trade_amount = applyTradeFee(
      staking_amount,
      DefaultPRSRaffleParams.tradeFeeInBps,
    );

    // @ts-ignore
    await RPSRouter.connect(user).execute(
      data,
      trade_amount,
      { value: trade_amount }
    );

    /* 
      WITHDRAW FEE
     */
    const owner_addr = await owner.getAddress();
    const raffle_delta = trade_amount - staking_amount;
    const protocol_fee = getProtocolFeeFromDelta(raffle_delta);
    // @ts-ignore
    expect(RPSRaffle.connect(owner).withdrawFee(owner_addr)).to.changeEtherBalances(
      [RPSRaffle.target, owner_addr],
      [-protocol_fee, protocol_fee]
    );

    // Check currentPotSize
    const expected_pot_size = raffle_delta - protocol_fee;
    const delta = 10n ^ 3n;
    expect(await RPSRaffle.currentPotSize()).to.closeTo(
      expected_pot_size,
      delta,
      "Invalid pot size"
    );
  });

  it('Should request random number',async () => {
    const {
      RPSRaffle,
      RPSRouter,
      owner
    } = await loadFixture(deployEverythingFixture);

    const tx = tradeToFillPot(RPSRouter);
    await tx;
    
    const request_id = await RPSRaffle.lastRequestId();
    let request_created;
    expect(request_id).to.not.equal(0, "Last request id is not set");
    [, request_created, ] = await RPSRaffle.randomnessRequests(request_id);
    expect(request_created).to.equal(true, "Request status is not set to true");
  });

  it('Operator executes the raffle',async () => {
    const {
      RPSRaffle,
      RPSRouter,
      owner,
      operator
    } = await loadFixture(deployEverythingFixture);

    await tradeToFillPot(RPSRouter);

    const [,, alice, bob, vitalik, sbf] = await ethers.getSigners();

    /* 
      Update prize distribution
     */
    const n_of_winners = 4n;
    const pot_limit = BigInt(DefaultPRSRaffleCustomVrfParams.potLimit);
    const big_winning = pot_limit / 2n;
    const mini_winning = pot_limit / 6n;
    if (big_winning + mini_winning * (n_of_winners - 1n) > pot_limit) {
      throw new Error("Winnings calculation error");
    }

    const winnings = new Array(Number(n_of_winners)).fill(mini_winning);
    winnings[0] = big_winning;
    // @ts-ignore
    await RPSRaffle.connect(owner).updatePrizeDistribution(winnings, n_of_winners);
    
    /* 
      Execute raffle
     */
    const winners = await Promise.all([alice, vitalik, bob, sbf].map(async (player) => {
      return await player.getAddress()
    }));

    // @ts-ignore
    await RPSRaffle.connect(operator).executeRaffle(winners);

    const [
      alice_winnings, 
      bob_winnings, 
      vitalik_winnings, 
      sbf_winnings
    ] = await Promise.all([alice, bob, vitalik, sbf].map(
      async (player) => {
        const [winning, deadline] = await RPSRaffle.claimablePrizes(await player.getAddress());
        return winning;
      }
    ));

    expect(alice_winnings).to.equal(
      big_winning, "Incorrect Alice claimable amount"
    );
    expect(bob_winnings).to.equal(
      mini_winning, "Incorrect Bob claimable amount"
    );
    expect(vitalik_winnings).to.equal(
      mini_winning, "Incorrect Bob claimable amount"
    );
    expect(sbf_winnings).to.equal(
      mini_winning, "Incorrect Bob claimable amount"
    );
  });

  it('Winners should claim',async () => {
    const {
      RPSRaffle,
      RPSRouter,
      owner,
      operator
    } = await loadFixture(deployEverythingFixture);

    await tradeToFillPot(RPSRouter);

    const [,, alice, bob] = await ethers.getSigners();

    /* 
      Execute raffle
    */
    // @ts-ignore
    await RPSRaffle.connect(operator).executeRaffle([await alice.getAddress()]);

    /* 
      Claiming
     */
    const winning = DefaultPRSRaffleCustomVrfParams.potLimit;

    // @ts-ignore
    expect(RPSRaffle.connect(bob).claim()).to.be.revertedWith(
      "No available winnings"
    );
    // @ts-ignore
    expect(RPSRaffle.connect(alice).claim()).to.changeEtherBalances(
      [RPSRaffle.target, await alice.getAddress()],
      [-winning, winning]
    );
    // @ts-ignore
    expect(RPSRaffle.connect(alice).claim()).to.be.revertedWith(
      "No available winnings"
    );
  });

});