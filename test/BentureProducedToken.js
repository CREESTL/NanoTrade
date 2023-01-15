const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Benture Produced Token", () => {
    let token;
    let adminToken;
    let factory;
    let zeroAddress = ethers.constants.AddressZero;
    let parseEther = ethers.utils.parseEther;

    // Deploy all contracts before each test suite
    beforeEach(async () => {
        [ownerAcc, clientAcc1, clientAcc2] = await ethers.getSigners();

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
            1_000_000,
            // Provide the address of the previously deployed ERC721
            adminToken.address
        );

        // Get the address of the last ERC20 token produced in the factory
        tokenAddress = await factory.lastProducedToken();
        token = await ethers.getContractAt(
            "BentureProducedToken",
            tokenAddress
        );
    });

    describe("Getters", () => {
        it("Should have a correct name", async () => {
            expect(await token.name()).to.equal("Dummy");
        });

        it("Should have a correct symbol", async () => {
            expect(await token.symbol()).to.equal("DMM");
        });

        it("Should have correct decimals", async () => {
            expect(await token.decimals()).to.equal(18);
        });

        it("Should have a correct mintable status", async () => {
            expect(await token.mintable()).to.equal(true);
        });

        it("Initially should have no holders", async () => {
            let holders = await token.holders();
            expect(holders.length).to.equal(0);
        });

        it("Should have a fixed max token supply", async () => {
            expect(await token.maxTotalSupply()).to.equal(1_000_000);
        });

        it("Should have an 'infinite' max total supply", async () => {
            await factory.createERC20Token(
                "AAA",
                "BBB",
                18,
                true,
                // Zero for "infinite" max total supply
                0,
                adminToken.address
            );

            // Get the address of the last ERC20 token produced in the factory
            let newTokenAddress = await factory.lastProducedToken();
            let newToken = await ethers.getContractAt(
                "BentureProducedToken",
                newTokenAddress
            );
            // Actually it's not infinite. It's a max possible value in Solidity - type(uint256).max
            expect(await newToken.maxTotalSupply()).to.equal(
                ethers.constants.MaxUint256
            );
        });

        it("Should check that user is an admin", async () => {
            // Owner is an admin
            expect(await token.checkAdmin(ownerAcc.address)).to.equal(true);
            // Client is not
            expect(await token.checkAdmin(clientAcc1.address)).to.equal(false);
        });
    });

    describe("Mint", () => {
        it("Should mint tokens to the given address", async () => {
            let startBalance = await token.balanceOf(clientAcc1.address);
            let amount = 1000;
            await expect(token.mint(clientAcc1.address, amount))
                .to.emit(token, "ControlledTokenCreated")
                .withArgs(anyValue, amount);
            let endBalance = await token.balanceOf(clientAcc1.address);
            expect(endBalance.sub(startBalance)).to.equal(amount);
        });

        it("Should increase the number of holders after mint", async () => {
            let holders = await token.holders();
            let startLength = holders.length;
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            await token.mint(clientAcc2.address, amount);
            holders = await token.holders();
            let endLength = holders.length;
            expect(endLength - startLength).to.equal(2);
        });

        it("Should fail to mint more than `maxTotalSupply` of tokens", async () => {
            let amount = 1_000_000_000;
            await expect(
                token.mint(clientAcc1.address, amount)
            ).to.be.revertedWith(
                "BentureProducedToken: supply exceeds maximum supply!"
            );
        });

        it("Should fail to mint to zero address", async () => {
            let amount = 1000;
            await expect(token.mint(zeroAddress, amount)).to.be.revertedWith(
                "BentureProducedToken: can not mint to zero address!"
            );
        });

        it("Should fail to mint if caller is not an admin", async () => {
            let amount = 1000;
            await expect(
                token.connect(clientAcc1).mint(clientAcc2.address, amount)
            ).to.be.revertedWith(
                "BentureProducedToken: user does not have an admin token!"
            );
        });

        it("Should fail to mint if caller transferred his admin token", async () => {
            let amount = 1000;
            // Transfer admin token from owner account to client #2 account
            await adminToken
                .connect(ownerAcc)
                .transferFrom(ownerAcc.address, clientAcc2.address, 1);
            // Try to call mint funcion from owner account
            await expect(
                token.connect(ownerAcc).mint(clientAcc1.address, amount)
            ).to.be.revertedWith(
                "BentureProducedToken: user does not have an admin token!"
            );
        });

        it("Should fail to mint if mint is disabled", async () => {
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
            newToken = await ethers.getContractAt(
                "BentureProducedToken",
                newAddress
            );

            let amount = 1000;
            await expect(
                newToken.mint(clientAcc2.address, amount)
            ).to.be.revertedWith(
                "BentureProducedToken: the token is not mintable!"
            );
        });

        it("Should fail to increase the number of holders if mint to the same address", async () => {
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
        it("Should burn some tokens from address and leave address in holders", async () => {
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            let startLength = (await token.holders()).length;
            let startBalance = await token.balanceOf(clientAcc1.address);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            await expect(token.connect(clientAcc1).burn(amount / 2))
                .to.emit(token, "ControlledTokenBurnt")
                .withArgs(anyValue, amount / 2);
            let endBalance = await token.balanceOf(clientAcc1.address);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            let endLength = (await token.holders()).length;
            expect(endLength).to.equal(startLength);
            expect(startBalance - endBalance).to.equal(amount / 2);
        });

        it("Should burn all tokens from address and remove address from holders", async () => {
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            let startLength = (await token.holders()).length;
            expect(startLength).to.equal(1);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            await token.connect(clientAcc1).burn(amount);
            let endLength = (await token.holders()).length;
            expect(endLength).to.equal(0);
            expect(await token.isHolder(clientAcc1.address)).to.equal(false);
        });

        it("Should fail to burn tokens if caller does not have any", async () => {
            let amount = 1000;
            await expect(
                token.connect(clientAcc1).burn(amount)
            ).to.be.revertedWith(
                "BentureProducedToken: caller does not have any tokens to burn!"
            );
        });

        it("Should fail to burn zero amount of tokens", async () => {
            let amount = 0;
            await expect(
                token.connect(clientAcc1).burn(amount)
            ).to.be.revertedWith(
                "BentureProducedToken: the amount of tokens to burn must be greater than zero!"
            );
        });

        it("Should indicate that account is no longer a holder after burning tokens", async () => {
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            await token.connect(clientAcc1).burn(amount);
            expect(await token.isHolder(clientAcc1.address)).to.equal(false);
        });
    });

    describe("Transfer", () => {
        it("Should transfer some tokens from one address to the other", async () => {
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
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            expect(await token.isHolder(clientAcc2.address)).to.equal(false);
            await expect(
                token
                    .connect(clientAcc1)
                    .transfer(clientAcc2.address, amount / 2)
            )
                .to.emit(token, "ControlledTokenTransferred")
                .withArgs(anyValue, anyValue, amount / 2);
            let endHolders = await token.holders();
            // Now both accounts should become holders and have half of tokens each
            expect(endHolders.length).to.equal(2);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            expect(await token.isHolder(clientAcc2.address)).to.equal(true);
            let endBalanceAcc1 = await token.balanceOf(clientAcc1.address);
            let endBalanceAcc2 = await token.balanceOf(clientAcc2.address);
            expect(endBalanceAcc1).to.equal(amount / 2);
            expect(endBalanceAcc2).to.equal(amount / 2);
        });

        it("Should not increase the number of holders when transfering to the same account", async () => {
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            let startHolders = await token.holders();
            expect(startHolders.length).to.equal(1);
            // Only one holder should be added after these 3 transfers
            await expect(
                token
                    .connect(clientAcc1)
                    .transfer(clientAcc2.address, amount / 4)
            );
            await expect(
                token
                    .connect(clientAcc1)
                    .transfer(clientAcc2.address, amount / 4)
            );
            await expect(
                token
                    .connect(clientAcc1)
                    .transfer(clientAcc2.address, amount / 4)
            );
            let endHolders = await token.holders();
            expect(endHolders.length - startHolders.length).to.equal(1);
        });

        it("Should delete account from holders if all of its tokens get transferred", async () => {
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            await expect(
                token.connect(clientAcc1).transfer(clientAcc2.address, amount)
            );
            expect(await token.isHolder(clientAcc1.address)).to.equal(false);
        });

        it("Should keep address a holder if he transferes tokens and gets them back", async () => {
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            await expect(
                token.connect(clientAcc1).transfer(clientAcc2.address, amount)
            );
            expect(await token.isHolder(clientAcc1.address)).to.equal(false);
            await expect(
                token.connect(clientAcc2).transfer(clientAcc1.address, amount)
            );
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
        });

        it("Should not allow a user to transfer tokens to himself", async () => {
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            await expect(
                token.connect(clientAcc1).transfer(clientAcc1.address, amount)
            ).to.be.revertedWith(
                "BentureProducedToken: sender can not be a receiver!"
            );
        });

        it("Should fail to transfer tokens if receiver has zero address", async () => {
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            await expect(
                token.connect(clientAcc1).transfer(zeroAddress, amount)
            ).to.be.revertedWith(
                "BentureProducedToken: receiver can not be a zero address!"
            );
        });

        it("Should fail to transfer tokens if sender has no tokens", async () => {
            let amount = 1000;
            await expect(
                token.connect(clientAcc1).transfer(clientAcc2.address, amount)
            ).to.be.revertedWith(
                "BentureProducedToken: sender does not have any tokens to transfer!"
            );
        });
    });

    describe("Constructor", () => {
        it("Should fail to initialize with wrong name", async () => {
            await expect(
                factory.createERC20Token(
                    "",
                    "DMM",
                    18,
                    true,
                    1_000_000,
                    adminToken.address
                )
            ).to.be.revertedWith(
                "BentureProducedToken: initial token name can not be empty!"
            );
        });

        it("Should fail to initialize with wrong symbol", async () => {
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "",
                    18,
                    true,
                    1_000_000,
                    adminToken.address
                )
            ).to.be.revertedWith(
                "BentureProducedToken: initial token symbol can not be empty!"
            );
        });

        it("Should fail to initialize with wrong decimals", async () => {
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    0,
                    true,
                    1_000_000,
                    adminToken.address
                )
            ).to.be.revertedWith(
                "BentureProducedToken: initial decimals can not be zero!"
            );
        });

        it("Should fail to initialize with wrong admin token address", async () => {
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    18,
                    true,
                    1_000_000,
                    zeroAddress
                )
            ).to.be.revertedWith(
                "BentureProducedToken: admin token address can not be a zero address!"
            );
        });

        it("Should fail to initialize with any max total supply if non-mintable", async () => {
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    18,
                    false,
                    1_000_000,
                    adminToken.address
                )
            ).to.be.revertedWith(
                "BentureProducedToken: max total supply must be zero for unmintable tokens!"
            );
        });
    });
});
