require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-chai-matchers");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("@primitivefi/hardhat-dodoc");

const { POLYGONSCAN_API_KEY, ACC_PRIVATE_KEY } = process.env;

module.exports = {
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        // Polygon Mumbai testnet
        mumbai: {
            url: "https://rpc-mumbai.maticvigil.com",
            accounts: [ACC_PRIVATE_KEY],
        },
        // Polygon mainnet
        ethereum: {
            url: "https://polygon-rpc.com",
            accounts: [ACC_PRIVATE_KEY],
        },
    },
    mocha: {
        timeout: 20000000000,
    },
    paths: {
        sources: "./contracts/",
        tests: "./test/",
    },
    etherscan: {
        apiKey: {
            polygonMumbai: POLYGONSCAN_API_KEY,
        },
    },
    skipFiles: ["node_modules"],
    gasReporter: {
        enabled: true,
        url: "http://localhost:8545",
    },
    dodoc: {
        exclude: ["mocks"],
        runOnCompile: false,
        freshOutput: true,
        outputDir: "./docs/contracts",
    },
};
