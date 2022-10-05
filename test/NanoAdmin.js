// SPDX-License-Identifier: MIT

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


describe("Nano Admin Token", () => {

  let token;
  let adminToken;
  let factory;
  let factorySigner;
  let zeroAddress = ethers.constants.AddressZero;
  let parseEther = ethers.utils.parseEther;

  // Deploy all contracts before each test suite
  beforeEach( async () => {
    [ownerAcc, clientAcc1, clientAcc2] = await ethers.getSigners();

    // Deploy a factory contract
    let factoryTx = await ethers.getContractFactory("PayableFactory");
    factory = await factoryTx.deploy();
    await factory.deployed();

    // Deploy an admin token (ERC721)
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

    // Get the address of the last ERC20 token produced in the factory
    tokenAddress = await factory.lastProducedToken();
    token = await ethers.getContractAt("NanoProducedToken", tokenAddress);
    
    // Deploy another "empty" contract to use its address
    let rummyTx = await ethers.getContractFactory("Rummy");
    rummy = await rummyTx.deploy();
    await rummy.deployed(); 

    // Make factory contract a signer
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [factory.address],
    });
    factorySigner = await ethers.getSigner(factory.address);

    // Provide some ether to the factory contract to be able to send transactions
    await ownerAcc.sendTransaction({to: factory.address, value: parseEther("1")});
  });

  describe("Constructor", () => {

    it('Should fail to initialize with zero factory address', async() => {
      let tx = await ethers.getContractFactory("NanoAdmin");
      await expect(tx.deploy(zeroAddress))
      .to.be.revertedWith("NanoAdmin: factory address can not be zero address!"); 
    });

  });

  describe("Getters", () => {
    
    it('Should check that provided address owns admin token', async() => {
      // It should not revert
      await adminToken.checkOwner(ownerAcc.address);
      // It should revert
      await expect(adminToken.checkOwner(clientAcc1.address))
      .to.be.revertedWith("NanoAdmin: user does not have an admin token!");
    });

    it('Should fail to check that zero address owns admin token', async() => {
      // It should not revert
      await expect(adminToken.checkOwner(zeroAddress))
      .to.be.revertedWith("NanoAdmin: zero address is an invalid user!");
    });

    it('Should verify that user controls provided ERC20 token', async() => {
      // It should not revert
      await adminToken.verifyAdminToken(ownerAcc.address, token.address);
      // It should revert
      await expect(adminToken.verifyAdminToken(clientAcc1.address, token.address))
      .to.be.revertedWith("NanoAdmin: user does not have an admin token!")
    });

    it('Should fail to verify that zero address controls provided ERC20 token', async() => {
      await expect(adminToken.verifyAdminToken(zeroAddress, token.address))
      .to.be.revertedWith("NanoAdmin: user can not have a zero address!")
    });

    it('Should fail to verify that user controls provided token with zero address', async() => {
      await expect(adminToken.verifyAdminToken(ownerAcc.address, zeroAddress))
      .to.be.revertedWith("NanoAdmin: token can not have a zero address!")
    });

    it('Should get the address of controlled ERC20 token by admin token ID', async() => {
      expect(await adminToken.getControlledAddressById(1)).to.equal(token.address);
    });

    it('Should fail to get the address of controlled ERC20 token by invalid admin token ID', async() => {
      await expect(adminToken.getControlledAddressById(777))
      .to.be.revertedWith("NanoAdmin: no controlled token exists for this admin token!");
    });

  });

  describe("Mint", () => {

    it('Should mint a new admin token and connect it to controlled ERC20 token', async() => {
      let startBalance = await adminToken.balanceOf(clientAcc1.address);
      expect(await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address))
      .to.emit(adminToken, "AdminTokenCreated").withArgs(anyValue, anyValue);
      // Check that ID was connected
      // ID is 2 here bacause ID 1 was minted in beforeEach block
      expect(await adminToken.getControlledAddressById(2)).to.equal(rummy.address);
      let endBalance = await adminToken.balanceOf(clientAcc1.address);
      expect(endBalance - startBalance).to.equal(1);
    });

    it('Should fail to mint a new admin token to zero address', async() => {
      await expect(adminToken.connect(factorySigner).mintWithERC20Address(zeroAddress, rummy.address))
      .to.be.revertedWith("NanoAdmin: admin token mint to zero address is not allowed!");
    });

    it('Should fail to mint a new admin token and connect in to zero address', async() => {
      await expect(adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, zeroAddress))
      .to.be.revertedWith("NanoAdmin: controlled token can not have a zero address!");
    });

    it('Should fail to mint a new admin token to the same account twice', async() => {
      await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address);
      await expect(adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address))
      .to.be.revertedWith("NanoAdmin: only a single admin token is allowed for a single controlled token!");
    });

    it('Should fail to mint a new admin token if caller is not a factory', async() => {
      await expect(adminToken.mintWithERC20Address(clientAcc1.address, rummy.address))
      .to.be.revertedWith("NanoAdmin: caller is not a factory!");
    });

  });


  describe("Burn", () => {

    it('Should burn token with provided ID', async() => {
      await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address);
      let startBalance = await adminToken.balanceOf(clientAcc1.address);
      expect(await adminToken.connect(clientAcc1).burn(2))
      .to.emit(adminToken, "AdminTokenBurnt").withArgs(anyValue);
      let endBalance = await adminToken.balanceOf(clientAcc1.address);
      expect(startBalance - endBalance).to.equal(1);
      // Check that user does not have any admin tokens
      await expect(adminToken.checkOwner(clientAcc1.address))
      .to.be.revertedWith("NanoAdmin: user does not have an admin token!");
      await expect(adminToken.verifyAdminToken(clientAcc1.address, rummy.address))
      .to.be.revertedWith("NanoAdmin: user does not have an admin token!");
      // Check that it is impossible to get the controlled address for burnt admin token
      await expect(adminToken.getControlledAddressById(2))
      .to.be.revertedWith("NanoAdmin: no controlled token exists for this admin token!");
    });

    it('Should fail to burn non-existent admin token', async() => {
      await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address);
      await expect(adminToken.connect(clientAcc1).burn(777))
      .to.be.revertedWith("ERC721: invalid token ID");
    });

    it('Should fail to burn token if caller is not an owner', async() => {
      await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address);
      await expect(adminToken.connect(clientAcc2).burn(2))
      .to.be.revertedWith("NanoAdmin: only owner of the token is allowed to burn it!");
    });

  });


  describe("Transfer", () => {

    it('Should transfer token with provided ID from one account to another', async() => {
      await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address);
      expect(await adminToken.connect(clientAcc1).transferFrom(clientAcc1.address, clientAcc2.address, 2))
      .to.emit(adminToken, "AdminTokenTransfered").withArgs(anyValue, anyValue, 2);
      let firstBalance = await adminToken.balanceOf(clientAcc1.address);
      let secondBalance = await adminToken.balanceOf(clientAcc2.address);
      expect(firstBalance).to.equal(0);
      expect(secondBalance).to.equal(1);
      // Check that the first user does not have any admin tokens
      await expect(adminToken.checkOwner(clientAcc1.address))
      .to.be.revertedWith("NanoAdmin: user does not have an admin token!");
      await expect(adminToken.verifyAdminToken(clientAcc1.address, rummy.address))
      .to.be.revertedWith("NanoAdmin: user does not have an admin token!");
      // Check that the second user received the token and now has the control
      await adminToken.checkOwner(clientAcc2.address);
      await adminToken.verifyAdminToken(clientAcc2.address, rummy.address);
      // Check that it is still possible to get the controlled token address
      expect(await adminToken.getControlledAddressById(2)).to.equal(rummy.address);
    });

    it('Should fail to transfer non-existent admin token', async() => {
      await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address);
      await expect(adminToken.connect(clientAcc1).transferFrom(clientAcc1.address, clientAcc2.address, 777))
      .to.be.revertedWith("ERC721: invalid token ID");
    });

    it('Should fail to transfer from zero address', async() => {
      await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address);
      await expect(adminToken.connect(clientAcc1).transferFrom(zeroAddress, clientAcc2.address, 2))
      .to.be.revertedWith("NanoAdmin: sender can not be a zero address!");
    });

    it('Should fail to transfer to zero address', async() => {
      await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address);
      await expect(adminToken.connect(clientAcc1).transferFrom(clientAcc1.address, zeroAddress, 2))
      .to.be.revertedWith("NanoAdmin: receiver can not be a zero address!");
    });

    it('Should fail to transfer if sender does not have any admin tokens', async() => {
      await adminToken.connect(factorySigner).mintWithERC20Address(clientAcc1.address, rummy.address);
      await expect(adminToken.connect(ownerAcc).transferFrom(ownerAcc.address, clientAcc2.address, 2))
      .to.be.revertedWith("ERC721: caller is not token owner nor approved");
    });

  });
});
