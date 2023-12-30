import { AddressZero } from '@ethersproject/constants';
import { ChainIdToAddress, ChainIdToToken, Network, Token } from './utils/utils';

export const LINK: ChainIdToAddress = {
  [Network.Ethereum]: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  [Network.HardhatNetwork]: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  [Network.EthereumSepolia]: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  [Network.EthereumGoerli]: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
  [Network.Polygon]: "0xb0897686c545045aFc77CF20eC7A532E3120E0F1",
  [Network.Bnb]: "0x404460C6A5EdE2D891e8297795264fDe62ADBB75",
  [Network.BnbTestnet]: "0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06",
  [Network.Mumbai]: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
  [Network.Avalanche]: "0x5947BB275c521040051D82396192181b413227A3",
  [Network.Fuji]: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
  [Network.Fantom]: "0x6F43FF82CCA38001B6699a8AC47A2d0E66939407",
  [Network.FantomTestnet]: "0xfaFedb041c0DD4fA2Dc0d87a6B0979Ee6FA7af5F",
  [Network.Arbitrum]: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
  [Network.ArbitrumSepolia]: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E"
}

export const VRFV2Wrapper: ChainIdToAddress = {
  [Network.Ethereum]: "0x5A861794B927983406fCE1D062e00b9368d97Df6",
  [Network.EthereumSepolia]: "0xab18414CD93297B0d12ac29E63Ca20f515b3DB46",
  [Network.EthereumGoerli]: "0x708701a1DfF4f478de54383E49a627eD4852C816",
  [Network.Bnb]: "0x721DFbc5Cfe53d32ab00A9bdFa605d3b8E1f3f42",
  [Network.BnbTestnet]: "0x699d428ee890d55D56d5FC6e26290f3247A762bd",
  [Network.Polygon]: "0x4e42f0adEB69203ef7AaA4B7c414e5b1331c14dc",
  [Network.Mumbai]: "0x99aFAf084eBA697E584501b8Ed2c0B37Dd136693",
  [Network.Avalanche]: "0x721DFbc5Cfe53d32ab00A9bdFa605d3b8E1f3f42",
  [Network.Fuji]: "0x9345AC54dA4D0B5Cda8CB749d8ef37e5F02BBb21",
  [Network.Fantom]: "0xeDA5B00fB33B13c730D004Cf5D1aDa1ac191Ddc2",
  [Network.FantomTestnet]: "0x38336BDaE79747a1d2c4e6C67BBF382244287ca6",
  [Network.Arbitrum]: "0x2D159AE3bFf04a10A355B608D22BDEC092e934fa",
  [Network.ArbitrumSepolia]: "0x1D3bb92db7659F2062438791F131CFA396dfb592"
}

export const LINK_WHALE: ChainIdToAddress = {
  [Network.HardhatNetwork]: "0xF977814e90dA44bFA03b6295A0616a897441aceC",
  [Network.Ethereum]: "0xF977814e90dA44bFA03b6295A0616a897441aceC",
}

export const OPERATOR: ChainIdToAddress = {
  [Network.Ethereum]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.EthereumSepolia]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.EthereumGoerli]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.Polygon]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.Bnb]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.BnbTestnet]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.Mumbai]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.Avalanche]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.Fuji]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.Fantom]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.FantomTestnet]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.Arbitrum]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.ArbitrumSepolia]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.Linea]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089",
  [Network.LineaTestnet]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089"
};

export const USDT: ChainIdToToken = {
  [Network.Ethereum]: {
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    decimals: 6
  },
  [Network.HardhatNetwork]: {
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    decimals: 6
  }
}

export const Native: ChainIdToToken = {
  [Network.Ethereum]: {
    address: AddressZero,
    decimals: 18
  },
  [Network.HardhatNetwork]: {
    address: AddressZero,
    decimals: 18
  }
}

export const USDC: ChainIdToToken = {
  [Network.Ethereum]: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6
  },
  [Network.HardhatNetwork]: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6
  }
}

