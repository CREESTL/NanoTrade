const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { parseUnits, parseEther } = ethers.utils;

describe("Benture Dividend-Paying Token", () => {
    let benture;
    let origToken;
    let adminToken;
    let factory;
    let zeroAddress = ethers.constants.AddressZero;
    let provider;
    let parseEther = ethers.utils.parseEther;

    // Deploy all contracts before each test suite
    beforeEach(async () => {
        [ownerAcc, clientAcc1, clientAcc2, clientAcc3] =
            await ethers.getSigners();

        provider = ethers.provider;

        // Deploy a factory contract
        let factoryTx = await ethers.getContractFactory("BentureFactory");
        factory = await factoryTx.deploy();
        await factory.deployed();

        // Deploy an admin token (ERC721)
        let adminTx = await ethers.getContractFactory("BentureAdmin");
        adminToken = await adminTx.deploy(factory.address);
        await adminToken.deployed();

        // Create new ERC20 and ERC721 and assign them to caller (owner)
        await factory.createERC20Token(
            "Dummy",
            "DMM",
            18,
            true,
            parseUnits("1000000000", 6),
            // Provide the address of the previously deployed ERC721
            adminToken.address
        );

        // Get the address of the last ERC20 token produced in the factory
        origTokenAddress = await factory.lastProducedToken();
        origToken = await ethers.getContractAt(
            "BentureProducedToken",
            origTokenAddress
        );

        // Deploy dividend-distribution contract
        let bentureTx = await ethers.getContractFactory("Benture");
        benture = await bentureTx.deploy(factory.address);
        await benture.deployed();

        // Deploy another ERC20 in order to have a distToken
        await factory.createERC20Token(
            "Slummy",
            "SMM",
            18,
            true,
            parseUnits("1000000000", 6),
            adminToken.address
        );
        // The address of `lastProducedToken` of factory gets changed here
        distTokenAddress = await factory.lastProducedToken();
        distToken = await ethers.getContractAt(
            "BentureProducedToken",
            distTokenAddress
        );

        // Premint 1M distTokens to the owner
        await distToken.mint(ownerAcc.address, parseUnits("10000000", 6));
        // NOTE: Allow benture to spend all tokens from owner's account (and ever more)
        await distToken
            .connect(ownerAcc)
            .approve(benture.address, parseUnits("10000000", 6));
        await origToken
            .connect(ownerAcc)
            .approve(benture.address, parseUnits("10000000", 6));

        // Deploy another "empty" contract to use its address
        let rummyTx = await ethers.getContractFactory("Rummy");
        rummy = await rummyTx.deploy();
        await rummy.deployed();
    });

    // TODO make all tests
    describe("ERC20 dividends", () => {
        describe("Equal dividends", () => {});

        describe("Weighted dividends", () => {});
    });

    describe("Native tokens dividends", () => {
        describe("Equal dividends", () => {});

        describe("Weighted dividends", () => {});
    });
});
