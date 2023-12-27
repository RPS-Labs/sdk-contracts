import { ethers, network } from 'hardhat';
import { RPSRaffleInitializeParams, RPSRaffleCustomVrfInitializeParams, RPSRaffle_Sponsored_CustomVrf_InitParams } from './types';
import { AddressZero } from "@ethersproject/constants";
import { BigNumberish } from 'ethers';

export enum Network {
  // Mainnets
  Ethereum = 1,
  Optimism = 10,
  Bnb = 56,
  Polygon = 137,
  Base = 8453,
  Arbitrum = 42161,
  ArbitrumNova = 42170,
  Avalanche = 43114,
  Linea = 59144,
  Zora = 7777777,
  PolygonZkevm = 1101,
  Scroll = 534352,
  Fantom = 250,
  // Testnets
  EthereumGoerli = 5,
  ZoraTestnet = 999,
  MantleTestnet = 5001,
  LineaTestnet = 59140,
  Fuji = 43113,
  Mumbai = 80001,
  BaseGoerli = 84531,
  ScrollAlpha = 534353,
  EthereumSepolia = 11155111,
  Zksync = 324,
  Ancient8Testnet = 2863311531,
  HardhatNetwork = 31337,
  BnbTestnet = 97,
  FantomTestnet = 4002,
  ArbitrumSepolia = 421614,
}

export type ChainIdToAddress = { [chainId: number]: string };

export type ChainIdToNumber = { [chainId: number]: number };

export const HUNDRED_PERCENT = 10000n;

export const CHAINLINK_VRF_CONFIRMATIONS: ChainIdToNumber = {
  [Network.Ethereum]: 3,
  [Network.EthereumSepolia]: 3,
  [Network.EthereumGoerli]: 3,
  [Network.Bnb]: 3,
  [Network.BnbTestnet]: 3,
  [Network.Polygon]: 10,
  [Network.Mumbai]: 10,
  [Network.Avalanche]: 1,
  [Network.Fuji]: 1,
  [Network.Fantom]: 1,
  [Network.FantomTestnet]: 1,
  [Network.Arbitrum]: 3,
  [Network.ArbitrumSepolia]: 3,
  [Network.HardhatNetwork]: 3
}

/* 
  ______________________
      TOKENS
  _____________________________
 */

export type ChainIdToToken = { [chainId: number]: Token}

export type Token = {
  address: string,
  decimals: number
}

export const USD_DECIMALS = 8;


/* 
  _________________
      DEFAULT PARAMETERS
  _________________________
 */
import { Native, USDC, USDT } from '../Addresses';


export const DefaultSponsoredRaffleCustomVrfParams: RPSRaffle_Sponsored_CustomVrf_InitParams = {
  potLimit: ethers.parseUnits("1000.0", USDT[Network.HardhatNetwork].decimals),
  raffleTicketCostUSD: ethers.parseUnits("3.0", USD_DECIMALS),
  rafflePeriod: 24 * 60 * 60 * 2, // 2 days 
  claimWindow: 24 * 60 * 60 * 7,
  sponsoredToken: USDT[Network.HardhatNetwork].address,
  router: AddressZero,
  owner: AddressZero,
  operator: AddressZero
}

export const DefaultStandardIncentivizedTokens = [
  USDC[Network.HardhatNetwork],
  Native[Network.HardhatNetwork]
];

export const DefaultSponsoredToken = USDT;

export const DefaultPRSRaffleParams: RPSRaffleInitializeParams = {
  potLimit: ethers.parseEther("100.0"),
  raffleTicketCost: ethers.parseEther("0.1"),
  claimWindow: 24 * 60 * 60 * 7, // 7 days
  protocolFeeInBps: 1000n,
  tradeFeeInBps: 1000n,
  callbackGasLimit: 3_000_000,
  vrfConfirmations: CHAINLINK_VRF_CONFIRMATIONS[network.config.chainId!],
  router: AddressZero,
  owner: AddressZero,
  operator: AddressZero
}

export const DefaultRPSPrizeAmounts: Array<BigNumberish> = [
  DefaultPRSRaffleParams.potLimit
];

export const DefaultPRSRaffleCustomVrfParams: RPSRaffleCustomVrfInitializeParams = {
  potLimit: ethers.parseEther("100.0"),
  raffleTicketCost: ethers.parseEther("0.1"),
  claimWindow: 24 * 60 * 60 * 7, // 7 days
  protocolFeeInBps: 1000n,
  tradeFeeInBps: 1000n,
  router: AddressZero,
  owner: AddressZero,
  operator: AddressZero
}

const ChainlinkVRFSupportedNetworks = [
  Network.Ethereum,
  Network.EthereumGoerli,
  Network.EthereumSepolia,
  Network.Bnb,
  Network.BnbTestnet,
  Network.Polygon,
  Network.Mumbai,
  Network.Avalanche,
  Network.Fuji,
  Network.Fantom,
  Network.FantomTestnet,
  Network.Arbitrum,
  Network.ArbitrumSepolia,
];

export const isCustomVrfNetwork = (chainId: number) => {
  if (!chainId) {
    throw new Error("Chain id is invalid");
  }
  return !ChainlinkVRFSupportedNetworks.includes(chainId);
}

export const getRandomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

