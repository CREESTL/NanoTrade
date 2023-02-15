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
    }
    console.log(`[${contractName}]: Verification Finished!`);

    // ====================================================

    // Contract #2: Benture Factory

    // Deploy proxy and implementation
    contractName = "BentureFactory";
    console.log(`[${contractName}]: Start of Deployment...`);
    _contractProto = await ethers.getContractFactory(contractName);
    factory = await upgrades.deployProxy(_contractProto, [benture.address]);
    await factory.deployed();
    console.log(`[${contractName}]: Deployment Finished!`);
    OUTPUT_DEPLOY[network.name][contractName].proxyAddress = factory.address;

    await delay(90000);

    // Set factory address
    await benture.connect(owner).setFactoryAddress(factory.address);

    // Verify implementation
    console.log(`[${contractName}][Implementation]: Start of Verification...`);

    let factoryImplAddress = await upgrades.erc1967.getImplementationAddress(factory.address);
    OUTPUT_DEPLOY[network.name][contractName].implementationAddress = factoryImplAddress;
    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + factoryImplAddress + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            factoryImplAddress +
            "#code";
    }
    OUTPUT_DEPLOY[network.name][contractName].implementationVerification = url;
    try {
        await hre.run("verify:verify", {
            address: factoryImplAddress,
        });
    } catch (error) {
    }
    // Initialize implementation if it has not been initialized yet
    let factoryImpl = await ethers.getContractAt("BentureFactory", factoryImplAddress);
    try {
        await factoryImpl.initialize(benture.address);
    } catch (error) {
    }
    console.log(`[${contractName}][Implementation]: Verification Finished!`);

    // Verify proxy
    console.log(`[${contractName}][Proxy]: Start of Verification...`);
    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + factory.address + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            factory.address +
            "#code";
        }
    OUTPUT_DEPLOY[network.name][contractName].proxyVerification = url;

    try {
        await hre.run("verify:verify", {
            address: factory.address,
        });
    } catch (error) {
    }
    console.log(`[${contractName}][Proxy]: Verification Finished!`);


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
    OUTPUT_DEPLOY[network.name][contractName].implementationAddress = adminImplAddress;
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
    }
    // Initialize implementation if it has not been initialized before
    let adminImpl = await ethers.getContractAt("BentureAdmin", adminImplAddress);
    try {
        await adminImpl.initialize(factory.address);
    } catch (error) {
    }
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
    }
    console.log(`[${contractName}][Proxy]: Verification Finished!`);

    // ====================================================

    // Contract #4: Benture Salary

    // Deploy proxy and implementation
    contractName = "BentureSalary";
    console.log(`[${contractName}]: Start of Deployment...`);
    _contractProto = await ethers.getContractFactory(contractName);
    salary = await upgrades.deployProxy(_contractProto, [adminToken.address]);
    await salary.deployed();
    console.log(`[${contractName}]: Deployment Finished!`);
    OUTPUT_DEPLOY[network.name][contractName].proxyAddress = salary.address;

    await delay(90000);

    // Verify implementation
    console.log(`[${contractName}][Implementation]: Start of Verification...`);
    let salaryImplAddress = await upgrades.erc1967.getImplementationAddress(salary.address);
    OUTPUT_DEPLOY[network.name][contractName].implementationAddress = salaryImplAddress;
    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + salaryImplAddress + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            salaryImplAddress +
            "#code";
    }
    OUTPUT_DEPLOY[network.name][contractName].implementationVerification = url;
    try {
        await hre.run("verify:verify", {
            address: salaryImplAddress,
        });
    } catch (error) {
    }
    // Initialize implementation if it has not been initialized before
    let salaryImpl = await ethers.getContractAt("BentureSalary", salaryImplAddress);
    try {
        await salaryImpl.initialize(adminToken.address);
    } catch (error) {
    }
    console.log(`[${contractName}][Implementation]: Verification Finished!`);

    // Verify proxy
    console.log(`[${contractName}][Proxy]: Start of Verification...`);
    if (network.name === "polygon_mainnet") {
        url = "https://polygonscan.com/address/" + salary.address + "#code";
    } else if (network.name === "polygon_testnet") {
        url =
            "https://mumbai.polygonscan.com/address/" +
            salary.address +
            "#code";
        }
    OUTPUT_DEPLOY[network.name][contractName].proxyVerification = url;

    try {
        await hre.run("verify:verify", {
            address: salary.address,
        });
    } catch (error) {
    }
    console.log(`[${contractName}][Proxy]: Verification Finished!`);


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
