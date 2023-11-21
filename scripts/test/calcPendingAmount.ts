import { DefaultPRSRaffleParams } from '../../utils/utils';

export async function calcPendingAmounts(
  trade_amount: bigint,
  ticket_cost?: bigint
) {
  if (!ticket_cost) {
    ticket_cost = BigInt(DefaultPRSRaffleParams.raffleTicketCost);
  }

  return trade_amount % ticket_cost;
}