const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");
const delay = require("delay");

// JSON file to keep information about previous deployments
const OUTPUT_DEPLOY = require("./deployOutput.json");
let zeroAddress = ethers.constants.AddressZero;

let contractName;
let factory;
let admin;
let benture;

async function main() {
  console.log(`[NOTICE!] Chain of deployment: ${network.name}`);

  // Contract #1: Benture Factory

  // Deploy
  contractName = "BentureFactory";
  console.log(`[${contractName}]: Start of Deployment...`);
  let _contractProto = await ethers.getContractFactory(contractName);
  let contractDeployTx = await _contractProto.deploy();
  factory = await contractDeployTx.deployed();
  console.log(`[${contractName}]: Deployment Finished!`);
  OUTPUT_DEPLOY[network.name][contractName].address = factory.address;

  // Verify
  console.log(`[${contractName}]: Start of Verification...`);

  await delay(90000);

  OUTPUT_DEPLOY[network.name][contractName].address = factory.address;
  if (network.name === "ethereum") {
    url = "https://etherscan.io/address/" + factory.address + "#code";
  } else if (network.name === "mumbai") {
    url = "https://mumbai.polygonscan.com/address/" + factory.address + "#code";
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

  // Contract #2: Benture Admin

  // Deploy
  contractName = "BentureAdmin";
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
  } else if (network.name === "mumbai") {
    url = "https://mumbai.polygonscan.com/address/" + admin.address + "#code";
  }
  OUTPUT_DEPLOY[network.name][contractName].verification = url;

  try {
    await hre.run("verify:verify", {
      address: admin.address,
      constructorArguments: [factory.address],
    });
  } catch (error) {
    console.error(error);
  }
  console.log(`[${contractName}]: Verification Finished!`);

  // ====================================================

  // Contract #3: Benture

  // Deploy
  contractName = "Benture";
  console.log(`[${contractName}]: Start of Deployment...`);
  _contractProto = await ethers.getContractFactory(contractName);
  contractDeployTx = await _contractProto.deploy();
  console.log(
    `Deployment transaction hash: ${contractDeployTx.deployTransaction.hash}`
  );
  benture = await contractDeployTx.deployed();
  console.log(`[${contractName}]: Deployment Finished!`);
  OUTPUT_DEPLOY[network.name][contractName].address = benture.address;

  // Verify
  console.log(`[${contractName}]: Start of Verification...`);

  await delay(90000);

  OUTPUT_DEPLOY[network.name][contractName].address = benture.address;
  if (network.name === "ethereum") {
    url = "https://etherscan.io/address/" + benture.address + "#code";
  } else if (network.name === "mumbai") {
    url = "https://mumbai.polygonscan.com/address/" + benture.address + "#code";
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
