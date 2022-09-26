// SPDX-License-Identifier: MIT

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


describe("Nano Dividend-Paying Token", () => {

  let nano;
  let origToken;
  let token_2;
  let zeroAddress = ethers.constants.AddressZero;
  let parseEther = ethers.utils.parseEther;

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
        await expect(nano.distributeDividendsEqual([ownerAcc.address], distToken.address, 10))
        .to.emit(nano, "DividendsDistributed")
        .withArgs(anyValue, anyValue);
        let endBalance = await distToken.balanceOf(ownerAcc.address);
        expect(endBalance.sub(startBalance)).to.equal(10);
      });

      it('Should distribute dividends to a list of addresses', async() => {
        let startBalance1 = await distToken.balanceOf(ownerAcc.address);
        let startBalance2 = await distToken.balanceOf(clientAcc1.address);
        let startBalance3 = await distToken.balanceOf(clientAcc2.address);
        await expect(nano.distributeDividendsEqual([ownerAcc.address, clientAcc1.address, clientAcc2.address], distToken.address, 90))
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
        await origToken.giveTokens(ownerAcc.address, 1000);
        let startBalance = await distToken.balanceOf(ownerAcc.address);
        // 1000 / 10 = 100 (minimum balance of distTokens of nano contract required)
        // But is has 1 000 000 so it will pass
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], origToken.address, distToken.address, 10))
        .to.emit(nano, "DividendsDistributed")
        .withArgs(anyValue, anyValue);
        let endBalance = await distToken.balanceOf(ownerAcc.address);
        expect(endBalance.sub(startBalance)).to.equal(100);
      });

      it('Should distribute dividends to multiple addresses', async() => {
        await origToken.giveTokens(ownerAcc.address, 1000);
        await origToken.giveTokens(clientAcc1.address, 1000);
        await origToken.giveTokens(clientAcc2.address, 1000);
        let startBalance1 = await distToken.balanceOf(ownerAcc.address);
        let startBalance2 = await distToken.balanceOf(clientAcc1.address);
        let startBalance3 = await distToken.balanceOf(clientAcc2.address);
        // 1000 / 10 = 100 (minimum balance of distTokens of nano contract required)
        // But is has 1 000 000 so it will pass
        await expect(nano.distributeDividendsWeighted(
          [ownerAcc.address, clientAcc1.address, clientAcc2.address],
          origToken.address,
          distToken.address,
          10))
        .to.emit(nano, "DividendsDistributed")
        .withArgs(anyValue, anyValue);
        let endBalance1 = await distToken.balanceOf(ownerAcc.address);
        let endBalance2 = await distToken.balanceOf(clientAcc1.address);
        let endBalance3 = await distToken.balanceOf(clientAcc2.address);
        expect(endBalance1.sub(startBalance1)).to.equal(100);
        expect(endBalance2.sub(startBalance2)).to.equal(100);
        expect(endBalance3.sub(startBalance3)).to.equal(100);
      });


      it('Should fail to distribute too high dividends to a single address', async() => {
        await origToken.giveTokens(ownerAcc.address, 10_000_000);
        // 10_000_000 / 1 = 10_000_000 (minimum balance of distTokens of nano contract required)
        // But is has 1 000 000 so it will fail
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], origToken.address, distToken.address, 1))
        .to.be.revertedWith("Nano: not enough dividend tokens to distribute with the provided weight!");
      });

      it('Should fail to distribute too high dividends to multiple addresses', async() => {
        await origToken.giveTokens(ownerAcc.address, 10_000_000);
        await origToken.giveTokens(clientAcc1.address, 10_000_000);
        await origToken.giveTokens(clientAcc2.address, 10_000_000);
        // 30_000_000 / 10 = 3_000_000 (minimum balance of distTokens of nano contract required)
        // But is has 1 000 000 so it will fail
        await expect(nano.distributeDividendsWeighted(
          [ownerAcc.address, clientAcc1.address, clientAcc2.address],
          origToken.address,
          distToken.address,
          10))
        .to
        .be.revertedWith("Nano: not enough dividend tokens to distribute with the provided weight!");
      });

      it('Should fail to distribute dividends to no receivers', async() => {
        await origToken.giveTokens(ownerAcc.address, 1000);
        await expect(nano.distributeDividendsWeighted([], origToken.address, distToken.address, 10))
        .to.be.revertedWith("Nano: no dividends receivers provided!");
      });

      it('Should fail to distribute dividends for native tokens holders', async() => {
        await origToken.giveTokens(ownerAcc.address, 1000);
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], zeroAddress, distToken.address, 10))
        .to.be.revertedWith("Nano: original token can not have a zero address!");
      });

      it('Should fail to distribute dividends with too low weight', async() => {
        await origToken.giveTokens(ownerAcc.address, 1000)
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], origToken.address, distToken.address, 0))
        .to.be.revertedWith("Nano: weight is too low!");
      });

      it('Should fail to distribute dividends with too high weight', async() => {
        await origToken.giveTokens(ownerAcc.address, 10)
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], origToken.address, distToken.address, 1000))
        .to.be.revertedWith("Nano: none of the receivers has enough tokens for the provided weight!");
      });

      it('Should fail to distribute dividends if caller is not an owner', async() => {
        await origToken.giveTokens(ownerAcc.address, 1000)
        await expect(nano.connect(clientAcc1).distributeDividendsWeighted([ownerAcc.address], origToken.address, distToken.address, 10))
        .to.be.revertedWith("Ownable: caller is not the owner");
      });

    });

  });


  describe("Native tokens dividends", () => {
    describe("Equal dividends", () => {

      it('Should distribute dividends to a single address', async() => {
        // Provide some ether to the nano contract to be able to pay dividends
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("5")});
        let startBalance = await ethers.provider.getBalance(ownerAcc.address);
        expect(await nano.distributeDividendsEqual([ownerAcc.address], zeroAddress, parseEther("1")))
        .to.emit(nano, "DividendsDistributed")
        .withArgs(anyValue, anyValue);
        let endBalance = await ethers.provider.getBalance(ownerAcc.address);
        // 1 ether - gas
        expect(endBalance.sub(startBalance)).to.be.lt(parseEther("1"));
      });

      it('Should distribute dividends to a list of addresses', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("5")});
        let startBalance1 = await ethers.provider.getBalance(ownerAcc.address);
        let startBalance2 = await ethers.provider.getBalance(clientAcc1.address);
        let startBalance3 = await ethers.provider.getBalance(clientAcc2.address);
        expect(await nano.distributeDividendsEqual([ownerAcc.address, clientAcc1.address, clientAcc2.address], zeroAddress, parseEther("1")))
        .to.emit(nano, "DividendsDistributed")
        .withArgs(anyValue, anyValue);
        let endBalance1 = await ethers.provider.getBalance(ownerAcc.address);
        let endBalance2 = await ethers.provider.getBalance(clientAcc1.address);
        let endBalance3 = await ethers.provider.getBalance(clientAcc2.address);
        // Each should get 0.33333... ether - gas
        expect(endBalance1.sub(startBalance1)).to.be.gt(parseEther("0.3"));
        expect(endBalance2.sub(startBalance2)).to.be.gt(parseEther("0.3"));
        expect(endBalance3.sub(startBalance3)).to.be.gt(parseEther("0.3"));

      });

      it('Should fail to distribute too high dividends', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("5")});
        await expect(nano.distributeDividendsEqual([ownerAcc.address], zeroAddress, parseEther("10")))
        .to.be.revertedWith("Nano: not enough dividend tokens to distribute!");
      });

      it('Should fail to distribute dividends to no receivers', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("5")});
        await expect(nano.distributeDividendsEqual([], zeroAddress, parseEther("1")))
        .to.be.revertedWith("Nano: no dividends receivers provided!");
      });

      it('Should fail to distribute dividends if caller is not an owner', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("5")});
        await expect(nano.connect(clientAcc1).distributeDividendsEqual([], zeroAddress, parseEther("1")))
        .to.be.revertedWith("Ownable: caller is not the owner");
      });

    });


    describe("Weighted dividends", () => {

      it('Should distribute dividends to a single address', async() => {
        // Provide some ether to the nano contract to be able to pay dividends
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
        // Provide one account with origTokens
        await origToken.giveTokens(ownerAcc.address, 1000);
        let startBalance = await ethers.provider.getBalance(ownerAcc.address);
        // 1000 / 200 = 5 (minimum balance of distTokens of nano contract required)
        // But is has 8 so it will pass
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], origToken.address, zeroAddress, 200))
        .to.emit(nano, "DividendsDistributed")
        .withArgs(anyValue, anyValue);
        let endBalance = await ethers.provider.getBalance(ownerAcc.address);
        // 5 ether - gas
        expect(endBalance.sub(startBalance)).to.be.lt(parseEther("5"));
      });


      it('Should distribute dividends to multiple addresses', async() => {
        // Provide some ether to the nano contract to be able to pay dividends
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("6")});
        await origToken.giveTokens(ownerAcc.address, 10);
        await origToken.giveTokens(clientAcc1.address, 10);
        await origToken.giveTokens(clientAcc2.address, 10);
        let startBalance1 = await ethers.provider.getBalance(ownerAcc.address);
        let startBalance2 = await ethers.provider.getBalance(clientAcc1.address);
        let startBalance3 = await ethers.provider.getBalance(clientAcc2.address);
        // 10 / 10 = 1 (x3) (minimum balance of distTokens of nano contract required)
        // But is has 6 so it will pass
        await expect(nano.distributeDividendsWeighted(
          [ownerAcc.address, clientAcc1.address, clientAcc2.address],
          origToken.address,
          zeroAddress,
          10))
        .to.emit(nano, "DividendsDistributed")
        .withArgs(anyValue, anyValue);
        let endBalance1 = await ethers.provider.getBalance(ownerAcc.address);
        let endBalance2 = await ethers.provider.getBalance(clientAcc1.address);
        let endBalance3 = await ethers.provider.getBalance(clientAcc2.address);
        expect(endBalance1.sub(startBalance1)).to.be.lt(parseEther("2"));
        expect(endBalance2.sub(startBalance2)).to.be.lt(parseEther("2"));
        expect(endBalance3.sub(startBalance3)).to.be.lt(parseEther("2"));
      });


      it('Should fail to distribute too high dividends to a single address', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
        await origToken.giveTokens(ownerAcc.address, 1000);
        // 1000 / 1 = 1000 (minimum balance of distTokens of nano contract required)
        // But is has 8 so it will fail
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], origToken.address, zeroAddress, 1))
        .to.be.revertedWith("Nano: not enough dividend tokens to distribute with the provided weight!");
      });

      it('Should fail to distribute too high dividends to multiple addresses', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
        await origToken.giveTokens(ownerAcc.address, 100);
        await origToken.giveTokens(clientAcc1.address, 100);
        await origToken.giveTokens(clientAcc2.address, 100);
        // 100 / 10 = 10 (x3) (minimum balance of distTokens of nano contract required)
        // But is has 8so it will fail
        await expect(nano.distributeDividendsWeighted(
          [ownerAcc.address, clientAcc1.address, clientAcc2.address],
          origToken.address,
          zeroAddress,
          10))
        .to
        .be.revertedWith("Nano: not enough dividend tokens to distribute with the provided weight!");
      });

      it('Should fail to distribute dividends to no receivers', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
        await origToken.giveTokens(ownerAcc.address, 1000);
        await expect(nano.distributeDividendsWeighted([], origToken.address, zeroAddress, 10))
        .to.be.revertedWith("Nano: no dividends receivers provided!");
      });

      it('Should fail to distribute dividends for native tokens holders', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
        await origToken.giveTokens(ownerAcc.address, 1000);
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], zeroAddress, zeroAddress, 10))
        .to.be.revertedWith("Nano: original token can not have a zero address!");
      });

      it('Should fail to distribute dividends with too low weight', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
        await origToken.giveTokens(ownerAcc.address, 1000)
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], origToken.address, zeroAddress, 0))
        .to.be.revertedWith("Nano: weight is too low!");
      });

      it('Should fail to distribute dividends with too high weight', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
        await origToken.giveTokens(ownerAcc.address, 10)
        await expect(nano.distributeDividendsWeighted([ownerAcc.address], origToken.address, zeroAddress, 1000))
        .to.be.revertedWith("Nano: none of the receivers has enough tokens for the provided weight!");
      });

      it('Should fail to distribute dividends if caller is not an owner', async() => {
        await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
        await origToken.giveTokens(ownerAcc.address, 1000)
        await expect(nano.connect(clientAcc1).distributeDividendsWeighted([ownerAcc.address], origToken.address, zeroAddress, 10))
        .to.be.revertedWith("Ownable: caller is not the owner");
      });

    });

  });

  describe("Extras", () => {
    it('Should calculate minimum weight correctly for a single receiver', async() => {
      await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
      await origToken.giveTokens(ownerAcc.address, 1000)
      let minWeight = await nano.calcMinWeight([ownerAcc.address], origToken.address);
      expect(minWeight).to.equal(1000);
    });
    it('Should calculate minimum weight correctly for multiple receivers', async() => {
      await ownerAcc.sendTransaction({to: nano.address, value: parseEther("8")});
      await origToken.giveTokens(ownerAcc.address, 1000)
      await origToken.giveTokens(clientAcc1.address, 800)
      // This should be the minimum weight
      await origToken.giveTokens(clientAcc2.address, 1)
      let minWeight = await nano.calcMinWeight([ownerAcc.address, clientAcc1.address, clientAcc2.address], origToken.address);
      expect(minWeight).to.equal(1);
    });

  });

});
