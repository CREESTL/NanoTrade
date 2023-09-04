const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const ipfsUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

describe("Benture Produced Token", () => {
    let zeroAddress = ethers.constants.AddressZero;
    let parseEther = ethers.utils.parseEther;

    // Deploy all contracts before each test suite
    async function deploys() {
        [ownerAcc, clientAcc1, clientAcc2] = await ethers.getSigners();

        // Deploy dividend-distribution contract
        let bentureTx = await ethers.getContractFactory("Benture");
        let benture = await upgrades.deployProxy(bentureTx, [], {
            initializer: "initialize",
            kind: "uups",
        });
        await benture.deployed();

        // Deploy a factory contract
        let factoryTx = await ethers.getContractFactory(
            "contracts/BentureFactory.sol:BentureFactory"
        );
        let factory = await upgrades.deployProxy(factoryTx, [benture.address], {
            initializer: "initialize",
            kind: "uups",
        });
        await factory.deployed();

        await benture.setFactoryAddress(factory.address);

        // Deploy an admin token (ERC721)
        let adminTx = await ethers.getContractFactory("BentureAdmin");
        let adminToken = await upgrades.deployProxy(
            adminTx,
            [factory.address],
            {
                initializer: "initialize",
                kind: "uups",
            }
        );
        await adminToken.deployed();

        // Create new ERC20 and ERC721 and assign them to caller (owner)
        await factory.createERC20Token(
            "Dummy",
            "DMM",
            ipfsUrl,
            18,
            true,
            1_000_000,
            0,
            // Provide the address of the previously deployed ERC721
            adminToken.address
        );

        // Get the address of the last ERC20 token produced in the factory
        let tokenAddress = await factory.lastProducedToken();
        let token = await ethers.getContractAt(
            "contracts/BentureProducedToken.sol:BentureProducedToken",
            tokenAddress
        );

        return {
            token,
            adminToken,
            factory,
            benture,
        };
    }

    describe("Getters", () => {
        it("Should have a correct name", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            expect(await token.name()).to.equal("Dummy");
        });

        it("Should have a correct symbol", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            expect(await token.symbol()).to.equal("DMM");
        });

        it("Should have correct decimals", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            expect(await token.decimals()).to.equal(18);
        });

        it("Should have a correct mintable status", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            expect(await token.mintable()).to.equal(true);
        });

        it("Should have a correct IPFS URL", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            expect(await token.ipfsUrl()).to.equal(ipfsUrl);
        });

        it("Should set new IPFS URL", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            expect(await token.ipfsUrl()).to.equal(ipfsUrl);

            let newIpfsUrl = "newIpfsUrl";
            await expect(
                token.setIpfsUrl(newIpfsUrl)
            ).to.be.emit(token, "IpfsUrlChanged").withArgs(
                newIpfsUrl
            );

            expect(await token.ipfsUrl()).to.equal(newIpfsUrl);
        });

        it("Should revert set new IPFS URL", async () => {
            let { token } = await loadFixture(
                deploys
            );

            let newIpfsUrl = "newIpfsUrl";
            await expect(
                token.connect(clientAcc1).setIpfsUrl(newIpfsUrl)
            ).to.be.revertedWithCustomError(token, "UserDoesNotHaveAnAdminToken");
        });

        it("Initially should have no holders", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            expect(await token.holdersLength()).to.be.equal(0);
            let holders = await token.holders();
            expect(holders.length).to.equal(0);
        });

        it("Should get holder by id", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            await token.mint(clientAcc1.address, 1000);
            expect(await token.holdersLength()).to.be.equal(1);
            expect(await token.getHolder(0)).to.be.equal(clientAcc1.address);
        });

        it("Should have a fixed max token supply", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            expect(await token.maxTotalSupply()).to.equal(1_000_000);
        });

        it("Should have an 'infinite' max total supply", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            await factory.createERC20Token(
                "AAA",
                "BBB",
                ipfsUrl,
                18,
                true,
                // Zero for "infinite" max total supply
                0,
                0,
                adminToken.address
            );

            // Get the address of the last ERC20 token produced in the factory
            let newTokenAddress = await factory.lastProducedToken();
            let newToken = await ethers.getContractAt(
                "contracts/BentureProducedToken.sol:BentureProducedToken",
                newTokenAddress
            );
            // Actually it's not infinite. It's a max possible value in Solidity - type(uint256).max
            expect(await newToken.maxTotalSupply()).to.equal(
                ethers.constants.MaxUint256
            );
        });

        it("Should check that user is an admin", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            // Owner is an admin
            expect(await token.checkAdmin(ownerAcc.address)).to.equal(true);
            // Client is not
            expect(await token.checkAdmin(clientAcc1.address)).to.equal(false);
        });
    });

    describe("Mint", () => {
        it("Should mint tokens to the given address", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let startBalance = await token.balanceOf(clientAcc1.address);
            let amount = 1000;
            await expect(token.mint(clientAcc1.address, amount))
                .to.emit(token, "ProjectTokenMinted")
                .withArgs(anyValue, amount);
            let endBalance = await token.balanceOf(clientAcc1.address);
            expect(endBalance.sub(startBalance)).to.equal(amount);
        });

        it("Should increase the number of holders after mint", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let holders = await token.holders();
            let startLength = holders.length;
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            await token.mint(clientAcc2.address, amount);
            holders = await token.holders();
            let endLength = holders.length;
            expect(endLength - startLength).to.equal(2);
            expect(await token.holdersLength()).to.be.equal(2);
        });

        it("Should fail to mint more than `maxTotalSupply` of tokens", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1_000_000_000;
            await expect(
                token.mint(clientAcc1.address, amount)
            ).to.be.revertedWithCustomError(
                token,
                "SupplyExceedsMaximumSupply"
            );
        });

        it("Should fail to mint to zero address", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1000;
            await expect(
                token.mint(zeroAddress, amount)
            ).to.be.revertedWithCustomError(token, "InvalidUserAddress");
        });

        it("Should fail to mint if caller is not an admin", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1000;
            await expect(
                token.connect(clientAcc1).mint(clientAcc2.address, amount)
            ).to.be.revertedWithCustomError(
                token,
                "UserDoesNotHaveAnAdminToken"
            );
        });

        it("Should fail to mint if caller transferred his admin token", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1000;
            // Transfer admin token from owner account to client #2 account
            await adminToken
                .connect(ownerAcc)
                .transferFrom(ownerAcc.address, clientAcc2.address, 1);
            // Try to call mint funcion from owner account
            await expect(
                token.connect(ownerAcc).mint(clientAcc1.address, amount)
            ).to.be.revertedWithCustomError(
                token,
                "UserDoesNotHaveAnAdminToken"
            );
        });

        it("Should fail to mint if mint is disabled", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            // Create a new token with `mint` function deactivated
            await factory.createERC20Token(
                "Dummy",
                "DMM",
                ipfsUrl,
                18,
                false,
                0,
                1000,
                adminToken.address
            );

            newAddress = await factory.lastProducedToken();
            newToken = await ethers.getContractAt(
                "contracts/BentureProducedToken.sol:BentureProducedToken",
                newAddress
            );

            let amount = 1000;
            await expect(
                newToken.mint(clientAcc2.address, amount)
            ).to.be.revertedWithCustomError(token, "TheTokenIsNotMintable");
        });

        it("Should fail to increase the number of holders if mint to the same address", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
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
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            let startLength = (await token.holders()).length;
            let startBalance = await token.balanceOf(clientAcc1.address);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            await expect(token.connect(clientAcc1).burn(amount / 2))
                .to.emit(token, "ProjectTokenBurnt")
                .withArgs(anyValue, amount / 2);
            let endBalance = await token.balanceOf(clientAcc1.address);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            let endLength = (await token.holders()).length;
            expect(endLength).to.equal(startLength);
            expect(startBalance - endBalance).to.equal(amount / 2);
        });

        it("Should burn all tokens from address and remove address from holders", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
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
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1000;
            await expect(
                token.connect(clientAcc1).burn(amount)
            ).to.be.revertedWithCustomError(token, "NoTokensToBurn");
        });

        it("Should fail to burn zero amount of tokens", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 0;
            await expect(
                token.connect(clientAcc1).burn(amount)
            ).to.be.revertedWithCustomError(token, "InvalidBurnAmount");
        });

        it("Should indicate that account is no longer a holder after burning tokens", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            await token.connect(clientAcc1).burn(amount);
            expect(await token.isHolder(clientAcc1.address)).to.equal(false);
        });
    });

    describe("Transfer", () => {
        it("Should transfer some tokens from one address to the other", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
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
                .to.emit(token, "ProjectTokenTransferred")
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
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
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
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            expect(await token.isHolder(clientAcc1.address)).to.equal(true);
            await expect(
                token.connect(clientAcc1).transfer(clientAcc2.address, amount)
            );
            expect(await token.isHolder(clientAcc1.address)).to.equal(false);
        });

        it("Should keep address a holder if he transferes tokens and gets them back", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
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

        it("Should fail to transfer tokens if receiver has zero address", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1000;
            await token.mint(clientAcc1.address, amount);
            await expect(
                token.connect(clientAcc1).transfer(zeroAddress, amount)
            ).to.be.revertedWithCustomError(token, "InvalidUserAddress");
        });

        it("Should fail to transfer tokens if sender has no tokens", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            let amount = 1000;
            await expect(
                token.connect(clientAcc1).transfer(clientAcc2.address, amount)
            ).to.be.revertedWithCustomError(token, "NoTokensToTransfer");
        });
    });

    describe("Constructor", () => {
        it("Should fail to initialize with wrong name", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            await expect(
                factory.createERC20Token(
                    "",
                    "DMM",
                    ipfsUrl,
                    18,
                    true,
                    1_000_000,
                    0,
                    adminToken.address
                )
            ).to.be.revertedWithCustomError(token, "EmptyTokenName");
        });

        it("Should fail to initialize with wrong symbol", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "",
                    ipfsUrl,
                    18,
                    true,
                    1_000_000,
                    0,
                    adminToken.address
                )
            ).to.be.revertedWithCustomError(token, "EmptyTokenSymbol");
        });

        it("Should fail to initialize with wrong decimals", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    ipfsUrl,
                    0,
                    true,
                    1_000_000,
                    0,
                    adminToken.address
                )
            ).to.be.revertedWithCustomError(token, "EmptyTokenDecimals");
        });

        it("Should fail to initialize with wrong admin token address", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    ipfsUrl,
                    18,
                    true,
                    1_000_000,
                    0,
                    zeroAddress
                )
            ).to.be.revertedWithCustomError(token, "InvalidAdminTokenAddress");
        });

        it("Should fail to initialize with any max total supply if non-mintable", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    ipfsUrl,
                    18,
                    false,
                    1_000_000,
                    0,
                    adminToken.address
                )
            ).to.be.revertedWithCustomError(token, "NotZeroMaxTotalSupply");
        });

        it("Should fail to initialize with zero mint amount if non-mintable", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    ipfsUrl,
                    18,
                    false,
                    0,
                    0,
                    adminToken.address
                )
            ).to.be.revertedWithCustomError(token, "ZeroMintAmount");
        });

        it("Should fail to initialize with mint amount bigger then total supply if non-mintable", async () => {
            let { token, adminToken, factory, benture } = await loadFixture(
                deploys
            );
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    ipfsUrl,
                    18,
                    true,
                    1000,
                    2000,
                    adminToken.address
                )
            ).to.be.revertedWithCustomError(token, "SupplyExceedsMaximumSupply");
        });
    });
});
