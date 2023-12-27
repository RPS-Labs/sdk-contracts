import {
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect, use } from "chai";
import { Contract, Signer } from 'ethers';
import { ethers, network } from "hardhat";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DefaultPRSRaffleCustomVrfParams, DefaultPRSRaffleParams, DefaultRPSPrizeAmounts, DefaultSponsoredRaffleCustomVrfParams, DefaultSponsoredToken, DefaultStandardIncentivizedTokens, Token, getRandomFloat, isCustomVrfNetwork } from '../utils/utils';
import { encodeStakingCall } from '../scripts/test/encodeStakingCall';
import { applyTradeFee } from '../scripts/test/applyTradeFee';
import { getProtocolFeeFromDelta } from '../scripts/test/getProtocolFee';
import { calcPendingAmounts } from '../scripts/test/calcPendingAmount';
import { tradeToFillPot } from '../scripts/test/tradeToFillPot';
import { deployMockRPSRouterStandard } from '../scripts/test/deployMockRPSRouterStandard';
import { deployRPSRaffleStandard } from '../scripts/test/deployRPSRaffleStandard';
import { configurePriceFeeds } from '../scripts/test/configurePriceFeeds';
import { sponsorRaffle } from '../scripts/test/sponsorRaffle';
import { dealTokensToAddress } from '../scripts/test/dealTokensToAddress';
import { erc20TokenContract } from '../scripts/test/erc20TokenContract';

if (!isCustomVrfNetwork(Number(process.env.CHAIN_ID))) {
  throw new Error("Cannot test custom vrf raffle - this chain is not supported. Did you mean to run a signle-file test?");
}

describe('RPS Raffle (Standard DEX integration)', async () => {
  async function deployEverythingFixture(): Promise<{
    RPSRaffle: Contract,
    RPSRouter: Contract,
    MatchingEngine: Contract,
    owner: SignerWithAddress,
    operator: SignerWithAddress
  }> {

    // Configure initilize parameters
    const params = DefaultSponsoredRaffleCustomVrfParams;
    const [owner, operator] = await ethers.getSigners();

    params.owner = await owner.getAddress();
    params.operator = await operator.getAddress();

    // Deploy protocol
    const MatchingEngine = await deployMatchingEngine();

    // Deploy Router
    const RPSRouter = await deployMockRPSRouterStandard(
      MatchingEngine.target.toString(),
      params.owner
    );
    params.router = RPSRouter.target.toString();

    const RPSRaffle = await deployRPSRaffleStandard(params);

    // Configure router
    await RPSRouter.setRaffleAddress(RPSRaffle.target);

    /* 
      Configure Raffle
     */
    await configurePriceFeeds(RPSRaffle, owner);

    const chainId = network.config.chainId!;
    // @ts-ignore
    await RPSRaffle.connect(owner).addIncentivizedTokens(
      DefaultStandardIncentivizedTokens.map((token: Token) => token.address)
    );
    console.log("Incentivized tokens ready");
    await sponsorRaffle(
      RPSRaffle, 
      owner, 
      DefaultSponsoredToken[chainId],
      params.potLimit
    );
    console.log("Raffle sponsored");
    await RPSRaffle.startRaffle();

    return {
      RPSRaffle,
      RPSRouter,
      MatchingEngine,
      owner,
      operator
    };
  }

  async function deployTestRPSRouter(
    matching_engine: string,
    owner_addr?: string
  ): Promise<Contract> {
    if (!owner_addr) {
      const [owner] = await ethers.getSigners();
      owner_addr = await owner.getAddress();
    }
    if (!matching_engine) {
      throw new Error("Protocol not specified");
    }

    const RPSRouter = await deployMockRPSRouterStandard(matching_engine, owner_addr);

    return RPSRouter;
  }

  async function deployMatchingEngine(): Promise<Contract> {
    const MatchingEngine = await ethers.deployContract("MatchingEngine");

    await MatchingEngine.waitForDeployment();

    return MatchingEngine;
  }

  it.only('Should execute the call', async function () {
    const {
      RPSRaffle,
      RPSRouter,
      MatchingEngine
    } = await loadFixture(deployEverythingFixture);

    const [,,user] = await ethers.getSigners();
    const user_addr = await user.getAddress();

    const input_token = DefaultStandardIncentivizedTokens[0];
    const swap_amount = ethers.parseUnits(
      getRandomFloat(100, 1000).toFixed(5),
      input_token.decimals
    );
    const InputToken = await erc20TokenContract(input_token.address);
    
    // Get token for the user
    dealTokensToAddress(input_token, user_addr, swap_amount);

    // Resetting ticket cost
    const new_ticket_cost = ethers.parseEther(getRandomFloat(1, 3).toFixed(5));
    await RPSRaffle.setRaffleTicketCost(new_ticket_cost);

    /* 
      Approve and execute
     */
    // @ts-ignore
    await InputToken.connect(user).approve(RPSRouter.target, swap_amount);
    // @ts-ignore
    await RPSRouter.connect(user).execute(
      input_token.address, 
      swap_amount, 
      user_addr
    );
    console.log("Executed");

    expect(await MatchingEngine.lastMaker()).to.equal(
      user_addr, "Incorrect maker"
    );
    // TODO check matching engine balance
    // TODO check pending amount
  });

  it('Non-approved tokens dont generate tickets', async () => {
    // TODO
  });

  it('Two executions correctly update raffle data', async function () {
    const {
      RPSRaffle,
      RPSRouter,
      MatchingEngine
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

    // TODO add other actions (raffle configuration)
  });

  it('Time-based raffle is drawn; next raffle starts',async () => {
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

    // TODO make a next trade, 
  });

  it('Raffle cannot be drawn without funds',  async () => {
    // TODO
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

  it('Winner should claim tokens',async () => {
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