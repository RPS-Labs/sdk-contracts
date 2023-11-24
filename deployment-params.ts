import { ethers, network } from 'hardhat';
import { RPSRaffleInitializeParams, RPSRouterParams } from './utils/types';
import { CHAINLINK_VRF_CONFIRMATIONS } from './utils/utils';
import { OPERATOR } from './Addresses';

/* 
  FILL IN DEPLOYMENT PARAMETERS
 */
// for details refer to https://rpslabs.gitbook.io/docs/for-developers/smart-contracts/deployment-guide

export const routerParams: RPSRouterParams = {
  owner: '',
  protocol: ''
}

export const raffleParams: RPSRaffleInitializeParams = {
  potLimit: ethers.parseEther("100.0"),
  raffleTicketCost: ethers.parseEther("0.1"),
  claimWindow: 24 * 60 * 60 * 7,
  numberOfWinners: 1,
  protocolFeeInBps: 500n, // 5%
  tradeFeeInBps: 1000n, // 10%
  callbackGasLimit: 250_000n,
  vrfConfirmations: CHAINLINK_VRF_CONFIRMATIONS[network.config.chainId!],
  router: '',
  owner: '',
  operator: OPERATOR[network.config.chainId!]
}