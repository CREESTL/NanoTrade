require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-chai-matchers");
require("solidity-coverage");
require("hardhat-gas-reporter");

const {
        ETHERSCAN_API_KEY,
        ACC_PRIVATE_KEY,
        INFURA_API_KEY
    } = process.env;

module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Ethereum Goerli testnet
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [ACC_PRIVATE_KEY]
    },
    // Ethereum mainnet
    ethereum: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [ACC_PRIVATE_KEY]
    }
  },
  mocha: {
    timeout: 20000000000
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY
    }
  },
  skipFiles: ["node_modules"],
    gasReporter: {
        enabled: true,
        url: "http://localhost:8545"
    },
};
