const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");
const delay = require("delay");

// JSON file to keep information about previous deployments
const OUTPUT_DEPLOY = require("./deployOutput.json");

let contractName;

async function main() {

  console.log(`[NOTICE!] Chain of deployment: ${network.name}`);

  // Contract #1: Nano Factory

  // Deploy
  contractName = "NanoFactory";
  console.log(`[${contractName}]: Start of Deployment...`);
  _contractProto = await ethers.getContractFactory(contractName);
  contractDeployTx = await _contractProto.deploy();
  factory = await contractDeployTx.deployed();
  console.log(`[${contractName}]: Deployment Finished!`);
  OUTPUT_DEPLOY[network.name][contractName].address = factory.address;

  // Verify
  console.log(`[${contractName}]: Start of Verification...`);
  
  await delay(90000);

  OUTPUT_DEPLOY[network.name][contractName].address = factory.address;
  if (network.name === "ethereum") {
    url = "https://etherscan.io/address/" + factory.address + "#code";
  } else if (network.name === "goerli") {
    url = "https://goerli.etherscan.io/address/" + factory.address + "#code";
  }
  OUTPUT_DEPLOY[network.name][contractName].verification = url;
  
  try { 
    await hre.run("verify:verify", {
      address: factory.address,
    });
  } catch (error) {
    console.error(error);
  }
  console.log(`[${contractName}]: Verification Finished!`);

  // ====================================================

  // Contract #2: Nano Admin

  // Deploy
  contractName = "NanoAdmin";
  console.log(`[${contractName}]: Start of Deployment...`);
  _contractProto = await ethers.getContractFactory(contractName);
  contractDeployTx = await _contractProto.deploy(factory.address);
  admin = await contractDeployTx.deployed();
  console.log(`[${contractName}]: Deployment Finished!`);
  OUTPUT_DEPLOY[network.name][contractName].address = admin.address;

  // Verify
  console.log(`[${contractName}]: Start of Verification...`);

  await delay(90000);

  OUTPUT_DEPLOY[network.name][contractName].address = admin.address;
  if (network.name === "ethereum") {
    url = "https://etherscan.io/address/" + admin.address + "#code";
  } else if (network.name === "goerli") {
    url = "https://goerli.etherscan.io/address/" + admin.address + "#code";
  }
  OUTPUT_DEPLOY[network.name][contractName].verification = url;
  
  try { 
    await hre.run("verify:verify", {
      address: admin.address,
      constructorArguments: [
        factory.address
      ]
    });
  } catch (error) {
    console.error(error);
  }
  console.log(`[${contractName}]: Verification Finished!`);

  // ====================================================

  // Contract #3: Nano

  // Deploy
  contractName = "Nano";
  console.log(`[${contractName}]: Start of Deployment...`);
  _contractProto = await ethers.getContractFactory(contractName);
  contractDeployTx = await _contractProto.deploy();
  nano = await contractDeployTx.deployed();
  console.log(`[${contractName}]: Deployment Finished!`);
  OUTPUT_DEPLOY[network.name][contractName].address = nano.address;

  // Verify
  console.log(`[${contractName}]: Start of Verification...`);

  await delay(90000);

  OUTPUT_DEPLOY[network.name][contractName].address = nano.address;
  if (network.name === "ethereum") {
    url = "https://etherscan.io/address/" + nano.address + "#code";
  } else if (network.name === "goerli") {
    url = "https://goerli.etherscan.io/address/" + nano.address + "#code";
  }
  OUTPUT_DEPLOY[network.name][contractName].verification = url;
  
  try { 
    await hre.run("verify:verify", {
      address: nano.address,
    });
  } catch (error) {
    console.error(error);
  }
  console.log(`[${contractName}]: Verification Finished!`);

  // ====================================================

  console.log(`See Results in "${__dirname + '/deployOutput.json'}" File`);
  
  fs.writeFileSync(
    path.resolve(__dirname, "./deployOutput.json"),
    JSON.stringify(OUTPUT_DEPLOY, null, "  ")
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
