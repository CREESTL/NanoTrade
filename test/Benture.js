const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { parseUnits, parseEther } = ethers.utils;

describe("Benture Dividend Distributing Contract", () => {
    let benture;
    let origToken;
    let adminToken;
    let factory;
    let zeroAddress = ethers.constants.AddressZero;
    let randomAddress = "0xEd24551e059304BE771ac6CF8B654271ec156Ba0";
    let parseEther = ethers.utils.parseEther;

    // Deploy all contracts before each test suite
    beforeEach(async () => {
        [ownerAcc, clientAcc1, clientAcc2, clientAcc3] =
            await ethers.getSigners();

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

        // Create new ERC20 and ERC721 and assign them to caller (owner)
        await factory.createERC20Token(
            "Dummy",
            "DMM",
            18,
            true,
            parseUnits("1000000000", 18),
            // Provide the address of the previously deployed ERC721
            adminToken.address
        );

        // Get the address of the last ERC20 token produced in the factory
        origTokenAddress = await factory.lastProducedToken();
        origToken = await ethers.getContractAt(
            "BentureProducedToken",
            origTokenAddress
        );

        // Deploy another ERC20 in order to have a distToken
        await factory.createERC20Token(
            "Slummy",
            "SMM",
            18,
            true,
            parseUnits("1000000000", 18),
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
    });

    // #P
    describe("Pools", () => {
        it("Should create and get a new pool of tokens", async () => {
            // This creates a new pool
            await expect(
                factory.createERC20Token(
                    "Grummy",
                    "GRM",
                    18,
                    true,
                    parseUnits("1000000000", 18),
                    adminToken.address
                )
            ).to.emit(benture, "PoolCreated");
            let grummyAddress = await factory.lastProducedToken();
            let grummy = await ethers.getContractAt(
                "BentureProducedToken",
                grummyAddress
            );
            const {
                0: token,
                1: totalLockers,
                2: totalLocked,
            } = await benture.getPool(grummy.address);
            expect(token).to.equal(grummy.address);
            expect(totalLockers).to.equal(0);
            expect(totalLocked).to.equal(0);
        });
    });

    // #FP
    describe("Fails for pools", () => {
        it("Should fail to get pool of zero address tokens", async () => {
            await expect(
                benture.getPool(zeroAddress)
            ).to.be.revertedWithCustomError(benture, "InvalidTokenAddress");
        });
    });

    // #L
    describe("Lock tokens", () => {
        it("Should lock some tokens and use getters", async () => {
            let mintAmount = parseUnits("1000000", 6);
            let lockAmount = parseUnits("1000", 6);
            await origToken.mint(ownerAcc.address, mintAmount);
            let userStartBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureStartBalance = await origToken.balanceOf(
                benture.address
            );
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(false);
            await expect(benture.lockTokens(origToken.address, lockAmount))
                .to.emit(benture, "TokensLocked")
                .withArgs(anyValue, anyValue, anyValue);
            let userEndBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureEndBalance = await origToken.balanceOf(benture.address);
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(true);
            expect(userStartBalance.sub(userEndBalance)).to.equal(lockAmount);
            expect(bentureEndBalance.sub(bentureStartBalance)).to.equal(
                lockAmount
            );

            const {
                0: token,
                1: totalLockers,
                2: totalLocked,
            } = await benture.getPool(origToken.address);
            expect(token).to.equal(origToken.address);
            expect(totalLockers).to.equal(1);
            expect(totalLocked).to.equal(lockAmount);

            expect(
                await benture.getCurrentLock(
                    origToken.address,
                    ownerAcc.address
                )
            ).to.equal(lockAmount);

            let lockers = await benture.getLockers(origToken.address);
            expect(lockers.length).to.equal(1);
            expect(lockers[0]).to.equal(ownerAcc.address);
        });

        it("Should lock all tokens and use getters", async () => {
            let mintAmount = parseUnits("1000000", 6);
            await origToken.mint(ownerAcc.address, mintAmount);
            let userStartBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureStartBalance = await origToken.balanceOf(
                benture.address
            );
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(false);
            await expect(benture.lockAllTokens(origToken.address))
                .to.emit(benture, "TokensLocked")
                .withArgs(anyValue, anyValue, anyValue);
            let userEndBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureEndBalance = await origToken.balanceOf(benture.address);
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(true);
            expect(userStartBalance.sub(userEndBalance)).to.equal(
                userStartBalance
            );
            expect(bentureEndBalance.sub(bentureStartBalance)).to.equal(
                userStartBalance
            );

            const {
                0: token,
                1: totalLockers,
                2: totalLocked,
            } = await benture.getPool(origToken.address);
            expect(token).to.equal(origToken.address);
            expect(totalLockers).to.equal(1);
            expect(totalLocked).to.equal(userStartBalance);

            expect(
                await benture.getCurrentLock(
                    origToken.address,
                    ownerAcc.address
                )
            ).to.equal(userStartBalance);

            let lockers = await benture.getLockers(origToken.address);
            expect(lockers.length).to.equal(1);
            expect(lockers[0]).to.equal(ownerAcc.address);
        });
        it("Should not increase number of lockers if the same user is locking", async () => {
            let mintAmount = parseUnits("1000000", 6);
            let lockAmount = parseUnits("1000", 6);
            await origToken.mint(ownerAcc.address, mintAmount);
            await benture.lockTokens(origToken.address, lockAmount);
            let lockers = await benture.getLockers(origToken.address);
            expect(lockers.length).to.equal(1);
            await benture.lockTokens(origToken.address, lockAmount);
            lockers = await benture.getLockers(origToken.address);
            expect(lockers.length).to.equal(1);
        });
    });

    // #FL
    describe("Fails for locking tokens", () => {
        it("Should fail to lock zero amount of tokens", async () => {
            let lockAmount = parseUnits("0", 6);
            await expect(
                benture.lockTokens(origToken.address, lockAmount)
            ).to.be.revertedWithCustomError(benture, "InvalidLockAmount");
        });
        it("Should fail to lock zero address tokens", async () => {
            let lockAmount = parseUnits("1000", 6);
            await expect(
                benture.lockTokens(zeroAddress, lockAmount)
            ).to.be.revertedWithCustomError(benture, "InvalidTokenAddress");
        });
        it("Should fail to lock zero address tokens", async () => {
            let lockAmount = parseUnits("1000", 6);
            await expect(
                benture.lockTokens(randomAddress, lockAmount)
            ).to.be.revertedWithCustomError(benture, "PoolDoesNotExist");
        });
        it("Shoud fail to lock if user has no tokens", async () => {
            let lockAmount = parseUnits("1000", 6);
            await expect(
                benture.lockTokens(origToken.address, lockAmount)
            ).to.be.revertedWithCustomError(
                benture,
                "UserDoesNotHaveProjectTokens"
            );
        });
    });

    // #U
    describe("Unlock tokens", () => {
        it("Should unlock some tokens without claiming any dividends", async () => {
            let mintAmount = parseUnits("1000000", 6);
            let lockAmount = parseUnits("1000", 6);
            await origToken.mint(ownerAcc.address, mintAmount);
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(false);
            await benture.lockTokens(origToken.address, lockAmount);
            let userStartBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureStartBalance = await origToken.balanceOf(
                benture.address
            );
            await expect(
                benture.unlockTokens(origToken.address, lockAmount / 2)
            )
                .to.emit(benture, "TokensUnlocked")
                .withArgs(anyValue, anyValue, anyValue);
            let userEndBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureEndBalance = await origToken.balanceOf(benture.address);
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(true);
            expect(userEndBalance.sub(userStartBalance)).to.equal(
                lockAmount.div(2)
            );
            expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(
                lockAmount.div(2)
            );

            const {
                0: token,
                1: totalLockers,
                2: totalLocked,
            } = await benture.getPool(origToken.address);
            expect(token).to.equal(origToken.address);
            expect(totalLockers).to.equal(1);
            expect(totalLocked).to.equal(lockAmount.div(2));

            expect(
                await benture.getCurrentLock(
                    origToken.address,
                    ownerAcc.address
                )
            ).to.equal(lockAmount.div(2));

            let lockers = await benture.getLockers(origToken.address);
            expect(lockers.length).to.equal(1);
            expect(lockers[0]).to.equal(ownerAcc.address);
        });

        it("Should unlock all tokens without claiming any dividends", async () => {
            let mintAmount = parseUnits("1000000", 6);
            let lockAmount = parseUnits("1000", 6);
            await origToken.mint(ownerAcc.address, mintAmount);
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(false);
            await benture.lockTokens(origToken.address, lockAmount);
            let userStartBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureStartBalance = await origToken.balanceOf(
                benture.address
            );
            await expect(benture.unlockAllTokens(origToken.address))
                .to.emit(benture, "TokensUnlocked")
                .withArgs(anyValue, anyValue, anyValue);
            let userEndBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureEndBalance = await origToken.balanceOf(benture.address);
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(false);
            expect(userEndBalance.sub(userStartBalance)).to.equal(lockAmount);
            expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(
                lockAmount
            );

            const {
                0: token,
                1: totalLockers,
                2: totalLocked,
            } = await benture.getPool(origToken.address);
            expect(token).to.equal(origToken.address);
            expect(totalLockers).to.equal(0);
            expect(totalLocked).to.equal(0);

            expect(
                await benture.getCurrentLock(
                    origToken.address,
                    ownerAcc.address
                )
            ).to.equal(0);

            let lockers = await benture.getLockers(origToken.address);
            expect(lockers.length).to.equal(0);
        });
        it("Should lock and unlock multiple clients` tokens before any distribution", async () => {
            let mintAmount = parseEther("1");

            await origToken.mint(clientAcc1.address, mintAmount);
            await origToken.mint(clientAcc2.address, mintAmount.mul(2));

            await origToken.connect(clientAcc1).approve(benture.address, mintAmount);
            await origToken.connect(clientAcc2).approve(benture.address, mintAmount.mul(2));


            // Lock all tokens of the first account
            await benture.connect(clientAcc1).lockAllTokens(origToken.address);
            expect(
                await benture.getCurrentLock(
                    origToken.address,
                    clientAcc1.address
                )
            ).to.equal(mintAmount);
            // Lock half of second account's balance
            await benture.connect(clientAcc2).lockTokens(origToken.address, mintAmount);
            // Lock the second half of second account's balance
            await benture.connect(clientAcc2).lockTokens(origToken.address, mintAmount);
            expect(
                await benture.getCurrentLock(
                    origToken.address,
                    clientAcc2.address
                )
            ).to.equal(mintAmount.mul(2));

            // First unlock a half.
            await benture.connect(clientAcc1).unlockTokens(origToken.address, mintAmount.div(2));
            await benture.connect(clientAcc2).unlockTokens(origToken.address, mintAmount.div(2));
            // Then unlock the rest
            await benture.connect(clientAcc1).unlockAllTokens(origToken.address);
            await benture.connect(clientAcc2).unlockAllTokens(origToken.address);

            const {
                0: token,
                1: totalLockers,
                2: totalLocked,
            } = await benture.getPool(origToken.address);
            expect(token).to.equal(origToken.address);
            expect(totalLockers).to.equal(0);
            expect(totalLocked).to.equal(0);

            expect(
                await benture.getCurrentLock(
                    origToken.address,
                    clientAcc1.address
                )
            ).to.equal(0);
            expect(
                await benture.getCurrentLock(
                    origToken.address,
                    clientAcc2.address
                )
            ).to.equal(0);

            let lockers = await benture.getLockers(origToken.address);
            expect(lockers.length).to.equal(0);
        });

        it("Should unlock all tokens without claiming any dividends", async () => {
            let mintAmount = parseUnits("1000000", 6);
            let lockAmount = parseUnits("1000", 6);
            await origToken.mint(ownerAcc.address, mintAmount);
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(false);
            await benture.lockTokens(origToken.address, lockAmount);
            let userStartBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureStartBalance = await origToken.balanceOf(
                benture.address
            );
            await expect(benture.unlockAllTokens(origToken.address))
                .to.emit(benture, "TokensUnlocked")
                .withArgs(anyValue, anyValue, anyValue);
            let userEndBalance = await origToken.balanceOf(ownerAcc.address);
            let bentureEndBalance = await origToken.balanceOf(benture.address);
            expect(
                await benture.isLocker(origToken.address, ownerAcc.address)
            ).to.equal(false);
            expect(userEndBalance.sub(userStartBalance)).to.equal(lockAmount);
            expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(
                lockAmount
            );

            const {
                0: token,
                1: totalLockers,
                2: totalLocked,
            } = await benture.getPool(origToken.address);
            expect(token).to.equal(origToken.address);
            expect(totalLockers).to.equal(0);
            expect(totalLocked).to.equal(0);

            expect(
                await benture.getCurrentLock(
                    origToken.address,
                    ownerAcc.address
                )
            ).to.equal(0);

            let lockers = await benture.getLockers(origToken.address);
            expect(lockers.length).to.equal(0);
        });
    });

    // #FU
    describe("Fails for unlocking tokens", () => {
        it("Should fail to unlock zero amount of tokens", async () => {
            let unlockAmount = parseUnits("0", 6);
            await expect(
                benture.unlockTokens(origToken.address, unlockAmount)
            ).to.be.revertedWithCustomError(benture, "InvalidUnlockAmount");
        });
        it("Should fail to unlock zero address tokens", async () => {
            let unlockAmount = parseUnits("1000", 6);
            await expect(
                benture.unlockTokens(zeroAddress, unlockAmount)
            ).to.be.revertedWithCustomError(benture, "InvalidTokenAddress");
        });
        it("Should fail to unlock if no pool exists", async () => {
            let unlockAmount = parseUnits("1000", 6);
            await expect(
                benture.unlockTokens(randomAddress, unlockAmount)
            ).to.be.revertedWithCustomError(benture, "PoolDoesNotExist");
        });
        it("Should fail to unlock if no lock was made", async () => {
            let unlockAmount = parseUnits("1000", 6);
            await expect(
                benture.unlockTokens(origToken.address, unlockAmount)
            ).to.be.revertedWithCustomError(benture, "NoLockedTokens");
        });
        it("Should fail to unlock if amount is greater than lock", async () => {
            let mintAmount = parseUnits("1000000", 6);
            let lockAmount = parseUnits("1000", 6);
            await origToken.mint(ownerAcc.address, mintAmount);
            await benture.lockTokens(origToken.address, lockAmount);
            let unlockAmount = parseUnits("100000", 6);
            await expect(
                benture.unlockTokens(origToken.address, unlockAmount)
            ).to.be.revertedWithCustomError(benture, "WithdrawTooBig");
        });
    });

    // #D
    describe("Distribute dividends", () => {
        // #DE
        describe("Equal dividends", () => {
            // #DEE
            describe("ERC20 tokens dividends", () => {
                it("Should distribute dividends to a single address and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseUnits("100", 6);
                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);
                    let ownerStartBalance = await distToken.balanceOf(
                        ownerAcc.address
                    );
                    await expect(
                        benture.distributeDividends(
                            origToken.address,
                            distToken.address,
                            claimAmount,
                            true
                        )
                    )
                        .to.emit(benture, "DividendsStarted")
                        .withArgs(anyValue, anyValue, anyValue, true);

                    let ownerEndBalance = await distToken.balanceOf(
                        ownerAcc.address
                    );

                    // The client does not claim dividends here at all

                    expect(ownerStartBalance.sub(ownerEndBalance)).to.equal(
                        claimAmount
                    );

                    let ids = await benture.getDistributions(ownerAcc.address);
                    expect(ids.length).to.equal(1);
                    expect(ids[0]).to.equal(1);

                    let dist = await benture.getDistribution(1);
                    let {
                        0: id,
                        1: token1,
                        2: token2,
                        3: amount,
                        4: isEqual,
                    } = dist;
                    expect(id).to.equal(1);
                    expect(token1).to.equal(origToken.address);
                    expect(token2).to.equal(distToken.address);
                    expect(amount).to.equal(claimAmount);
                    expect(isEqual).to.equal(true);

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(parseUnits("100", 6));
                });

                it("Should distribute dividends to a list of addresses and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseUnits("100", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount);

                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(parseUnits("50", 6));
                    expect(
                        await benture.connect(clientAcc2).getMyShare(1)
                    ).to.equal(parseUnits("50", 6));
                });

                it("Should distribute dividends if one holder unlocks all tokens and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseUnits("100", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount);
                    await benture
                        .connect(clientAcc2)
                        .unlockAllTokens(origToken.address);
                    expect(
                        await benture.isLocker(
                            origToken.address,
                            clientAcc2.address
                        )
                    ).to.equal(false);

                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(parseUnits("100", 6));
                    await expect(
                        benture.connect(clientAcc2).getMyShare(1)
                    ).to.be.revertedWithCustomError(
                        benture,
                        "CallerIsNotLocker"
                    );
                });
            });

            // DEN
            describe("Native tokens dividends", () => {
                it("Should distribute dividends to a single address and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseEther("1");

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);
                    let ownerStartBalance = await ethers.provider.getBalance(
                        ownerAcc.address
                    );
                    await expect(
                        benture.distributeDividends(
                            origToken.address,
                            zeroAddress,
                            claimAmount,
                            true,
                            { value: claimAmount }
                        )
                    )
                        .to.emit(benture, "DividendsStarted")
                        .withArgs(anyValue, anyValue, anyValue, true);

                    let ownerEndBalance = await ethers.provider.getBalance(
                        ownerAcc.address
                    );

                    // Additional payments for gas
                    expect(ownerStartBalance.sub(ownerEndBalance)).to.be.gt(
                        claimAmount
                    );

                    let ids = await benture.getDistributions(ownerAcc.address);
                    expect(ids.length).to.equal(1);
                    expect(ids[0]).to.equal(1);

                    let dist = await benture.getDistribution(1);
                    let {
                        0: id,
                        1: token1,
                        2: token2,
                        3: amount,
                        4: isEqual,
                    } = dist;
                    expect(id).to.equal(1);
                    expect(token1).to.equal(origToken.address);
                    expect(token2).to.equal(zeroAddress);
                    expect(amount).to.equal(claimAmount);
                    expect(isEqual).to.equal(true);

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(claimAmount);
                });

                it("Should distribute dividends to a list of addresses and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseEther("1");

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount);

                    await benture.distributeDividends(
                        origToken.address,
                        zeroAddress,
                        claimAmount,
                        true,
                        { value: claimAmount }
                    );

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(claimAmount.div(2));
                    expect(
                        await benture.connect(clientAcc2).getMyShare(1)
                    ).to.equal(claimAmount.div(2));
                });

                it("Should distribute dividends if one holder unlocks all tokens and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseUnits("100", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount);
                    await benture
                        .connect(clientAcc2)
                        .unlockAllTokens(origToken.address);
                    expect(
                        await benture.isLocker(
                            origToken.address,
                            clientAcc2.address
                        )
                    ).to.equal(false);

                    await benture.distributeDividends(
                        origToken.address,
                        zeroAddress,
                        claimAmount,
                        true,
                        { value: claimAmount }
                    );

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(parseUnits("100", 6));
                    await expect(
                        benture.connect(clientAcc2).getMyShare(1)
                    ).to.be.revertedWithCustomError(
                        benture,
                        "CallerIsNotLocker"
                    );
                });
            });
        });

        // #DW
        describe("Weighted dividends", () => {
            // #DWE
            describe("ERC20 tokens dividends", () => {
                it("Should distribute dividends to a single address and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseUnits("100", 6);
                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);
                    let ownerStartBalance = await distToken.balanceOf(
                        ownerAcc.address
                    );
                    await expect(
                        benture.distributeDividends(
                            origToken.address,
                            distToken.address,
                            claimAmount,
                            false
                        )
                    )
                        .to.emit(benture, "DividendsStarted")
                        .withArgs(anyValue, anyValue, anyValue, false);

                    let ownerEndBalance = await distToken.balanceOf(
                        ownerAcc.address
                    );

                    expect(ownerStartBalance.sub(ownerEndBalance)).to.equal(
                        claimAmount
                    );

                    let ids = await benture.getDistributions(ownerAcc.address);
                    expect(ids.length).to.equal(1);
                    expect(ids[0]).to.equal(1);

                    let dist = await benture.getDistribution(1);
                    let {
                        0: id,
                        1: token1,
                        2: token2,
                        3: amount,
                        4: isEqual,
                    } = dist;
                    expect(id).to.equal(1);
                    expect(token1).to.equal(origToken.address);
                    expect(token2).to.equal(distToken.address);
                    expect(amount).to.equal(claimAmount);
                    expect(isEqual).to.equal(false);

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(parseUnits("100", 6));
                });

                it("Should distribute dividends to a list of addresses and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("3000", 6);
                    let claimAmount = parseUnits("40", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount1);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount1);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount2);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount2);

                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        false
                    );

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(claimAmount.div(4));
                    expect(
                        await benture.connect(clientAcc2).getMyShare(1)
                    ).to.equal(claimAmount.div(4).mul(3));
                });

                it("Should distribute dividends if one holder unlocks all tokens and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("3000", 6);
                    let claimAmount = parseUnits("40", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount1);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount1);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount2);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount2);
                    await benture
                        .connect(clientAcc2)
                        .unlockAllTokens(origToken.address);
                    expect(
                        await benture.isLocker(
                            origToken.address,
                            clientAcc2.address
                        )
                    ).to.equal(false);

                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        false
                    );

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(claimAmount);
                    await expect(
                        benture.connect(clientAcc2).getMyShare(1)
                    ).to.be.revertedWithCustomError(
                        benture,
                        "CallerIsNotLocker"
                    );
                });
            });

            // #DWN
            describe("Native tokens dividends", () => {
                it("Should distribute dividends to a single address and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseEther("1");

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);
                    let ownerStartBalance = await ethers.provider.getBalance(
                        ownerAcc.address
                    );
                    await expect(
                        benture.distributeDividends(
                            origToken.address,
                            zeroAddress,
                            claimAmount,
                            false,
                            { value: claimAmount }
                        )
                    )
                        .to.emit(benture, "DividendsStarted")
                        .withArgs(anyValue, anyValue, anyValue, false);

                    let ownerEndBalance = await ethers.provider.getBalance(
                        ownerAcc.address
                    );

                    // Additional payments for gas
                    expect(ownerStartBalance.sub(ownerEndBalance)).to.be.gt(
                        claimAmount
                    );

                    let ids = await benture.getDistributions(ownerAcc.address);
                    expect(ids.length).to.equal(1);
                    expect(ids[0]).to.equal(1);

                    let dist = await benture.getDistribution(1);
                    let {
                        0: id,
                        1: token1,
                        2: token2,
                        3: amount,
                        4: isEqual,
                    } = dist;
                    expect(id).to.equal(1);
                    expect(token1).to.equal(origToken.address);
                    expect(token2).to.equal(zeroAddress);
                    expect(amount).to.equal(claimAmount);
                    expect(isEqual).to.equal(false);

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(claimAmount);
                });

                it("Should distribute dividends to a list of addresses and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("3000", 6);
                    let claimAmount = parseEther("1");

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount1);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount1);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount2);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount2);

                    await benture.distributeDividends(
                        origToken.address,
                        zeroAddress,
                        claimAmount,
                        false,
                        { value: claimAmount }
                    );

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(claimAmount.div(4));
                    expect(
                        await benture.connect(clientAcc2).getMyShare(1)
                    ).to.equal(claimAmount.div(4).mul(3));
                });

                it("Should distribute dividends if one holder unlocks all tokens and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("1000", 6);
                    let claimAmount = parseEther("1");

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount1);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount1);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount2);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount2);
                    await benture
                        .connect(clientAcc2)
                        .unlockAllTokens(origToken.address);
                    expect(
                        await benture.isLocker(
                            origToken.address,
                            clientAcc2.address
                        )
                    ).to.equal(false);

                    await benture.distributeDividends(
                        origToken.address,
                        zeroAddress,
                        claimAmount,
                        true,
                        { value: claimAmount }
                    );

                    expect(
                        await benture.connect(clientAcc1).getMyShare(1)
                    ).to.equal(claimAmount);
                    await expect(
                        benture.connect(clientAcc2).getMyShare(1)
                    ).to.be.revertedWithCustomError(
                        benture,
                        "CallerIsNotLocker"
                    );
                });
            });
        });
    });

    // #DFEW
    describe("Fails for Equal & Weighted Dividends", () => {
        it("Should fail to distribute dividends with invalid parameters", async () => {
            await expect(
                benture.distributeDividends(
                    zeroAddress,
                    distToken.address,
                    1000,
                    true
                )
            ).to.be.revertedWithCustomError(benture, "InvalidTokenAddress");

            await expect(
                benture
                    .connect(clientAcc1)
                    .distributeDividends(
                        origToken.address,
                        distToken.address,
                        1000,
                        true
                    )
            ).to.be.revertedWithCustomError(
                benture,
                "UserDoesNotHaveAnAdminToken"
            );

            await expect(
                benture.distributeDividends(
                    origToken.address,
                    origToken.address,
                    0,
                    true
                )
            ).to.be.revertedWithCustomError(benture, "InvalidDividendsAmount");

            await expect(
                benture.distributeDividends(
                    origToken.address,
                    zeroAddress,
                    777,
                    true,
                    { value: 1 }
                )
            ).to.be.revertedWithCustomError(benture, "NotEnoughNativeTokens");
        });

        it("Should fail to distribute too high dividends", async () => {
            let claimAmount = parseUnits("50000000", 6);
            await distToken
                .connect(ownerAcc)
                .approve(benture.address, claimAmount);
            await expect(
                benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                )
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
    });

    // #CL
    describe("Claim dividends", () => {
        // All possible options of single dividends claims are tested for a reason. If they all pass tests, that
        // means that it is possible to use only one of these options (kinds of dividends) for testing multiple
        // dividends claim and avoid nesting there
        // #CLS
        describe("Claim a single dividend", () => {
            // #CLSEE
            describe("Claim a single equal ERC20 tokens dividend", () => {
                // Only test getters in this case
                it("Should claim a single equal ERC20 tokens dividend and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseUnits("300", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);

                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    expect(
                        await benture.checkStartedByAdmin(1, ownerAcc.address)
                    ).to.equal(true);

                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(0);
                    await expect(benture.connect(clientAcc1).claimDividends(1))
                        .to.emit(benture, "DividendsClaimed")
                        .withArgs(anyValue, anyValue);

                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(parseUnits("300", 6));
                    expect(
                        await benture.hasClaimed(1, clientAcc1.address)
                    ).to.equal(true);
                });
            });
            // #CLSWE
            describe("Claim a single weighted ERC20 tokens dividend", () => {
                it("Should claim a single weighted ERC20 tokens dividend", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("3000", 6);
                    let claimAmount = parseUnits("400", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount1);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount1);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount2);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount2);

                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        false
                    );

                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(0);
                    expect(
                        await distToken.balanceOf(clientAcc2.address)
                    ).to.equal(0);

                    await benture.connect(clientAcc1).claimDividends(1);
                    await benture.connect(clientAcc2).claimDividends(1);

                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(parseUnits("100", 6));
                    expect(
                        await distToken.balanceOf(clientAcc2.address)
                    ).to.equal(parseUnits("300", 6));
                    expect(
                        await benture.hasClaimed(1, clientAcc1.address)
                    ).to.equal(true);
                    expect(
                        await benture.hasClaimed(1, clientAcc2.address)
                    ).to.equal(true);
                });
            });
            // #CLSEN
            describe("Claim a single equal native tokens dividend", () => {
                it("Should claim a single equal native tokens dividend and use getters", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseEther("1");

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);

                    await benture.distributeDividends(
                        origToken.address,
                        zeroAddress,
                        claimAmount,
                        true,
                        { value: claimAmount }
                    );

                    expect(
                        await benture.checkStartedByAdmin(1, ownerAcc.address)
                    ).to.equal(true);

                    expect(
                        await benture.checkStartedByAdmin(1, clientAcc1.address)
                    ).to.equal(false);

                    let startBalance = await ethers.provider.getBalance(
                        clientAcc1.address
                    );
                    await expect(benture.connect(clientAcc1).claimDividends(1))
                        .to.emit(benture, "DividendsClaimed")
                        .withArgs(anyValue, anyValue);

                    let endBalance = await ethers.provider.getBalance(
                        clientAcc1.address
                    );
                    // Some token were spent for gas
                    expect(endBalance.sub(startBalance)).to.be.lt(
                        parseEther("1")
                    );
                    expect(endBalance.sub(startBalance)).to.be.gt(
                        parseEther("0.9")
                    );
                    expect(
                        await benture.hasClaimed(1, clientAcc1.address)
                    ).to.equal(true);
                });
            });
            // #CLSWN
            describe("Claim a single weighted native tokens dividend", () => {
                it("Should claim a single weighted native tokens dividend", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("3000", 6);
                    let claimAmount = parseEther("4");

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount1);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount1);

                    await origToken.mint(clientAcc2.address, mintAmount);
                    await origToken
                        .connect(clientAcc2)
                        .approve(benture.address, lockAmount2);
                    await benture
                        .connect(clientAcc2)
                        .lockTokens(origToken.address, lockAmount2);

                    await benture.distributeDividends(
                        origToken.address,
                        zeroAddress,
                        claimAmount,
                        false,
                        { value: claimAmount }
                    );

                    expect(
                        await benture.checkStartedByAdmin(1, ownerAcc.address)
                    ).to.equal(true);

                    let startBalance1 = await ethers.provider.getBalance(
                        clientAcc1.address
                    );
                    let startBalance2 = await ethers.provider.getBalance(
                        clientAcc2.address
                    );

                    await benture.connect(clientAcc1).claimDividends(1);
                    await benture.connect(clientAcc2).claimDividends(1);

                    let endBalance1 = await ethers.provider.getBalance(
                        clientAcc1.address
                    );
                    let endBalance2 = await ethers.provider.getBalance(
                        clientAcc2.address
                    );
                    expect(endBalance1.sub(startBalance1)).to.be.lt(
                        parseEther("1")
                    );
                    expect(endBalance1.sub(startBalance1)).to.be.gt(
                        parseEther("0.9")
                    );
                    expect(endBalance2.sub(startBalance2)).to.be.lt(
                        parseEther("3")
                    );
                    expect(endBalance2.sub(startBalance2)).to.be.gt(
                        parseEther("2.9")
                    );
                    expect(
                        await benture.hasClaimed(1, clientAcc1.address)
                    ).to.equal(true);
                    expect(
                        await benture.hasClaimed(1, clientAcc2.address)
                    ).to.equal(true);
                });
            });
        });
        // #CLSC
        describe("Claim a single dividend in complicated scenarios", () => {
            it("Should claim a single dividend from the past", async () => {
                let mintAmount = parseUnits("1000000", 6);
                let lockAmount = parseUnits("1000", 6);
                let claimAmount = parseUnits("300", 6);

                await origToken.mint(clientAcc1.address, mintAmount);
                await origToken
                    .connect(clientAcc1)
                    .approve(benture.address, lockAmount);
                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount);

                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture.connect(clientAcc1).claimDividends(1);

                expect(await distToken.balanceOf(clientAcc1.address)).to.equal(
                    parseUnits("300", 6)
                );
                expect(
                    await benture.hasClaimed(1, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(2, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(3, clientAcc1.address)
                ).to.equal(false);
            });

            it("Should claim dividend after which the lock was changed", async () => {
                let mintAmount = parseUnits("1000000", 6);
                let lockAmount = parseUnits("1000", 6);
                let additionalLock = parseUnits("700", 6);
                let claimAmount = parseUnits("300", 6);

                await origToken.mint(clientAcc1.address, mintAmount);
                await origToken
                    .connect(clientAcc1)
                    .approve(benture.address, lockAmount.add(additionalLock));
                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount);

                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, additionalLock);

                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture.connect(clientAcc1).claimDividends(1);

                expect(await distToken.balanceOf(clientAcc1.address)).to.equal(
                    parseUnits("300", 6)
                );
            });

            it("Should claim a single dividend in the most complicated scenario", async () => {
                let mintAmount = parseUnits("10000000", 6);
                let lockAmount1 = parseUnits("1000", 6);
                let lockAmount2 = parseUnits("200", 6);
                let lockAmount3 = parseUnits("400", 6);
                let claimAmount = parseUnits("300", 6);

                await origToken.mint(clientAcc1.address, mintAmount);
                await origToken
                    .connect(clientAcc1)
                    .approve(benture.address, mintAmount);
                await origToken.mint(clientAcc2.address, mintAmount);
                await origToken
                    .connect(clientAcc2)
                    .approve(benture.address, mintAmount);

                // A total of 8 distributions were started
                // User takes part in 7 of them
                // He only changes his lock ID2, ID3, ID7. Each time - by a new amount
                // Another user joins pool before 8th distribution

                // 1
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount1);

                // 2
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount2);

                // 3
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                // 4
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                // 5
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                // 6
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount3);

                // 7
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                // Another user locks as well
                await benture
                    .connect(clientAcc2)
                    .lockTokens(origToken.address, lockAmount3);

                // 8
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    false
                );

                // This one is equal
                await benture.connect(clientAcc1).claimDividends(4);

                expect(await distToken.balanceOf(clientAcc1.address)).to.equal(
                    parseUnits("300", 6)
                );
                expect(
                    await benture.hasClaimed(1, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(2, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(3, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(4, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(5, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(6, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(7, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(8, clientAcc1.address)
                ).to.equal(false);

                // This one is weighted
                // user 1 lock = 1600
                // user 2 lock = 400
                await benture.connect(clientAcc1).claimDividends(8);

                // User 1 should receive 1600 * 300 / 2000 = 240 tokens
                expect(await distToken.balanceOf(clientAcc1.address)).to.equal(
                    parseUnits("540", 6)
                );
                expect(
                    await benture.hasClaimed(1, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(2, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(3, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(4, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(5, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(6, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(7, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(8, clientAcc1.address)
                ).to.equal(true);

                await benture.connect(clientAcc2).claimDividends(8);

                // User 2 should receive 400 * 300 / 2000 = 60 tokens
                expect(await distToken.balanceOf(clientAcc2.address)).to.equal(
                    parseUnits("60", 6)
                );
                expect(
                    await benture.hasClaimed(1, clientAcc2.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(2, clientAcc2.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(3, clientAcc2.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(4, clientAcc2.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(5, clientAcc2.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(6, clientAcc2.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(7, clientAcc2.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(8, clientAcc2.address)
                ).to.equal(true);
            });
            // These are tests for `calculateShare` and `findMaxPrev` functions
            describe("Calculate shares for a single distribution", () => {
                it("Should result in a correct share if user hasn't change his lock amount before the distribution for a long time", async () => {
                    let mintAmount = parseUnits("10000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let claimAmount = parseUnits("300", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, mintAmount);

                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount1);

                    // 1
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );
                    // 2
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );
                    // 3
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );
                    // 4
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );
                    // 5
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    await benture.connect(clientAcc1).claimDividends(5);

                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(parseUnits("300", 6));
                    expect(
                        await benture.hasClaimed(1, clientAcc1.address)
                    ).to.equal(false);
                    expect(
                        await benture.hasClaimed(2, clientAcc1.address)
                    ).to.equal(false);
                    expect(
                        await benture.hasClaimed(3, clientAcc1.address)
                    ).to.equal(false);
                    expect(
                        await benture.hasClaimed(4, clientAcc1.address)
                    ).to.equal(false);
                    expect(
                        await benture.hasClaimed(5, clientAcc1.address)
                    ).to.equal(true);
                });
            });
        });

        // All claims of multiple dividends are tested using equal ERC20 tokens dividends
        // #CLM
        describe("Claim multiple dividends", () => {
            // #CLMS
            describe("Claim multiple dividends of the same type", () => {
                it("Should claim multiple dividends of the same type", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseUnits("300", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);

                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    let startBalance = await distToken.balanceOf(
                        clientAcc1.address
                    );
                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(0);

                    await benture
                        .connect(clientAcc1)
                        .claimMultipleDividends([1, 2]);

                    let endBalance = await distToken.balanceOf(
                        clientAcc1.address
                    );
                    expect(endBalance.sub(startBalance)).to.equal(
                        claimAmount.mul(2)
                    );
                });
            });
            // #CLMD
            describe("Claim multiple dividends of different types", () => {
                it("Should claim multiple dividends of different types", async () => {
                    let mintAmount = parseUnits("1000000", 6);
                    let lockAmount = parseUnits("1000", 6);
                    let claimAmount = parseUnits("300", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, lockAmount);
                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount);

                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        false
                    );

                    let startBalance = await distToken.balanceOf(
                        clientAcc1.address
                    );
                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(0);

                    await benture
                        .connect(clientAcc1)
                        .claimMultipleDividends([1, 2]);

                    let endBalance = await distToken.balanceOf(
                        clientAcc1.address
                    );
                    expect(endBalance.sub(startBalance)).to.equal(
                        claimAmount.mul(2)
                    );
                });
            });
        });
        // #CLMC
        describe("Claim multiple dividends in complicated scenarios", () => {
            it("Should claim multiple dividends from the past", async () => {
                let mintAmount = parseUnits("1000000", 6);
                let lockAmount = parseUnits("1000", 6);
                let claimAmount = parseUnits("300", 6);

                await origToken.mint(clientAcc1.address, mintAmount);
                await origToken
                    .connect(clientAcc1)
                    .approve(benture.address, lockAmount);
                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount);

                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .claimMultipleDividends([1, 2]);

                expect(await distToken.balanceOf(clientAcc1.address)).to.equal(
                    claimAmount.mul(2)
                );
                expect(
                    await benture.hasClaimed(1, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(2, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(3, clientAcc1.address)
                ).to.equal(false);
            });

            it("Should claim multiple dividends in the most complicated scenario", async () => {
                let mintAmount = parseUnits("10000000", 6);
                let lockAmount1 = parseUnits("1000", 6);
                let lockAmount2 = parseUnits("200", 6);
                let lockAmount3 = parseUnits("400", 6);
                let claimAmount = parseUnits("300", 6);

                await origToken.mint(clientAcc1.address, mintAmount);
                await origToken
                    .connect(clientAcc1)
                    .approve(benture.address, mintAmount);
                await origToken.mint(clientAcc2.address, mintAmount);
                await origToken
                    .connect(clientAcc2)
                    .approve(benture.address, mintAmount);

                // A total of 8 distributions were started
                // User takes part in 7 of them
                // He only changes his lock ID2, ID3, ID7. Each time - by a new amount
                // Another user joins pool before 8th distribution

                // 1
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount1);

                // 2
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount2);

                // 3
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                // 4
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                // 5
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                // 6
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount3);

                // 7
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                // Another user locks as well
                await benture
                    .connect(clientAcc2)
                    .lockTokens(origToken.address, lockAmount3);

                // 8
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    false
                );

                // 300 for ID2
                // 300 for ID4
                // 300 for ID7
                // 1600 * 300 / 2000 = 240 for ID8
                await benture
                    .connect(clientAcc1)
                    .claimMultipleDividends([2, 4, 7, 8]);

                expect(await distToken.balanceOf(clientAcc1.address)).to.equal(
                    parseUnits("1140", 6)
                );
                expect(
                    await benture.hasClaimed(1, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(2, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(3, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(4, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(5, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(6, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(7, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(8, clientAcc1.address)
                ).to.equal(true);
            });

            it("Should claim multiple dividends on any unlock", async () => {
                let mintAmount = parseUnits("10000000", 6);
                let lockAmount1 = parseUnits("1000", 6);
                let lockAmount2 = parseUnits("200", 6);
                let lockAmount3 = parseUnits("400", 6);
                let claimAmount = parseUnits("300", 6);

                await origToken.mint(clientAcc1.address, mintAmount);
                await origToken
                    .connect(clientAcc1)
                    .approve(benture.address, mintAmount);
                await origToken.mint(clientAcc2.address, mintAmount);
                await origToken
                    .connect(clientAcc2)
                    .approve(benture.address, mintAmount);

                // A total of 8 distributions were started
                // User takes part in 7 of them
                // He only changes his lock ID2, ID3, ID7. Each time - by a new amount
                // Another user joins pool before 8th distribution

                // 1
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount1);

                // 2
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount2);

                // 3
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                // 4
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                // 5
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );
                // 6
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                await benture
                    .connect(clientAcc1)
                    .lockTokens(origToken.address, lockAmount3);

                // 7
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    true
                );

                // Another user locks as well
                await benture
                    .connect(clientAcc2)
                    .lockTokens(origToken.address, lockAmount3);

                // 8
                await benture.distributeDividends(
                    origToken.address,
                    distToken.address,
                    claimAmount,
                    false
                );

                // Claim ID2 and ID3 separately
                await benture
                    .connect(clientAcc1)
                    .claimMultipleDividends([2, 3]);
                // 300 for ID2
                // 300 for ID3
                expect(await distToken.balanceOf(clientAcc1.address)).to.equal(
                    parseUnits("600", 6)
                );

                // This triggers claim of all dividends (2 and 3 should not be claimed)
                await benture
                    .connect(clientAcc1)
                    .unlockTokens(origToken.address, parseUnits("1", 6));

                // 300 for ID4
                // 300 for ID5
                // 300 for ID6
                // 300 for ID7
                // 1600 * 300 / 2000 = 240 for ID8
                expect(await distToken.balanceOf(clientAcc1.address)).to.equal(
                    parseUnits("2040", 6)
                );

                expect(
                    await benture.hasClaimed(1, clientAcc1.address)
                ).to.equal(false);
                expect(
                    await benture.hasClaimed(2, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(3, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(4, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(5, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(6, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(7, clientAcc1.address)
                ).to.equal(true);
                expect(
                    await benture.hasClaimed(8, clientAcc1.address)
                ).to.equal(true);
            });

            // These are tests for `getParticipatedNotClaimed` function, basically
            describe("Correctly find participated distributions", () => {
                it("Should not include the last (not started) distribution", async () => {
                    let mintAmount = parseUnits("10000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("200", 6);
                    let lockAmount3 = parseUnits("400", 6);
                    let claimAmount = parseUnits("300", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, mintAmount);

                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount1);

                    // 1
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount1);

                    // 2
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount2);

                    // 3 has not started yet

                    await benture
                        .connect(clientAcc1)
                        .unlockTokens(origToken.address, parseUnits("1", 6));

                    // 300 for ID1
                    // 300 for ID2
                    // 0 for ID3
                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(parseUnits("600", 6));

                    expect(
                        await benture.hasClaimed(1, clientAcc1.address)
                    ).to.equal(true);
                    expect(
                        await benture.hasClaimed(2, clientAcc1.address)
                    ).to.equal(true);
                });

                it("Should not include any dividends if user user locked only after them", async () => {
                    let mintAmount = parseUnits("10000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("200", 6);
                    let lockAmount3 = parseUnits("400", 6);
                    let claimAmount = parseUnits("300", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, mintAmount);
                    // 1
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    // 2
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    // 3
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount2);
                    await benture
                        .connect(clientAcc1)
                        .unlockTokens(origToken.address, parseUnits("1", 6));

                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(parseUnits("0", 6));

                    expect(
                        await benture.hasClaimed(1, clientAcc1.address)
                    ).to.equal(false);
                    expect(
                        await benture.hasClaimed(2, clientAcc1.address)
                    ).to.equal(false);
                    expect(
                        await benture.hasClaimed(3, clientAcc1.address)
                    ).to.equal(false);
                });

                it("Should include only one started distribution", async () => {
                    let mintAmount = parseUnits("10000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("200", 6);
                    let lockAmount3 = parseUnits("400", 6);
                    let claimAmount = parseUnits("300", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, mintAmount);

                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount2);

                    // 1
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    await benture
                        .connect(clientAcc1)
                        .unlockTokens(origToken.address, parseUnits("1", 6));

                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(parseUnits("300", 6));

                    expect(
                        await benture.hasClaimed(1, clientAcc1.address)
                    ).to.equal(true);
                });

                it("Should not include any distributions if all were claimed", async () => {
                    let mintAmount = parseUnits("10000000", 6);
                    let lockAmount1 = parseUnits("1000", 6);
                    let lockAmount2 = parseUnits("200", 6);
                    let lockAmount3 = parseUnits("400", 6);
                    let claimAmount = parseUnits("300", 6);

                    await origToken.mint(clientAcc1.address, mintAmount);
                    await origToken
                        .connect(clientAcc1)
                        .approve(benture.address, mintAmount);

                    await benture
                        .connect(clientAcc1)
                        .lockTokens(origToken.address, lockAmount2);

                    // 1
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    // 2
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    // 3
                    await benture.distributeDividends(
                        origToken.address,
                        distToken.address,
                        claimAmount,
                        true
                    );

                    await benture
                        .connect(clientAcc1)
                        .claimMultipleDividends([1, 2, 3]);
                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(parseUnits("900", 6));

                    await benture
                        .connect(clientAcc1)
                        .unlockTokens(origToken.address, parseUnits("1", 6));
                    // Balance should not change
                    expect(
                        await distToken.balanceOf(clientAcc1.address)
                    ).to.equal(parseUnits("900", 6));

                    expect(
                        await benture.hasClaimed(1, clientAcc1.address)
                    ).to.equal(true);
                    expect(
                        await benture.hasClaimed(2, clientAcc1.address)
                    ).to.equal(true);
                    expect(
                        await benture.hasClaimed(3, clientAcc1.address)
                    ).to.equal(true);
                });
            });
        });
    });

    // #FCL
    describe("Fails for claiming dividends", () => {
        it("Should fail co claim not started distribution", async () => {
            let mintAmount = parseUnits("1000000", 6);
            let lockAmount = parseUnits("1000", 6);
            let claimAmount = parseUnits("300", 6);

            await origToken.mint(clientAcc1.address, mintAmount);
            await origToken
                .connect(clientAcc1)
                .approve(benture.address, lockAmount);
            await benture
                .connect(clientAcc1)
                .lockTokens(origToken.address, lockAmount);

            await benture.distributeDividends(
                origToken.address,
                distToken.address,
                claimAmount,
                true
            );

            await expect(
                benture.connect(clientAcc1).claimDividends(777)
            ).to.be.revertedWithCustomError(
                benture,
                "DistributionHasNotStartedYet"
            );
        });

        it("Should fail to claim dividends if user has no locked tokens", async () => {
            let claimAmount = parseUnits("300", 6);

            await benture.distributeDividends(
                origToken.address,
                distToken.address,
                claimAmount,
                true
            );

            await expect(
                benture.connect(clientAcc1).claimDividends(1)
            ).to.be.revertedWithCustomError(
                benture,
                "UserDoesNotHaveLockedTokens"
            );
        });

        it("Should fail to claim the same distribution more than once", async () => {
            let mintAmount = parseUnits("1000000", 6);
            let lockAmount = parseUnits("1000", 6);
            let claimAmount = parseUnits("300", 6);

            await origToken.mint(clientAcc1.address, mintAmount);
            await origToken
                .connect(clientAcc1)
                .approve(benture.address, lockAmount);
            await benture
                .connect(clientAcc1)
                .lockTokens(origToken.address, lockAmount);

            await benture.distributeDividends(
                origToken.address,
                distToken.address,
                claimAmount,
                true
            );

            await benture.connect(clientAcc1).claimDividends(1);
            await expect(
                benture.connect(clientAcc1).claimDividends(1)
            ).to.be.revertedWithCustomError(benture, "AlreadyClaimed");
        });
    });

    // #CU
    describe("Custom Dividends", () => {
        describe("ERC20 tokens dividends", () => {
            it("Should distribute ERC20 tokens custom dividends", async () => {
                let claimAmount1 = parseUnits("500", 6);
                let claimAmount2 = parseUnits("700", 6);

                let startBalance1 = await distToken.balanceOf(
                    clientAcc1.address
                );
                let startBalance2 = await distToken.balanceOf(
                    clientAcc2.address
                );

                await expect(
                    benture.distributeDividendsCustom(
                        distToken.address,
                        [clientAcc1.address, clientAcc2.address],
                        [claimAmount1, claimAmount2],
                        claimAmount1.add(claimAmount2)
                    )
                )
                    .to.emit(benture, "CustomDividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let endBalance1 = await distToken.balanceOf(clientAcc1.address);
                let endBalance2 = await distToken.balanceOf(clientAcc2.address);

                expect(endBalance1.sub(startBalance1)).to.equal(claimAmount1);
                expect(endBalance2.sub(startBalance2)).to.equal(claimAmount2);
            });
        });

        describe("Native tokens dividends", () => {
            it("Should distribute native tokens custom dividends", async () => {
                let claimAmount1 = parseEther("0.5");
                let claimAmount2 = parseEther("0.5");

                let startBalance1 = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let startBalance2 = await ethers.provider.getBalance(
                    clientAcc2.address
                );

                await expect(
                    benture.distributeDividendsCustom(
                        zeroAddress,
                        [clientAcc1.address, clientAcc2.address],
                        [claimAmount1, claimAmount2],
                        claimAmount1.add(claimAmount2),
                        { value: claimAmount1.add(claimAmount2) }
                    )
                )
                    .to.emit(benture, "CustomDividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let endBalance1 = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let endBalance2 = await ethers.provider.getBalance(
                    clientAcc2.address
                );

                expect(endBalance1.sub(startBalance1)).to.equal(claimAmount1);
                expect(endBalance2.sub(startBalance2)).to.equal(claimAmount2);
            });
        });
    });
    // #FCU
    describe("Fails for Custom Dividends", () => {
        it("Should fail to distribute custom dividends if any list is empty", async () => {
            await expect(
                benture.distributeDividendsCustom(
                    distToken.address,
                    [],
                    [1, 2],
                    3
                )
            ).to.be.revertedWithCustomError(benture, "EmptyList");

            await expect(
                benture.distributeDividendsCustom(
                    distToken.address,
                    [clientAcc1.address, clientAcc2.address],
                    [],
                    3
                )
            ).to.be.revertedWithCustomError(benture, "EmptyList");
        });
        it("Should fail to distribute custom dividends if lists have different lengths", async () => {
            await expect(
                benture.distributeDividendsCustom(
                    distToken.address,
                    [clientAcc1.address],
                    [1, 2],
                    3
                )
            ).to.be.revertedWithCustomError(benture, "ListsLengthDiffers");
        });
        it("Should fail to distribute custom dividends if not enough native tokens were provided", async () => {
            let claimAmount1 = parseEther("0.5");
            let claimAmount2 = parseEther("0.5");

            await expect(
                benture.distributeDividendsCustom(
                    zeroAddress,
                    [clientAcc1.address, clientAcc2.address],
                    [claimAmount1, claimAmount2],
                    claimAmount1.add(claimAmount2),
                    { value: claimAmount1.div(5) }
                )
            ).to.be.revertedWithCustomError(benture, "NotEnoughNativeTokens");
        });
        it("Should fail to distribute custom dividends if any user has zero address", async () => {
            let claimAmount1 = parseEther("0.5");
            let claimAmount2 = parseEther("0.5");

            await expect(
                benture.distributeDividendsCustom(
                    zeroAddress,
                    [clientAcc1.address, zeroAddress],
                    [claimAmount1, claimAmount2],
                    claimAmount1.add(claimAmount2),
                    { value: claimAmount1.add(claimAmount2) }
                )
            ).to.be.revertedWithCustomError(benture, "InvalidUserAddress");
        });
        it("Should fail to distribute custom dividends if any amount is zero", async () => {
            let claimAmount1 = parseEther("0.5");
            let claimAmount2 = parseEther("0");

            await expect(
                benture.distributeDividendsCustom(
                    zeroAddress,
                    [clientAcc1.address, clientAcc2.address],
                    [claimAmount1, claimAmount2],
                    claimAmount1.add(claimAmount2),
                    { value: claimAmount1.add(claimAmount2) }
                )
            ).to.be.revertedWithCustomError(benture, "InvalidDividendsAmount");
        });
    });

    // #G
    describe("Getters", () => {});

    // #FG
    describe("Fails for getters", () => {
        it("Should fail to get pool with zero address", async () => {
            await expect(
                benture.getPool(zeroAddress)
            ).to.be.revertedWithCustomError(benture, "InvalidTokenAddress");
        });
        it("Should fail to get lockers of zero address tokens", async () => {
            await expect(
                benture.getLockers(zeroAddress)
            ).to.be.revertedWithCustomError(benture, "InvalidTokenAddress");
        });
        it("Should fail to check is user is a locker", async () => {
            await expect(
                benture.isLocker(zeroAddress, clientAcc1.address)
            ).to.be.revertedWithCustomError(benture, "InvalidTokenAddress");
            await expect(
                benture.isLocker(origToken.address, zeroAddress)
            ).to.be.revertedWithCustomError(benture, "InvalidUserAddress");
        });
        it("Should fail to get current lock of a user", async () => {
            await expect(
                benture.getCurrentLock(zeroAddress, clientAcc1.address)
            ).to.be.revertedWithCustomError(benture, "InvalidTokenAddress");
            await expect(
                benture.getCurrentLock(origToken.address, zeroAddress)
            ).to.be.revertedWithCustomError(benture, "InvalidUserAddress");
        });
        it("Should fail to get a list of distributions started by an admin", async () => {
            await expect(
                benture.getDistributions(zeroAddress)
            ).to.be.revertedWithCustomError(benture, "InvalidAdminAddress");
        });
        it("Should fail to get a distribution", async () => {
            await expect(
                benture.getDistribution(0)
            ).to.be.revertedWithCustomError(benture, "InvalidDistributionId");
            await expect(
                benture.getDistribution(1)
            ).to.be.revertedWithCustomError(benture, "DistributionNotStarted");
        });
        it("Should fail to check if user claimed distribution", async () => {
            await expect(
                benture.hasClaimed(0, clientAcc1.address)
            ).to.be.revertedWithCustomError(benture, "InvalidDistributionId");
            await expect(
                benture.hasClaimed(1, clientAcc1.address)
            ).to.be.revertedWithCustomError(benture, "DistributionNotStarted");

            let claimAmount = parseUnits("1000", 6);

            await benture.distributeDividends(
                origToken.address,
                distToken.address,
                claimAmount,
                true
            );

            await expect(
                benture.hasClaimed(1, zeroAddress)
            ).to.be.revertedWithCustomError(benture, "InvalidUserAddress");
        });
        it("Should fail to check if distribution started by admin", async () => {
            await expect(
                benture.checkStartedByAdmin(0, ownerAcc.address)
            ).to.be.revertedWithCustomError(benture, "InvalidDistributionId");
            await expect(
                benture.checkStartedByAdmin(1, ownerAcc.address)
            ).to.be.revertedWithCustomError(benture, "DistributionNotStarted");

            let claimAmount = parseUnits("1000", 6);

            await benture.distributeDividends(
                origToken.address,
                distToken.address,
                claimAmount,
                true
            );

            await expect(
                benture.checkStartedByAdmin(1, zeroAddress)
            ).to.be.revertedWithCustomError(benture, "InvalidAdminAddress");
        });
        it("Should fail to calculate the share of the user", async () => {
            let mintAmount = parseUnits("1000000", 6);
            let lockAmount = parseUnits("1000", 6);
            let claimAmount = parseUnits("1000", 6);

            await expect(benture.getMyShare(777)).to.be.revertedWithCustomError(
                benture,
                "InvalidDistribution"
            );

            await benture.distributeDividends(
                origToken.address,
                distToken.address,
                claimAmount,
                true
            );

            await expect(
                benture.connect(clientAcc1).getMyShare(1)
            ).to.be.revertedWithCustomError(benture, "CallerIsNotLocker");
        });
    });

    // #S
    describe("Setters", () => {
        it("Should set factory address", async () => {
            await benture.connect(ownerAcc).setFactoryAddress(randomAddress);
            expect(await benture.factory()).to.equal(randomAddress);
        });
    });

    describe("Fails for setters", () => {
        it("Should fail to set factory address if user is now owner", async () => {
            await expect(
                benture.connect(clientAcc1).setFactoryAddress(randomAddress)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
