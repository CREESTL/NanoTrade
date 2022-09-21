// SPDX-License-Identifier: MIT

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


describe("Nano Dividend-Paying Token", () => {

  let nano;
  let origToken;
  let token_2;

  // Deploy all contracts before each test suite
  beforeEach( async () => {
    [ownerAcc, clientAcc1, clientAcc2] = await ethers.getSigners();

    let nanoTx = await ethers.getContractFactory("Nano");
    nano = await nanoTx.deploy();
    await nano.deployed();

    let dummyTx = await ethers.getContractFactory("Dummy");
    origToken = await dummyTx.deploy();
    await origToken.deployed();
    // Deploy the same contract the second time to get another address
    distToken = await dummyTx.deploy();
    // Premint 1M tokens to the Nano contract
    distToken.giveTokens(nano.address, 1_000_000);
    await distToken.deployed();


  });

  describe("ERC20 dividends", () => {

    describe("Equal dividends", () => {

      it('Should distribute dividends to a single address', async() => {
        let startBalance = await distToken.balanceOf(ownerAcc.address);
        expect(await nano.distributeDividendsEqual([ownerAcc.address], distToken.address, 10))
        .to.emit(nano, "DividendsDistributed")
        .withArgs(anyValue, anyValue);
        let endBalance = await distToken.balanceOf(ownerAcc.address);
        expect(endBalance.sub(startBalance)).to.equal(10);
      });

      it('Should distribute dividends to a list of addresses', async() => {
        let startBalance1 = await distToken.balanceOf(ownerAcc.address);
        let startBalance2 = await distToken.balanceOf(clientAcc1.address);
        let startBalance3 = await distToken.balanceOf(clientAcc2.address);
        expect(await nano.distributeDividendsEqual([ownerAcc.address, clientAcc1.address, clientAcc2.address], distToken.address, 90))
        .to.emit(nano, "DividendsDistributed")
        .withArgs(anyValue, anyValue);
        let endBalance1 = await distToken.balanceOf(ownerAcc.address);
        let endBalance2 = await distToken.balanceOf(clientAcc1.address);
        let endBalance3 = await distToken.balanceOf(clientAcc2.address);
        expect(endBalance1.sub(startBalance1)).to.equal(30);
        expect(endBalance2.sub(startBalance2)).to.equal(30);
        expect(endBalance3.sub(startBalance3)).to.equal(30);

      });

      it('Should fail to distribute too high dividends', async() => {
        await expect(nano.distributeDividendsEqual([ownerAcc.address], distToken.address, 10_000_000))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
      });

      it('Should fail to distribute dividends to no receivers', async() => {
        await expect(nano.distributeDividendsEqual([], distToken.address, 10_000_000))
        .to.be.revertedWith("Nano: no dividends receivers provided!");
      });

      it('Should fail to distribute dividends if caller is not an owner', async() => {
        await expect(nano.connect(clientAcc1).distributeDividendsEqual([], distToken.address, 10_000_000))
        .to.be.revertedWith("Ownable: caller is not the owner");
      });

    });

    describe("Weighted dividends", () => {

      it('Should distribute dividends to a single address', async() => {
        // Provide some origTokens to the owner contract
        origToken.giveTokens(ownerAcc.address, 1000);
        // 1000 / 10 = 100 (minimum balance of distTokens of nano contract required)
        // But is has 1 000 000 so it will pass
        expect(await nano.distributeDividendsWeighted([ownerAcc.address], origToken.address, distToken.address, 10));
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

  });


  describe("Native tokens dividends", () => {
    describe("Equal dividends", () => {

    });
    describe("Weighted dividends", () => {

    });

  });

  describe("Extras", () => {


  });

});
