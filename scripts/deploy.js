const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");
const delay = require("delay");
require("dotenv").config();

// JSON file to keep information about previous deployments
const OUTPUT_DEPLOY = require("./deployOutput.json");

let contractName;
let factory;
let adminToken;
let benture;

async function main() {
    console.log(`[NOTICE!] Chain of deployment: ${network.name}`);

    let [owner] = await ethers.getSigners();

    // ====================================================

    // Contract #1: Benture

    // Deploy
    contractName = "Benture";
    console.log(`[${contractName}]: Start of Deployment...`);
    let _contractProto = await ethers.getContractFactory(contractName);
    let contractDeployTx = await _contractProto.deploy();
    benture = await contractDeployTx.deployed();
    console.log(`[${contractName}]: Deployment Finished!`);
    OUTPUT_DEPLOY[network.name][contractName].address = benture.address;

    // Verify
    console.log(`[${contractName}]: Start of Verification...`);

    await delay(90000);

    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + benture.address + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            benture.address +
            "#code";
    }
    OUTPUT_DEPLOY[network.name][contractName].verification = url;

    try {
        await hre.run("verify:verify", {
            address: benture.address,
        });
    } catch (error) {
        console.error(error);
    }
    console.log(`[${contractName}]: Verification Finished!`);

    // ====================================================

    // Contract #2: Benture Factory

    // Deploy
    contractName = "BentureFactory";
    console.log(`[${contractName}]: Start of Deployment...`);
    _contractProto = await ethers.getContractFactory(contractName);
    contractDeployTx = await _contractProto.deploy(benture.address);
    factory = await contractDeployTx.deployed();
    console.log(`[${contractName}]: Deployment Finished!`);
    OUTPUT_DEPLOY[network.name][contractName].address = factory.address;

    // Set factory address
    await benture.connect(owner).setFactoryAddress(factory.address);

    // Verify
    console.log(`[${contractName}]: Start of Verification...`);

    await delay(90000);

    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + factory.address + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            factory.address +
            "#code";
    }
    OUTPUT_DEPLOY[network.name][contractName].verification = url;

    try {
        await hre.run("verify:verify", {
            address: factory.address,
            constructorArguments: [benture.address],
        });
    } catch (error) {
        console.error(error);
    }
    console.log(`[${contractName}]: Verification Finished!`);

    // ====================================================

    // Contract #3: Benture Admin

    // Deploy
    contractName = "BentureAdmin";
    console.log(`[${contractName}]: Start of Deployment...`);
    _contractProto = await ethers.getContractFactory(contractName);
    contractDeployTx = await _contractProto.deploy(factory.address);
    adminToken = await contractDeployTx.deployed();
    console.log(`[${contractName}]: Deployment Finished!`);
    OUTPUT_DEPLOY[network.name][contractName].address = adminToken.address;

    // Verify
    console.log(`[${contractName}]: Start of Verification...`);

    await delay(90000);

    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + adminToken.address + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            adminToken.address +
            "#code";
    }
    OUTPUT_DEPLOY[network.name][contractName].verification = url;

    try {
        await hre.run("verify:verify", {
            address: adminToken.address,
            constructorArguments: [factory.address],
        });
    } catch (error) {
        console.error(error);
    }
    console.log(`[${contractName}]: Verification Finished!`);

    // ====================================================

    // Contract #4: Benture Salary

    // Deploy
    contractName = "BentureSalary";
    console.log(`[${contractName}]: Start of Deployment...`);
    _contractProto = await ethers.getContractFactory(contractName);
    contractDeployTx = await _contractProto.deploy(adminToken.address);
    salary = await contractDeployTx.deployed();
    console.log(`[${contractName}]: Deployment Finished!`);
    OUTPUT_DEPLOY[network.name][contractName].address = salary.address;

    // Verify
    console.log(`[${contractName}]: Start of Verification...`);

    await delay(90000);

    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + salary.address + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            salary.address +
            "#code";
    }
    OUTPUT_DEPLOY[network.name][contractName].verification = url;

    try {
        await hre.run("verify:verify", {
            address: salary.address,
            constructorArguments: [adminToken.address],
        });
    } catch (error) {
        console.error(error);
    }
    console.log(`[${contractName}]: Verification Finished!`);

    // ====================================================

    fs.writeFileSync(
        path.resolve(__dirname, "./deployOutput.json"),
        JSON.stringify(OUTPUT_DEPLOY, null, "  ")
    );

    console.log(
        `\n***Deployment and verification are completed!***\n***See Results in "${
            __dirname + "/deployOutput.json"
        }" file***`
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
