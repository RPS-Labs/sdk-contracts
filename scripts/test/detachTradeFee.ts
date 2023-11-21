import { DefaultPRSRaffleParams, HUNDRED_PERCENT } from '../../utils/utils';

export function detachTradeFee(
  trade_amount: bigint,
  fee_in_bps?: bigint
): bigint {
  if (!fee_in_bps) {
    fee_in_bps = DefaultPRSRaffleParams.tradeFeeInBps;
  }

  return trade_amount * (HUNDRED_PERCENT - fee_in_bps) / HUNDRED_PERCENT;
}