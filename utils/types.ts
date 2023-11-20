import { BigNumberish } from 'ethers';

export type RPSRaffleInitializeParams = {
  potLimit: BigNumberish,
  raffleTicketCost: BigNumberish,
  claimWindow: number,
  numberOfWinners: number,
  protocolFeeInBps: bigint,
  tradeFeeInBps: bigint,
  callbackGasLimit: BigNumberish,
  vrfConfirmations: number,
  router: string,
  owner: string
}