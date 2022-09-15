// SPDX-License-Identifier: MIT

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


describe('Nano Dividend-Paying Token', () => {

  let nano;
  let token;

  // Deploy all contracts before each test suite
  beforeEach( async () => {
    [ownerAcc, clientAcc1, clientAcc2] = await ethers.getSigners();

    let nanoTx = await ethers.getContractFactory("Nano");
    nano = await nanoTx.deploy();
    await nano.deployed();

    let dummyTx = await ethers.getContractFactory("Dummy");
    token = await dummyTx.deploy();
    await token.deployed();
    token.giveTokens(ownerAcc, 1_000_000);


  });


  it('Should have correct name, symbol and decimals', async() => {
    expect(await token.name()).to.equal("Integral");
    expect(await token.symbol()).to.equal("SFXDX");
    expect(await token.decimals()).to.equal(18);
  });

  it('Should only mint tokens if caller is a bridge', async() => {
    let amount = ethers.utils.parseUnits("10", 18);

    // Call from a client should fail
    await expect(token.connect(clientAcc1).mint(clientAcc2.address, amount))
    .to.be.revertedWith("Token: caller is not a bridge!");

    expect(await token.balanceOf(clientAcc1.address)).to.equal(0);
    // Call from a bridge should secceed
    await expect(token.connect(bridgeAcc).mint(clientAcc1.address, amount))
    .to.emit(token, "Mint")
    .withArgs(anyValue, amount);
    expect(await token.balanceOf(clientAcc1.address)).to.equal(amount);

  });

  it('Should only burn tokens if caller is a bridge', async() => {
    let amount = ethers.utils.parseUnits("10", 18);
    // First mint some tokens to the client
    await expect(token.connect(bridgeAcc).mint(clientAcc1.address, amount))
    .to.emit(token, "Mint")
    .withArgs(anyValue, amount);

    // Call from a client should fail
    await expect(token.connect(clientAcc2).burn(clientAcc1.address, amount))
    .to.be.revertedWith("Token: caller is not a bridge!");

    // Call from a bridge should secceed
    expect(await token.balanceOf(clientAcc1.address)).to.equal(amount);
    await expect(token.connect(bridgeAcc).burn(clientAcc1.address, amount))
    .to.emit(token, "Burn")
    .withArgs(anyValue, amount);
    expect(await token.balanceOf(clientAcc1.address)).to.equal(0);
    
  });

  it('Should return correct address of the bridge', async() => {
    expect(await token.bridge()).to.equal(bridgeAcc.address);
    
  });  
});
