import { ethers } from 'hardhat';
import { RPSRaffleInitializeParams } from './types';
import { AddressZero } from "@ethersproject/constants";

export enum Network {
  // Mainnets
  Ethereum = 1,
  Optimism = 10,
  Bsc = 56,
  Polygon = 137,
  Base = 8453,
  Arbitrum = 42161,
  ArbitrumNova = 42170,
  Avalanche = 43114,
  Linea = 59144,
  Zora = 7777777,
  PolygonZkevm = 1101,
  Scroll = 534352,
  // Testnets
  EthereumGoerli = 5,
  ZoraTestnet = 999,
  MantleTestnet = 5001,
  LineaTestnet = 59140,
  Mumbai = 80001,
  BaseGoerli = 84531,
  ScrollAlpha = 534353,
  EthereumSepolia = 11155111,
  Zksync = 324,
  Ancient8Testnet = 2863311531,
}

export type ChainIdToAddress = { [chainId: number]: string };

export const HUNDRED_PERCENT = 10000n;

export const DefaultPRSRaffleParams: RPSRaffleInitializeParams = {
  potLimit: ethers.parseEther("100.0"),
  raffleTicketCost: ethers.parseEther("0.1"),
  claimWindow: 24 * 60 * 60, // 1 day
  numberOfWinners: 1,
  protocolFeeInBps: HUNDRED_PERCENT / 10n,
  tradeFeeInBps: HUNDRED_PERCENT / 10n,
  callbackGasLimit: 3_000_000,
  vrfConfirmations: 1,
  router: AddressZero,
  owner: AddressZero
}

export const getRandomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

