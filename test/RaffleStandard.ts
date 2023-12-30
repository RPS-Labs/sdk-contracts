import {
  loadFixture, mine,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect, use } from "chai";
import { Contract } from 'ethers';
import { ethers, network } from "hardhat";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DefaultPRSRaffleCustomVrfParams, DefaultSponsoredRaffleCustomVrfParams, DefaultSponsoredToken, DefaultStandardIncentivizedTokens, Network, Token, USD_DECIMALS, getRandomFloat, isCustomVrfNetwork } from '../utils/utils';
import { tradeToFillPot } from '../scripts/test/tradeToFillPot';
import { deployMockRPSRouterStandard } from '../scripts/test/deployMockRPSRouterStandard';
import { deployRPSRaffleStandard } from '../scripts/test/deployRPSRaffleStandard';
import { configurePriceFeeds } from '../scripts/test/configurePriceFeeds';
import { sponsorRaffle } from '../scripts/test/sponsorRaffle';
import { dealTokensToAddress } from '../scripts/test/dealTokensToAddress';
import { erc20TokenContract } from '../scripts/test/erc20TokenContract';
import { AddressZero } from '@ethersproject/constants';
import { Native } from '../Addresses';
import { convertToUsd } from '../scripts/test/tokens/convertToUsd';
import { simpleTokenRouterTrade } from '../scripts/test/tokens/simpleTokenRouterTrade';
import { setNextBlockTimestamp } from '@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time';

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
    await sponsorRaffle(
      RPSRaffle, 
      owner, 
      DefaultSponsoredToken[chainId],
      params.potLimit
    );
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

  it('Should execute the call', async function () {
    const {
      RPSRaffle,
      RPSRouter,
      MatchingEngine
    } = await loadFixture(deployEverythingFixture);

    const [,,user] = await ethers.getSigners();
    const user_addr = await user.getAddress();

    const input_token = DefaultStandardIncentivizedTokens[0];
    const swap_amount_raw = getRandomFloat(100, 1000).toFixed(5);
    const swap_amount = ethers.parseUnits(
      swap_amount_raw,
      input_token.decimals
    );
    const InputToken = await erc20TokenContract(input_token.address);
    
    // Get token for the user
    await dealTokensToAddress(input_token, user_addr, swap_amount);

    // Resetting ticket cost
    const new_ticket_cost = ethers.parseUnits(
      getRandomFloat(1, 3).toFixed(5),
      USD_DECIMALS
    );
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

    expect(await MatchingEngine.lastMaker()).to.equal(
      user_addr, "Incorrect maker"
    );
    expect(await InputToken.balanceOf(MatchingEngine)).to.equal(
      swap_amount, "Incorrect protocol balance"
    );

    // Check pending amount
    const swap_amount_usd = await convertToUsd(input_token, swap_amount);
    const expected_pending_amount = swap_amount_usd % new_ticket_cost;
    expect(await RPSRaffle.pendingAmountsUSD(user_addr)).to.equal(
      expected_pending_amount, "Pending amount mismatch"
    );
  });

  it('Non-approved tokens dont generate tickets', async () => {
    const {
      RPSRaffle,
      RPSRouter,
      MatchingEngine
    } = await loadFixture(deployEverythingFixture);

    const [,,user] = await ethers.getSigners();
    const user_addr = await user.getAddress();

    const chainId = network.config.chainId!;
    const input_token = DefaultSponsoredToken[chainId];
    const swap_amount_raw = getRandomFloat(100, 1000).toFixed(5);
    const swap_amount = ethers.parseUnits(
      swap_amount_raw,
      input_token.decimals
    );
    const InputToken = await erc20TokenContract(input_token.address);
    
    // Get token for the user
    await dealTokensToAddress(input_token, user_addr, swap_amount);

    /* 
      Approve and execute
     */
    const lastTicketBefore = await RPSRaffle.lastRaffleTicketId();
    // @ts-ignore
    await InputToken.connect(user).approve(RPSRouter.target, swap_amount);
    // @ts-ignore
    await RPSRouter.connect(user).execute(
      input_token.address, 
      swap_amount, 
      user_addr
    );

    expect(await MatchingEngine.lastMaker()).to.equal(
      user_addr, "Incorrect maker"
    );
    expect(await InputToken.balanceOf(MatchingEngine)).to.equal(
      swap_amount, "Incorrect protocol balance"
    );

    // Check pending amount
    expect(await RPSRaffle.pendingAmountsUSD(user_addr)).to.equal(
      0n, "Pending amount must be zero"
    );
    expect(await RPSRaffle.lastRaffleTicketId()).to.equal(
      lastTicketBefore, "This trade must not generate any tickets"
    );
  });

  it('Two executions correctly update raffle data', async function () {
    const {
      RPSRaffle,
      RPSRouter,
      MatchingEngine
    } = await loadFixture(deployEverythingFixture);

    const [,,user] = await ethers.getSigners();
    const user_addr = await user.getAddress();
    const raffle_params = DefaultSponsoredRaffleCustomVrfParams;

    const input_token = DefaultStandardIncentivizedTokens[0];
    const swap_amount_raw = getRandomFloat(100, 1000).toFixed(5);
    const swap_amount = ethers.parseUnits(
      swap_amount_raw,
      input_token.decimals
    );
    const InputToken = await erc20TokenContract(input_token.address);
    
    // Get token for the user
    await dealTokensToAddress(input_token, user_addr, swap_amount);

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

    expect(await MatchingEngine.lastMaker()).to.equal(
      user_addr, "Incorrect maker"
    );
    expect(await InputToken.balanceOf(MatchingEngine)).to.equal(
      swap_amount, "Incorrect protocol balance"
    );

    // Check raffle state
    const swap_amount_usd = await convertToUsd(input_token, swap_amount);
    const expected_pending_amount = swap_amount_usd % BigInt(raffle_params.raffleTicketCostUSD);
    const expected_tickets = swap_amount_usd / BigInt(raffle_params.raffleTicketCostUSD);
    expect(await RPSRaffle.pendingAmountsUSD(user_addr)).to.equal(
      expected_pending_amount, "Pending amount mismatch"
    );
    expect(await RPSRaffle.lastRaffleTicketId()).to.equal(
      expected_tickets, "Incorrect amount of tickets generated"
    );

    /* 
      ___________________________
      SWAP 2
    
    */
    const input_token2 = DefaultStandardIncentivizedTokens[1];
    const chainId = network.config.chainId!;
    if (input_token2.address !== Native[chainId].address) {
      throw new Error("Must be native currency");
    }

    const swap_amount_raw2 = getRandomFloat(0.5, 2).toFixed(5);
    const swap_amount2 = ethers.parseUnits(
      swap_amount_raw2,
      input_token2.decimals
    );

    // @ts-ignore
    await RPSRouter.connect(user).execute(
      input_token2.address, 
      swap_amount2, 
      user_addr,
      {
        value: swap_amount2
      }
    );
  
    // Check raffle state
    const swap2_amount_usd = await convertToUsd(input_token2, swap_amount2);
    const swap_amount_total = swap_amount_usd + swap2_amount_usd;
    const expected_pending_amount_final = swap_amount_total 
      % BigInt(raffle_params.raffleTicketCostUSD);
    const total_expected_tickets = swap_amount_total 
      / BigInt(raffle_params.raffleTicketCostUSD);

    expect(await RPSRaffle.pendingAmountsUSD(user_addr)).to.equal(
      expected_pending_amount_final, "Final Pending amount mismatch"
    );
    expect(await RPSRaffle.lastRaffleTicketId()).to.equal(
      total_expected_tickets, "Incorrect final amount of tickets generated"
    );
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

    expect(RPSRaffle.addIncentivizedTokens([AddressZero])).to.be.reverted;
    expect(RPSRaffle.configureUsdPriceFeeds([AddressZero], [AddressZero])).to.be.reverted;

    expect(RPSRaffle.fulfillRandomWords(4n)).to.be.revertedWith(
      "Caller must be the operator"
    );
    // TODO add other actions (raffle configuration)
  });

  it('Time-based raffle is drawn; winner can claim',async () => {
    const {
      RPSRaffle,
      RPSRouter,
      owner,
      operator
    } = await loadFixture(deployEverythingFixture);

    const tradeToken = DefaultStandardIncentivizedTokens[0];
    const raffle_params = DefaultSponsoredRaffleCustomVrfParams;

    const [,, user, user2] = await ethers.getSigners();
    await simpleTokenRouterTrade(RPSRouter, tradeToken, user);

    // Wait until the raffle draws
    const raffle_end_time = await RPSRaffle.raffleEndTime();
    expect(raffle_end_time).to.be.greaterThan(raffle_params.rafflePeriod, 
      "Invalid raffle end time");
    await setNextBlockTimestamp(raffle_end_time + 30n);

    // Last trade to trigger the raffle
    const trade_token_2 = DefaultStandardIncentivizedTokens[1];
    await simpleTokenRouterTrade(RPSRouter, trade_token_2, user2);

    /* 
      Check that raffle is triggered
     */
    const pot_id = 0;
    const [is_closed,,] = await RPSRaffle.raffleStatus(pot_id);
    expect(is_closed).to.equal(true, "Raffle is not triggered");
    expect(await RPSRaffle.currentPotId()).to.equal(pot_id + 1, 
      "Pot id is not updated"
    );

    /* 
      Fulfill random number
     */
    const salt = Math.floor(getRandomFloat(1, 10000));
    const next_pot = pot_id + 1;
    // @ts-ignore
    await RPSRaffle.connect(operator).fulfillRandomWords(salt);

    /* 
      Check status and ticket id
     */
    const [,is_drawn,] = await RPSRaffle.raffleStatus(pot_id);
    expect(is_drawn).to.equal(true, "Random number is not fulfilled");
    expect(await RPSRaffle.winningTicketIds(pot_id)).to.be.greaterThan(0,
      "Winner Ticket id is not set"
    );

    /* 
      Finally, execute raffle and check status
     */
    const winner_addr = await user2.getAddress();
    // @ts-ignore
    await RPSRaffle.connect(operator).executeRaffle(winner_addr);
    const [,, winner_set] = await RPSRaffle.raffleStatus(pot_id);
    expect(winner_set).to.equal(true, "Status not updated");

    /* 
      Claim
     */
    const sponsored_token = DefaultSponsoredToken[network.config.chainId!];
    const SponsoredToken = await erc20TokenContract(sponsored_token.address);
    const winnings = await RPSRaffle.claimablePrizes(winner_addr);

    // @ts-ignore
    const tx = RPSRaffle.connect(user2).claim();
    expect(tx).to.changeTokenBalance(
      SponsoredToken,
      user2,
      winnings[1]
    );
    await tx;
  });

});