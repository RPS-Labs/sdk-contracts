import { ChainIdToAddress, Network } from './utils/utils';

export const LINK: ChainIdToAddress = {
  [Network.Ethereum]: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  [Network.HardhatNetwork]: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  [Network.EthereumSepolia]: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  [Network.EthereumGoerli]: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
  [Network.Polygon]: "0xb0897686c545045aFc77CF20eC7A532E3120E0F1"
}

export const LINK_WHALE: ChainIdToAddress = {
  [Network.HardhatNetwork]: "0xF977814e90dA44bFA03b6295A0616a897441aceC",
  [Network.Ethereum]: "0xF977814e90dA44bFA03b6295A0616a897441aceC",
}

export const ROUTER: ChainIdToAddress = {
  [Network.EthereumSepolia]: "set up router",
}

export const OPERATOR: ChainIdToAddress = {
  [Network.Ethereum]: "0x9Cb889A00dcA965D3276E8C5D5A5331b8FA4f089"
};
