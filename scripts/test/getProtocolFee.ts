import { DefaultPRSRaffleParams, HUNDRED_PERCENT } from '../../utils/utils';

export function getProtocolFeeFromDelta(
  raffle_delta: bigint,
  protocol_fee_in_bps?: bigint
): bigint {
  if (!protocol_fee_in_bps) {
    protocol_fee_in_bps = DefaultPRSRaffleParams.protocolFeeInBps;
  }

  return raffle_delta * protocol_fee_in_bps / HUNDRED_PERCENT;
}