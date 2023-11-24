import { ethers, network } from 'hardhat';
import { RPSRaffleInitializeParams, RPSRouterParams } from './utils/types';
import { CHAINLINK_VRF_CONFIRMATIONS } from './utils/utils';
import { OPERATOR } from './Addresses';

/* 
  FILL IN DEPLOYMENT PARAMETERS
 */

export const routerParams: RPSRouterParams = {
  owner: '0xe2D3f8c3C5597736ea34F1A24C6D3C9000e9796e',
  protocol: '0xDc03FE9D6f642e031e83162401F29040F882910F'
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
  router: '0x2b416A200FFbCA827C0Bc26985a9ecb612E4B6eD',
  owner: '0xe2D3f8c3C5597736ea34F1A24C6D3C9000e9796e',
  operator: OPERATOR[network.config.chainId!]
}