export const BUSD: ChainIdToToken = {
  [Network.Ethereum]: {
    address: "0x4fabb145d64652a948d72533023f6e7a623c7c53",
    decimals: 18
  },
  [Network.HardhatNetwork]: {
    address: "0x4fabb145d64652a948d72533023f6e7a623c7c53",
    decimals: 18
  }
}

export const ETH_USD_PAIR: ChainIdToAddress = {
  [Network.Linea]: "0x3c6Cd9Cc7c7a4c2Cf5a82734CD249D7D593354dA",
  [Network.LineaTestnet]: "0xcCFF6C2e770Faf4Ff90A7760E00007fd32Ff9A97",
  [Network.Ethereum]: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  [Network.HardhatNetwork]: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
}

export const USDT_USD_PAIR: ChainIdToAddress = {
  [Network.Ethereum]: "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46",
  [Network.HardhatNetwork]: "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46",
  [Network.LineaTestnet]: "0x8B1837bC2FC51D2496fee858e28B75708bfF5c16",
  [Network.Linea]: "0xefCA2bbe0EdD0E22b2e0d2F8248E99F4bEf4A7dB"
}

export const USDC_USD_PAIR: ChainIdToAddress = {
  [Network.Ethereum]: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
  [Network.HardhatNetwork]: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
  [Network.LineaTestnet]: "0xd8d927e5d52Bb7cdb2C0ae6f55ACcB18e9a2B9D7",
  [Network.Linea]: "0xAADAa473C1bDF7317ec07c915680Af29DeBfdCb5"
}

export const BUSD_USD_PAIR: ChainIdToAddress = {
  [Network.Ethereum]: "0x833D8Eb16D306ed1FbB5D7A2E019e106B960965A",
  [Network.HardhatNetwork]: "0x833D8Eb16D306ed1FbB5D7A2E019e106B960965A"
}

const EthereumPriceFeedsByToken = new Map<Token, string>();
const HardhatPriceFeedsByToken = new Map<Token, string>();
const LineaTestnetFeedsByToken = new Map<Token, string>();
const LineaFeedsByToken = new Map<Token, string>();

/* 
  Mainnet feeds
 */
EthereumPriceFeedsByToken.set(Native[Network.Ethereum], ETH_USD_PAIR[Network.Ethereum]);
EthereumPriceFeedsByToken.set(USDC[Network.Ethereum], USDC_USD_PAIR[Network.Ethereum]);
HardhatPriceFeedsByToken.set(USDC[Network.HardhatNetwork], USDC_USD_PAIR[Network.HardhatNetwork]);
HardhatPriceFeedsByToken.set(Native[Network.HardhatNetwork], ETH_USD_PAIR[Network.HardhatNetwork]);
/* 
  Linea feeds
 */
LineaTestnetFeedsByToken.set(USDC[Network.LineaTestnet], USDC_USD_PAIR[Network.LineaTestnet]);
LineaTestnetFeedsByToken.set(Native[Network.LineaTestnet], ETH_USD_PAIR[Network.LineaTestnet]);
LineaFeedsByToken.set(USDC[Network.Linea], USDC_USD_PAIR[Network.Linea]);
LineaFeedsByToken.set(Native[Network.Linea], ETH_USD_PAIR[Network.Linea]);

export const FeedsByNetwork: {[chainId: number]: Map<Token, string>} = {
  [Network.Ethereum]: EthereumPriceFeedsByToken,
  [Network.HardhatNetwork]: HardhatPriceFeedsByToken,
  [Network.LineaTestnet]: LineaTestnetFeedsByToken,
  [Network.Linea]: LineaFeedsByToken
}

export const TokenWhale: Map<Token, string> = new Map<Token, string>();
TokenWhale.set(USDT[Network.Ethereum], "0xF977814e90dA44bFA03b6295A0616a897441aceC");
TokenWhale.set(USDT[Network.HardhatNetwork], "0xF977814e90dA44bFA03b6295A0616a897441aceC");
TokenWhale.set(USDC[Network.HardhatNetwork], "0xF977814e90dA44bFA03b6295A0616a897441aceC");
TokenWhale.set(USDC[Network.Ethereum], "0xF977814e90dA44bFA03b6295A0616a897441aceC");
