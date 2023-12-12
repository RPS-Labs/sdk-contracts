import { ethers, network } from 'hardhat';
import { RPSRaffleArbitraryInitParams, RPSRaffleCustomVrfInitializeParams, RPSRaffleInitializeParams, RPSRouterParams } from './utils/types';
import { CHAINLINK_VRF_CONFIRMATIONS } from './utils/utils';
import { OPERATOR } from './Addresses';

/* 
  FILL IN DEPLOYMENT PARAMETERS
 */
// for details refer to https://rpslabs.gitbook.io/docs/for-developers/smart-contracts/deployment-guide

export const routerParams: RPSRouterParams = {
  owner: '0xe2D3f8c3C5597736ea34F1A24C6D3C9000e9796e',
  protocol: '0x5782113b089103F58F91890548b153daCc56A32A'
}

export const raffleParams: RPSRaffleInitializeParams | RPSRaffleCustomVrfInitializeParams = {
  potLimit: ethers.parseEther("1.0"),
  raffleTicketCost: ethers.parseEther("0.2"),
  claimWindow: 24 * 60 * 60 * 7,
  protocolFeeInBps: 500n, // 5%
  tradeFeeInBps: 1000n, // 10%
  //callbackGasLimit: 250_000n, // remove this if Chainlink VRF doesn't support the target chain
  //vrfConfirmations: CHAINLINK_VRF_CONFIRMATIONS[network.config.chainId!], // remove this if Chainlink VRF doesn't support the target chain
  router: '0x352DFD20F0af84683dAD7980301A566e7A3De259',
  owner: '0xe2D3f8c3C5597736ea34F1A24C6D3C9000e9796e',
  operator: OPERATOR[network.config.chainId!]
}