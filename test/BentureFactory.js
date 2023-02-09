const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Benture Factory", () => {
    let token;
    let adminToken;
    let factory;
    let zeroAddress = ethers.constants.AddressZero;
    let parseEther = ethers.utils.parseEther;

    // Deploy all contracts before each test suite
    beforeEach(async () => {
        [ownerAcc, clientAcc1, clientAcc2] = await ethers.getSigners();

        // Deploy dividend-distribution contract
        let bentureTx = await ethers.getContractFactory("Benture");
        benture = await bentureTx.deploy();
        await benture.deployed();

        // Deploy a factory contract
        let factoryTx = await ethers.getContractFactory("BentureFactory");
        factory = await factoryTx.deploy(benture.address);
        await factory.deployed();

        await benture.setFactoryAddress(factory.address);

        // Deploy an admin token (ERC721)
        let adminTx = await ethers.getContractFactory("BentureAdmin");
        adminToken = await adminTx.deploy(factory.address);
        await adminToken.deployed();
    });

    describe("Create tokens", () => {
        it("Should create a new ERC20 token and connect it to ERC721 token", async () => {
            expect(await adminToken.balanceOf(ownerAcc.address)).to.equal(0);
            expect(await factory.lastProducedToken()).to.equal(zeroAddress);
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    18,
                    true,
                    1_000_000,
                    adminToken.address
                )
            )
                .to.emit(factory, "CreateERC20Token")
                .withArgs(
                    "Dummy",
                    "DMM",
                    await factory.lastProducedToken(),
                    18,
                    true
                );
            expect(await factory.lastProducedToken()).to.not.equal(zeroAddress);
            expect(await adminToken.balanceOf(ownerAcc.address)).to.equal(1);
        });

        it("Should create a new ERC20 token with correct parameters", async () => {
            let name = "Dummy";
            let symbol = "DMM";
            let decimals = 18;
            let mintable = true;
            let maxTotalSupply = 1_000_000;
            let adminTokenAddress = adminToken.address;
            await factory.createERC20Token(
                name,
                symbol,
                decimals,
                mintable,
                maxTotalSupply,
                adminTokenAddress
            );
            let tokenAddress = await factory.lastProducedToken();
            token = await ethers.getContractAt(
                "BentureProducedToken",
                tokenAddress
            );
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
            expect(await token.decimals()).to.equal(decimals);
            expect(await token.mintable()).to.equal(mintable);
        });
    });
});
