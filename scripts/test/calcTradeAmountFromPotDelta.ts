import { DefaultPRSRaffleParams, HUNDRED_PERCENT } from '../../utils/utils';

export function calcTradeAmountFromPotDelta(
  potDelta: bigint,
  trade_fee_in_bps?: bigint
): bigint {
  if (!trade_fee_in_bps) {
    trade_fee_in_bps = DefaultPRSRaffleParams.tradeFeeInBps;
  }

  return potDelta * HUNDRED_PERCENT / trade_fee_in_bps;
}