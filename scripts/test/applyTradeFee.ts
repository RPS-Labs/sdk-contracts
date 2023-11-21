import { DefaultPRSRaffleParams, HUNDRED_PERCENT } from '../../utils/utils';

export function applyTradeFee(
  amount: bigint,
  fee_in_bps?: bigint
): bigint {
  if (!fee_in_bps) {
    fee_in_bps = DefaultPRSRaffleParams.tradeFeeInBps;
  }

  return amount * HUNDRED_PERCENT / (HUNDRED_PERCENT - fee_in_bps);
}