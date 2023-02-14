const { ethers, network, upgrades } = require("hardhat");
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

    // Deploy proxy and implementation
    contractName = "BentureAdmin";
    console.log(`[${contractName}]: Start of Deployment...`);
    _contractProto = await ethers.getContractFactory(contractName);
    adminToken = await upgrades.deployProxy(_contractProto, [factory.address]);
    await adminToken.deployed();
    console.log(`[${contractName}]: Deployment Finished!`);
    OUTPUT_DEPLOY[network.name][contractName].proxyAddress = adminToken.address;
    await delay(90000);

    // Verify implementation
    console.log(`[${contractName}][Implementation]: Start of Verification...`);
    let adminImplAddress = await upgrades.erc1967.getImplementationAddress(adminToken.address);
    OUTPUT_DEPLOY[network.name][contractName].implementationAddress = adminImplAddress.address;
    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + adminImplAddress + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            adminImplAddress +
            "#code";
    }
    OUTPUT_DEPLOY[network.name][contractName].implementationVerification = url;
    try {
        await hre.run("verify:verify", {
            address: adminImplAddress,
        });
    } catch (error) {
        console.error(error);
    }
    // Initialize implementation
    let adminImpl = await ethers.getContractAt("BentureAdmin", adminImplAddress);
    await adminImpl.initialize(factory.address);
    console.log(`[${contractName}][Implementation]: Verification Finished!`);

    // Verify proxy
    console.log(`[${contractName}][Proxy]: Start of Verification...`);
    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + adminToken.address + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            adminToken.address +
            "#code";
        }
    OUTPUT_DEPLOY[network.name][contractName].proxyVerification = url;

    try {
        await hre.run("verify:verify", {
            address: adminToken.address,
        });
    } catch (error) {
        console.error(error);
    }
    console.log(`[${contractName}][Proxy]: Verification Finished!`);

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
        `\n***Deployment and verification are completed!***\n***See Results in "${__dirname + "/deployOutput.json"
        }" file***`
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
