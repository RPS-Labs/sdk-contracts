import { HardhatUserConfig } from "hardhat/config";
import '@nomiclabs/hardhat-ethers';
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-verify";
import 'hardhat-contract-sizer';
import 'dotenv/config';

const {
  INFURA_MAINNET_API, STAGE, MNEMONIC, INFURA_GOERLI_API
} = process.env;

let forking_url = "";
let forking_block_number = 17704555;

if (STAGE == "FORK_TESTING") {
  if (!INFURA_MAINNET_API) {
    throw new Error("Infura rpc url is not configured");
  }
  forking_url = INFURA_MAINNET_API;
  forking_block_number = Number(process.env.BLOCK_NUMBER);
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000
      }
    }
  },

  networks: {
    hardhat: {
      forking: {
        url: forking_url,
        blockNumber: forking_block_number,
      },
      accounts: {
        accountsBalance: "20000000000000000000000" // 20000 ETH
      }
    },
    goerli: {
      url: INFURA_GOERLI_API,
      chainId: 5,
      accounts: {
        mnemonic: MNEMONIC,
        count: 2,
      }
    },
    mainnet: {
      url: INFURA_MAINNET_API,
      chainId: 1,
      accounts: {
        mnemonic: MNEMONIC,
        count: 2
      }
    },
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_API,
      chainId: 11155111,
      accounts: {
        mnemonic: MNEMONIC,
        count: 2
      }
    }
  },

  gasReporter: {
    currency: 'USD',
    gasPrice: 21
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
}

export default config;

/** @type import('hardhat/config').HardhatUserConfig */
