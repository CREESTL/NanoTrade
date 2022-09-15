// SPDX-License-Identifier: MIT

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


describe("Nano Dividend-Paying Token", () => {

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
    // Premint 1M tokens to the Nano contract
    token.giveTokens(nano.address, 1_000_000);


  });

  describe("ERC20 dividends", () => {

    it('Should distribute dividends to a single address', async() => {
      expect(await nano.distributeDividendsEqual([ownerAcc.address], token.address, 10));
    });

    it('Should fail to distribute too high dividends to a single address', async() => {
      await expect(nano.distributeDividendsEqual([ownerAcc.address], token.address, 10_000_000))
      .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it('Should fail to distribute dividends to no receivers', async() => {
      await expect(nano.distributeDividendsEqual([], token.address, 10_000_000))
      .to.be.revertedWith("Nano: no dividends receivers provided!");
    });

    it('Should fail to distribute dividends if caller is not an owner', async() => {
      await expect(nano.connect(clientAcc1).distributeDividendsEqual([], token.address, 10_000_000))
      .to.be.revertedWith("Ownable: caller is not the owner");
    });

  });


  describe("Native tokens dividends", () => {


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

});
