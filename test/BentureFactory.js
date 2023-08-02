const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const ipfsUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

describe("Benture Factory", () => {
    let zeroAddress = ethers.constants.AddressZero;
    let parseEther = ethers.utils.parseEther;

    // Deploy all contracts before each test suite
    async function deploys() {
        [ownerAcc, clientAcc1, clientAcc2] = await ethers.getSigners();

        // Deploy dividend-distribution contract
        let bentureTx = await ethers.getContractFactory("Benture");
        let benture = await upgrades.deployProxy(
            bentureTx,
            [],
            {},
            {
                initializer: "initialize",
                kind: "uups",
            }
        );
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

        return {
            ownerAcc,
            clientAcc1,
            clientAcc2,
            benture,
            factory,
            adminToken,
        };
    }

    describe("Create tokens", () => {
        it("Should create a new ERC20 token and connect it to ERC721 token", async () => {
            let {
                ownerAcc,
                clientAcc1,
                clientAcc2,
                benture,
                factory,
                adminToken,
            } = await loadFixture(deploys);
            expect(await adminToken.balanceOf(ownerAcc.address)).to.equal(0);
            expect(await factory.lastProducedToken()).to.equal(zeroAddress);
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    ipfsUrl,
                    18,
                    true,
                    1_000_000,
                    0,
                    adminToken.address
                )
            )
                .to.emit(factory, "CreateERC20Token")
                .withArgs(
                    "Dummy",
                    "DMM",
                    ipfsUrl,
                    await factory.lastProducedToken(),
                    18,
                    true
                );
            expect(await factory.lastProducedToken()).to.not.equal(zeroAddress);
            expect(await adminToken.balanceOf(ownerAcc.address)).to.equal(1);
        });

        it("Should create a new ERC20 token when mintable is false and connect it to ERC721 token", async () => {
            let {
                ownerAcc,
                clientAcc1,
                clientAcc2,
                benture,
                factory,
                adminToken,
            } = await loadFixture(deploys);
            expect(await adminToken.balanceOf(ownerAcc.address)).to.equal(0);
            expect(await factory.lastProducedToken()).to.equal(zeroAddress);
            await expect(
                factory.createERC20Token(
                    "Dummy",
                    "DMM",
                    ipfsUrl,
                    18,
                    false,
                    0,
                    1000,
                    adminToken.address
                )
            )
                .to.emit(factory, "CreateERC20Token")
                .withArgs(
                    "Dummy",
                    "DMM",
                    ipfsUrl,
                    await factory.lastProducedToken(),
                    18,
                    false
                );
            expect(await factory.lastProducedToken()).to.not.equal(zeroAddress);
            expect(await adminToken.balanceOf(ownerAcc.address)).to.equal(1);

            let token = await ethers.getContractAt(
                "contracts/BentureProducedToken.sol:BentureProducedToken",
                await factory.lastProducedToken()
            );
            expect(await token.balanceOf(ownerAcc.address)).to.be.equal(1000);
        });

        it("Should create a new ERC20 token with correct parameters", async () => {
            let {
                ownerAcc,
                clientAcc1,
                clientAcc2,
                benture,
                factory,
                adminToken,
            } = await loadFixture(deploys);
            let name = "Dummy";
            let symbol = "DMM";
            let decimals = 18;
            let mintable = true;
            let maxTotalSupply = 1_000_000;
            let mintAmount = 0;
            let adminTokenAddress = adminToken.address;
            await factory.createERC20Token(
                name,
                symbol,
                ipfsUrl,
                decimals,
                mintable,
                maxTotalSupply,
                mintAmount,
                adminTokenAddress
            );
            let tokenAddress = await factory.lastProducedToken();
            token = await ethers.getContractAt(
                "contracts/BentureProducedToken.sol:BentureProducedToken",
                tokenAddress
            );
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
            expect(await token.decimals()).to.equal(decimals);
            expect(await token.mintable()).to.equal(mintable);
        });
    });

    describe("Upgrades", () => {
        it("Should have a new method after upgrade", async () => {
            let {
                ownerAcc,
                clientAcc1,
                clientAcc2,
                benture,
                factory,
                adminToken,
            } = await loadFixture(deploys);
            let factoryV1Tx = await ethers.getContractFactory(
                "contracts/BentureFactory.sol:BentureFactory"
            );
            let factoryV2Tx = await ethers.getContractFactory(
                "BentureFactoryV2"
            );

            let factoryV1 = await upgrades.deployProxy(
                factoryV1Tx,
                [benture.address],
                {
                    initializer: "initialize",
                    kind: "uups",
                }
            );
            let factoryV2 = await upgrades.upgradeProxy(
                factoryV1.address,
                factoryV2Tx,
                {
                    kind: "uups",
                }
            );

            expect(await factoryV2.agent()).to.equal(47);
        });
        it("Should become the next version if token contract was changed", async () => {
            let {
                ownerAcc,
                clientAcc1,
                clientAcc2,
                benture,
                oldFactory,
                adminToken,
            } = await loadFixture(deploys);

            // This factory uses standard tokens
            let factoryV1Tx = await ethers.getContractFactory(
                "contracts/BentureFactory.sol:BentureFactory"
            );
            // This is the same as the previous one
            let factoryV1_1Tx = await ethers.getContractFactory(
                "contracts/BentureFactory.sol:BentureFactory"
            );
            // This factory has exactly the same code as the previous one but it uses tokens that have an `agent` function
            let factoryV2Tx = await ethers.getContractFactory(
                "contracts/mocks/factory_special/BentureFactory.sol:BentureFactory"
            );

            // Deploy the first factory proxy
            let factoryV1 = await upgrades.deployProxy(
                factoryV1Tx,
                [benture.address],
                {
                    initializer: "initialize",
                    kind: "uups",
                }
            );

            let implAddress1 = await upgrades.erc1967.getImplementationAddress(
                factoryV1.address
            );

            // This "upgrade" should change neither proxy address nor implementation address
            let implAddress2 = await upgrades.prepareUpgrade(
                factoryV1.address,
                factoryV1_1Tx
            );
            let factoryV2 = await upgrades.upgradeProxy(
                factoryV1,
                factoryV1_1Tx
            );
            expect(factoryV1.address).to.equal(factoryV2.address);
            expect(implAddress1).to.equal(implAddress2);

            // Now upgrade to the implementation that uses a different token
            let implAddress3 = await upgrades.prepareUpgrade(
                factoryV1.address,
                factoryV2Tx
            );
            let factoryV3 = await upgrades.upgradeProxy(factoryV1, factoryV2Tx);
            // The proxy addresses should be the same because it was just upgraded
            expect(factoryV1.address).to.equal(factoryV3.address);
            expect(factoryV2.address).to.equal(factoryV3.address);
            // Implementation addresses should be different
            expect(implAddress1).not.to.equal(implAddress3);
            expect(implAddress2).not.to.equal(implAddress3);
        });
    });
});
