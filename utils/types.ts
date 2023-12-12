import { BigNumberish } from 'ethers';

export type RPSRaffleInitializeParams = {
  potLimit: BigNumberish,
  raffleTicketCost: BigNumberish,
  claimWindow: number,
  protocolFeeInBps: bigint,
  tradeFeeInBps: bigint,
  callbackGasLimit: BigNumberish,
  vrfConfirmations: number,
  router: string,
  owner: string,
  operator: string
}

export type RPSRouterParams = {
  owner: string,
  protocol: string
}

export type RPSRaffleCustomVrfInitializeParams = {
  potLimit: BigNumberish,
  raffleTicketCost: BigNumberish,
  claimWindow: number,
  protocolFeeInBps: bigint,
  tradeFeeInBps: bigint,
  router: string,
  owner: string,
  operator: string
}

export type RPSRaffleArbitraryInitParams = 
  RPSRaffleInitializeParams &
  RPSRaffleCustomVrfInitializeParams; 

export type BatchTradeParams = {
  tradeAmount: BigNumberish;
  user: string;
}