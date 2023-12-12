import { HardhatUserConfig } from "hardhat/config";
import '@nomiclabs/hardhat-ethers';
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-verify";
import 'hardhat-contract-sizer';
import 'dotenv/config';
//import { Network } from './utils/utils';


const getNetworkConfig = (chainId?: number) => {
  if (!chainId) {
    chainId = Number(process.env.CHAIN_ID ?? 31337);
  }

  let url = process.env.RPC_URL;
  if (!url) {
    switch (chainId) {
      // Mainnets
      case 1:
        url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
        break;
      case 10:
        url = `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
        break;
      case 56:
        url = "https://bsc.meowrpc.com";
        break;
      case 137:
        url = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
        break;
      case 324:
        url = "https://mainnet.era.zksync.io";
        break;
      case 1101:
        url = "https://zkevm-rpc.com";
        break;
      case 8453:
        url = "https://developer-access-mainnet.base.org";
        break;
      case 42161:
        url = `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
        break;
      case 42170:
        url = "https://arbitrum-nova.publicnode.com";
        break;
      case 43114:
        url = "https://avalanche-c-chain.publicnode.com";
        break;
      case 59144:
        url = "https://rpc.linea.build";
        break;
      case 7777777:
        url = "https://rpc.zora.co";
        break;
      case 534352:
        url = "https://rpc.scroll.io";
        break;
      case 250:
        url = "https://rpc.ankr.com/fantom";
        break;
      // Testnets
      case 5:
        url = `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
        break;
      case 999:
        url = "https://testnet.rpc.zora.co";
        break;
      case 5001:
        url = "https://rpc.testnet.mantle.xyz";
        break;
      case 59140:
        url = "https://rpc.goerli.linea.build/";
        break;
      case 80001:
        url = `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
        break;
      case 84531:
        url = "https://goerli.base.org";
        break;
      case 534353:
        url = "https://alpha-rpc.scroll.io/l2";
        break;
      case 11155111:
        url = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
        break;
      case 2863311531:
        url = "https://rpc-testnet.ancient8.gg/";
        break;
      case 97:
        url = "https://bsc-testnet.drpc.org/";
        break;
      case 43113:
        url="https://avalanche-fuji-c-chain.publicnode.com";
        break;
      case 31337:
        url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
        break;
      case 4002:
        url = "https://fantom-testnet.publicnode.com";
        break;
      case 421614:
        url = "https://sepolia-rollup.arbitrum.io/rpc";
        break;
      default:
        throw new Error("Unsupported chain id");
    }
  }

  const config = {
    chainId,
    url,
    accounts: process.env.DEPLOYER_PK ? [process.env.DEPLOYER_PK] : undefined,
  };

  // For zkSync
  if (chainId === 324) {
    return {
      ...config,
      ethNetwork: "mainnet",
      zksync: true,
    };
  }

  return config;
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000
          }
        }
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000
          }
        }
      }  
    ]
  },

  defaultNetwork: "lineaTestnet",

  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY,
        blockNumber: Number(process.env.BLOCK_NUMBER) || 17704555,
      },
      accounts: {
        accountsBalance: "20000000000000000000000" // 20000 ETH
      }
    },
    mainnet: getNetworkConfig(1),
    fantom: getNetworkConfig(250),
    optimism: getNetworkConfig(10),
    bsc: getNetworkConfig(56),
    polygon: getNetworkConfig(137),
    zkSync: getNetworkConfig(324),
    polygonZkevm: getNetworkConfig(1101),
    base: getNetworkConfig(8453),
    arbitrum: getNetworkConfig(42161),
    arbitrumNova: getNetworkConfig(42170),
    avalanche: getNetworkConfig(43114),
    linea: getNetworkConfig(59144),
    zora: getNetworkConfig(7777777),
    scroll: getNetworkConfig(534352),
    // Testnets
    fuji: getNetworkConfig(43113),
    arbitrumSepolia: getNetworkConfig(421614),
    fantomTestnet: getNetworkConfig(4002),
    goerli: getNetworkConfig(5),
    zoraTestnet: getNetworkConfig(999),
    mantleTestnet: getNetworkConfig(5001),
    lineaTestnet: getNetworkConfig(59140),
    mumbai: getNetworkConfig(80001),
    baseGoerli: getNetworkConfig(84531),
    scrollAlpha: getNetworkConfig(534353),
    sepolia: getNetworkConfig(11155111),
    ancient8Testnet: getNetworkConfig(2863311531),
  },

  gasReporter: {
    currency: 'USD',
    gasPrice: 40
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "linea",
        chainId: 59144,
        urls: {
          browserURL: "https://lineascan.build",
          apiURL: "https://api.lineascan.build/api"
        }
      },
      {
        network: "mantleTestnet",
        chainId: 5001,
        urls: {
          apiURL: "https://explorer.testnet.mantle.xyz/api",
          browserURL: "https://explorer.testnet.mantle.xyz",
        },
      },
      {
        network: "lineaTestnet",
        chainId: 59140,
        urls: {
          apiURL: "https://explorer.goerli.linea.build/api",
          browserURL: "https://explorer.goerli.linea.build",
        },
      },
      {
        network: "scrollAlpha",
        chainId: 534353,
        urls: {
          apiURL: "https://blockscout.scroll.io/api",
          browserURL: "https://blockscout.scroll.io/",
        },
      },
      {
        network: "ancient8Testnet",
        chainId: 2863311531,
        urls: {
          apiURL: "https://testnet.a8scan.io/api",
          browserURL: "https://testnet.a8scan.io/",
        },
      },
      {
        network: "zoraTestnet",
        chainId: 999,
        urls: {
          apiURL: "https://testnet.explorer.zora.energy/api",
          browserURL: "https://testnet.explorer.zora.energy/",
        },
      },
    ]
  }
}

export default config;

/** @type import('hardhat/config').HardhatUserConfig */
