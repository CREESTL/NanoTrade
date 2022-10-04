// SPDX-License-Identifier: MIT

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


describe("Nano Produced Token", () => {

  let token;
  let adminToken;
  let factory;
  let zeroAddress = ethers.constants.AddressZero;
  let parseEther = ethers.utils.parseEther;

  // Deploy all contracts before each test suite
  beforeEach( async () => {
    [ownerAcc, clientAcc1, clientAcc2] = await ethers.getSigners();

    // Deploy a factory contract
    let factoryTx = await ethers.getContractFactory("NanoFactory");
    factory = await factoryTx.deploy();
    await factory.deployed();

    // Deploy and admin token (ERC721)
    let adminTx = await ethers.getContractFactory("NanoAdmin");
    adminToken = await adminTx.deploy(factory.address);
    await adminToken.deployed(); 

    // Create new ERC20 and ERC721 and assign them to caller (owner)
    await factory.createERC20Token(
        "Dummy",
        "DMM",
        18,
        true,
        1_000_000,
        // Provide the address of the previously deployed ERC721
        adminToken.address 
      );


    tokenAddress = await factory.lastProducedToken();
    token = await ethers.getContractAt("NanoProducedToken", tokenAddress);

  });

  describe("Getters", () => {
    
    it('Should have a correct name', async() => {
      expect(await token.name()).to.equal("Dummy");
    });

    it('Should have a correct symbol', async() => {
      expect(await token.symbol()).to.equal("DMM");
    });

    it('Should have correct decimals', async() => {
      expect(await token.decimals()).to.equal(18);
    });

    it('Should have correct mintable status', async() => {
      expect(await token.mintable()).to.equal(true);
    });

    it('Initially should have no holders', async() => {
      let holders = await token.holders();
      expect(holders.length).to.equal(0);
    });

  });


  describe("Mint", () => {
    
    it('Should mint tokens to the given address', async() => {
      let startBalance = await token.balanceOf(clientAcc1.address);
      let amount = 1000;
      await expect(token.mint(clientAcc1.address, amount))
      .to.emit(token, "ControlledTokenCreated").withArgs(anyValue, amount);
      let endBalance = await token.balanceOf(clientAcc1.address);
      expect(endBalance.sub(startBalance)).to.equal(amount);
    });

    it('Should increase the number of holders after mint', async() => {
      let holders = await token.holders();
      let startLength = holders.length;
      let amount = 1000;
      await token.mint(clientAcc1.address, amount);
      await token.mint(clientAcc2.address, amount);
      holders = await token.holders();
      let endLength = holders.length;
      expect(endLength - startLength).to.equal(2);
    });

    it('Should fail to mint more than `maxTotalSupply` of tokens', async() => {
      let amount = 1_000_000_000;
      await expect(token.mint(clientAcc1.address, amount))
      .to.be.revertedWith("NanoProducedToken: supply exceeds maximum supply!");
    });

    it('Should fail to mint to zero address', async() => {
      let amount = 1000;
      await expect(token.mint(zeroAddress, amount))
      .to.be.revertedWith("NanoProducedToken: can not mint to zero address!");
    });

    it('Should fail to mint if caller is not an admin', async() => {
      let amount = 1000;
      await expect(token.connect(clientAcc1).mint(clientAcc2.address, amount))
      .to.be.revertedWith("NanoAdmin: user does not have an admin token!");
    });

    it('Should fail to mint if mint is disabled', async() => {
      // Create a new token with `mint` function deactivated
      await factory.createERC20Token(
        "Dummy",
        "DMM",
        18,
        false,
        0,
        adminToken.address 
      );

      newAddress = await factory.lastProducedToken();
      newToken = await ethers.getContractAt("NanoProducedToken", newAddress);

      let amount = 1000;
      await expect(newToken.mint(clientAcc2.address, amount))
      .to.be.revertedWith("NanoProducedToken: the token is not mintable!");
    });

    it('Should fail to increase the number of holders if mint to the same address', async() => {
      let amount = 1000;
      // Mint the first portion of tokens to one address
      await token.mint(clientAcc1.address, amount);
      let holders = await token.holders();
      let startLength = holders.length;
      // Mint more tokens to the same address
      await token.mint(clientAcc1.address, amount);
      await token.mint(clientAcc1.address, amount);
      holders = await token.holders();
      let endLength = holders.length;
      expect(endLength).to.equal(startLength);
    });

  });

  describe("Burn", () => {

    it('Should burn some tokens from address and leave address in holders', async() => {
      let amount = 1000;
      await token.mint(clientAcc1.address, amount);
      let startBalance = await token.balanceOf(clientAcc1.address);
      let startHolders = await token.holders();
      await expect(token.connect(clientAcc1).burn(amount / 2))
      .to.emit(token, "ControlledTokenBurnt").withArgs(anyValue, amount / 2);
      let endHolders = await token.holders();
      let endBalance = await token.balanceOf(clientAcc1.address);
      // There is only one holder. Should be the same in both arrays.
      expect(endHolders[0]).to.equal(startHolders[0]);
      expect(startBalance - endBalance).to.equal(amount / 2);
    });

    it('Should burn all tokens from address and remove address from holders', async() => {
      let amount = 1000;
      await token.mint(clientAcc1.address, amount);
      let startHolders = await token.holders();
      expect(startHolders[0]).to.equal(clientAcc1.address);
      await token.connect(clientAcc1).burn(amount);
      let endHolders = await token.holders();
      // Actually it gets replaced by zero address. The length of holders stays the same
      expect(endHolders[0]).to.equal(zeroAddress);
    });

    it('Should fail to burn tokens if caller does not have any', async() => {
      let amount = 1000;
      await expect(token.connect(clientAcc1).burn(amount))
      .to.be.revertedWith("NanoProducedToken: caller does not have any tokens to burn!");
    });

    it('Should fail to burn zero amount of tokens', async() => {
      let amount = 0;
      await expect(token.connect(clientAcc1).burn(amount))
      .to.be.revertedWith("NanoProducedToken: the amount of tokens to burn must be greater than zero!");
    });

  });


  describe("Transfer", () => {

    it('Should transfer some tokens from one address to the other', async() => {
      let amount = 1000;
      await token.mint(clientAcc1.address, amount);
      let startBalanceAcc1 = await token.balanceOf(clientAcc1.address);
      let startBalanceAcc2 = await token.balanceOf(clientAcc2.address);
      // Only the first account should have tokens so far
      expect(startBalanceAcc1).to.equal(amount);
      expect(startBalanceAcc2).to.equal(0);
      let startHolders = await token.holders();
      // And only one account should be a holder
      expect(startHolders.length).to.equal(1);
      expect(startHolders[0]).to.equal(clientAcc1.address);
      await expect(token.connect(clientAcc1).transfer(clientAcc2.address, amount / 2))
      .to.emit(token, "ControlledTokenTransferred").withArgs(anyValue, anyValue, amount / 2);
      let endHolders = await token.holders();
      // Now both accounts should become holders and have half of tokens each
      expect(endHolders.length).to.equal(2);
      expect(endHolders[0]).to.equal(clientAcc1.address);
      expect(endHolders[1]).to.equal(clientAcc2.address);
      let endBalanceAcc1 = await token.balanceOf(clientAcc1.address);
      let endBalanceAcc2 = await token.balanceOf(clientAcc2.address);
      expect(endBalanceAcc1).to.equal(amount / 2);
      expect(endBalanceAcc2).to.equal(amount / 2);
    });


    it('Should not increase the number of holders when transfering to the same account', async() => {
      let amount = 1000;
      await token.mint(clientAcc1.address, amount);
      let startHolders = await token.holders();
      expect(startHolders.length).to.equal(1);
      // Only one holder should be added after these 3 transfers
      await expect(token.connect(clientAcc1).transfer(clientAcc2.address, amount / 4));
      await expect(token.connect(clientAcc1).transfer(clientAcc2.address, amount / 4));
      await expect(token.connect(clientAcc1).transfer(clientAcc2.address, amount / 4));
      let endHolders = await token.holders();
      expect(endHolders.length - startHolders.length).to.equal(1);
    });

    it('Should delete account from holders if all of its tokens get transfered', async() => {
      let amount = 1000;
      await token.mint(clientAcc1.address, amount);
      let startHolders = await token.holders();
      expect(startHolders[0]).to.equal(clientAcc1.address);
      await expect(token.connect(clientAcc1).transfer(clientAcc2.address, amount));
      let endHolders = await token.holders();
      expect(endHolders[0]).to.equal(zeroAddress);
    });

    it('Should fail to transfer tokens if receiver has zero address', async() => {
      let amount = 1000;
      await token.mint(clientAcc1.address, amount);
      await expect(token.connect(clientAcc1).transfer(zeroAddress, amount))
      .to.be.revertedWith("NanoProducedToken: receiver can not be a zero address!");
    });

    it('Should fail to transfer tokens if sender has no tokens', async() => {
      let amount = 1000;
      await expect(token.connect(clientAcc1).transfer(clientAcc2.address, amount))
      .to.be.revertedWith("NanoProducedToken: sender does not have any tokens to transfer!");
    });

  });

  describe("Constructor", () => {

    it('Should fail to initialize with wrong name', async() => {
      await expect(factory.createERC20Token(
        "",
        "DMM",
        18,
        true,
        1_000_000,
        adminToken.address 
      ))
      .to.be.revertedWith("NanoProducedToken: initial token name can not be empty!");
    });

    it('Should fail to initialize with wrong symbol', async() => {
      await expect(factory.createERC20Token(
        "Dummy",
        "",
        18,
        true,
        1_000_000,
        adminToken.address 
      ))
      .to.be.revertedWith("NanoProducedToken: initial token symbol can not be empty!");
    });

    it('Should fail to initialize with wrong decimals', async() => {
      await expect(factory.createERC20Token(
        "Dummy",
        "DMM",
        0,
        true,
        1_000_000,
        adminToken.address 
      ))
      .to.be.revertedWith("NanoProducedToken: initial decimals can not be zero!");
    });

    it('Should fail to initialize with wrong admin token address', async() => {
      await expect(factory.createERC20Token(
        "Dummy",
        "DMM",
        18,
        true,
        1_000_000,
        zeroAddress
      ))
      .to.be.revertedWith("NanoProducedToken: admin token address can not be a zero address!");
    });

    it('Should fail to initialize with wrong max total supply', async() => {
      await expect(factory.createERC20Token(
        "Dummy",
        "DMM",
        18,
        true,
        0,
        adminToken.address
      ))
      .to.be.revertedWith("NanoProducedToken: max total supply can not be zero!");
    });


    it('Should fail to initialize with any max total supply if non-mintable', async() => {
      await expect(factory.createERC20Token(
        "Dummy",
        "DMM",
        18,
        false,
        1_000_000,
        adminToken.address
      ))
      .to.be.revertedWith("NanoProducedToken: max total supply must be zero for unmintable tokens!");
    });


  });
});
