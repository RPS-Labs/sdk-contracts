import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { DefaultPRSRaffleParams, getRandomFloat } from '../../utils/utils';
import { encodeStakingCall } from './encodeStakingCall';
import { applyTradeFee } from './applyTradeFee';
import { calcTradeAmountFromPotDelta } from './calcTradeAmountFromPotDelta';
import { detachTradeFee } from './detachTradeFee';

export async function tradeToFillPot(
  RPSRouter: Contract
) {
  const [, user] = await ethers.getSigners();
  const user_addr = await user.getAddress();
  const pot_limit = BigInt(DefaultPRSRaffleParams.potLimit); 

  const buffer = pot_limit / 8n;
  const pot_delta = pot_limit + buffer;
  const trade_amount = calcTradeAmountFromPotDelta(pot_delta);
  const staking_amount = detachTradeFee(trade_amount);

  const data = encodeStakingCall(user_addr, staking_amount);

  // @ts-ignore
  return RPSRouter.connect(user).execute(data, trade_amount, {value: trade_amount});
}