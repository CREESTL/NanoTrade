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
    let parseEther = ethers.utils.parseEther;

    // Deploy all contracts before each test suite
    beforeEach(async () => {
        [ownerAcc, clientAcc1, clientAcc2, clientAcc3] = await ethers.getSigners();

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
        benture = await bentureTx.deploy();
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
        await distToken.connect(ownerAcc).approve(benture.address, parseUnits("10000000", 6));
        await origToken.connect(ownerAcc).approve(benture.address, parseUnits("10000000", 6));

        // Deploy another "empty" contract to use its address
        let rummyTx = await ethers.getContractFactory("Rummy");
        rummy = await rummyTx.deploy();
        await rummy.deployed();
    });

    describe("Dividends Announcement", () => {
        describe("Announce", () => {
            it("Should announce distribution with correct parameters", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                // Transfer of ERC20 tokens was already approved in the `beforeEach` hook

                await expect(
                    benture.announceDividends(
                        origToken.address,
                        distToken.address,
                        parseUnits("100", 6),
                        time,
                        true
                    )
                )
                    .to.emit(benture, "DividendsAnnounced")
                    .withArgs(
                        origToken.address,
                        distToken.address,
                        parseUnits("100", 6),
                        time,
                        true
                    );

                await expect(
                    benture.announceDividends(
                        origToken.address,
                        zeroAddress, // Zero address for native tokens
                        parseEther("1"),
                        0, // Use 0 seconds here for an immediate distribution
                        false,
                        {value: parseEther("1")}
                    )
                )
                    .to.emit(benture, "DividendsAnnounced")
                    .withArgs(
                        origToken.address,
                        zeroAddress,
                        parseEther("1"),
                        0,
                        false
                    );

                // Get the announced distributions and check their info
                let dist1 = await benture.getDistribution(1);
                expect(dist1[0]).to.equal(BigNumber.from("1"));
                expect(dist1[1]).to.equal(origToken.address);
                expect(dist1[2]).to.equal(distToken.address);
                expect(dist1[3]).to.equal(parseUnits("100", 6));
                expect(dist1[4]).to.equal(time);
                expect(dist1[5]).to.equal(true);
                expect(dist1[6]).to.equal(0);
                let ids = await benture.getDistributions(ownerAcc.address);
                expect(ids.length).to.equal(2);
                expect(await benture.checkAnnounced(1, ownerAcc.address)).to.equal(
                    true
                );

                let dist2 = await benture.getDistribution(2);
                expect(dist2[0]).to.equal(BigNumber.from("2"));
                expect(dist2[1]).to.equal(origToken.address);
                expect(dist2[2]).to.equal(zeroAddress);
                expect(dist2[3]).to.equal(parseEther("1"));
                expect(dist2[4]).to.equal(0);
                expect(dist2[5]).to.equal(false);
                expect(dist2[6]).to.equal(0);
                ids = await benture.getDistributions(ownerAcc.address);
                expect(ids.length).to.equal(2);
                expect(await benture.checkAnnounced(2, ownerAcc.address)).to.equal(
                    true
                );
            });

            it("Should transfer tokens on announcement", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                // ERC20 tokens
                let startBalance = await distToken.balanceOf(ownerAcc.address);
                await (
                    benture.announceDividends(
                        origToken.address,
                        distToken.address,
                        parseUnits("1", 6),
                        time,
                        true
                    )
                );

                let endBalance = await distToken.balanceOf(ownerAcc.address);

                expect(startBalance.sub(endBalance)).to.equal(parseUnits("1", 6));

            });

            it("Should fail to annouce distribution with incorrect parameters", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                await expect(
                    benture.announceDividends(
                        zeroAddress,
                        distToken.address,
                        parseUnits("100", 6),
                        time,
                        true
                    )
                ).to.be.revertedWith(
                    "Benture: original token can not have a zero address!"
                );

                await expect(
                    benture.announceDividends(
                        origToken.address,
                        distToken.address,
                        parseUnits("0", 6),
                        time,
                        true
                    )
                ).to.be.revertedWith("Benture: dividends amount can not be zero!");
            });

            it("Should fail to announce distribution if caller is not admin", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                await expect(
                    benture
                    .connect(clientAcc1)
                    .announceDividends(
                        origToken.address,
                        distToken.address,
                        parseUnits("100", 6),
                        time,
                        true
                    )
                ).to.be.revertedWith(
                    "BentureAdmin: user does not have an admin token!"
                );
            });

            it("Should fail to announce distribution if not enough tokens were provided", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                await expect(
                    benture
                    .announceDividends(
                        origToken.address,
                        zeroAddress,
                        parseEther("1"),
                        time,
                        true
                    )
                ).to.be.revertedWith(
                    "Benture: not enough native tokens were provided!"
                );
            });

            it("Should fail to announce distribution if admin has not enough ERC20 tokens", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                await distToken.connect(ownerAcc).approve(benture.address, parseUnits("1000000000000000", 6));
                await expect(
                    benture
                    .announceDividends(
                        origToken.address,
                        distToken.address,
                        parseUnits("1000000000000000", 6),
                        time,
                        true
                    )
                ).to.be.revertedWith(
                    "ERC20: transfer amount exceeds balance"
                );
            });

        });

        describe("Cancel", () => {
            it("Should cancel single announced distribution", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                await expect(
                    benture.announceDividends(
                        origToken.address,
                        distToken.address,
                        parseUnits("100", 6),
                        time,
                        true
                    )
                )
                    .to.emit(benture, "DividendsAnnounced")
                    .withArgs(
                        origToken.address,
                        distToken.address,
                        parseUnits("100", 6),
                        time,
                        true
                    );

                await expect(benture.cancelDividends(1))
                    .to.emit(benture, "DividendsCancelled")
                    .withArgs(BigNumber.from("1"));

                // Get the cancelled distribution and check its info
                let cancelledDist = await benture.getDistribution(1);
                expect(cancelledDist[0]).to.equal(BigNumber.from("1"));
                expect(cancelledDist[1]).to.equal(origToken.address);
                expect(cancelledDist[2]).to.equal(distToken.address);
                expect(cancelledDist[3]).to.equal(parseUnits("100", 6));
                expect(cancelledDist[4]).to.equal(time);
                expect(cancelledDist[5]).to.equal(true);
                // 1 for `cancelled`
                expect(cancelledDist[6]).to.equal(1);
                // The distribution should still be in the list of all distributions the admin has announced
                let ids = await benture.getDistributions(ownerAcc.address);
                expect(ids.length).to.equal(1);
                expect(await benture.checkAnnounced(1, ownerAcc.address)).to.equal(
                    true
                );
            });

            it("Should cancel one of announced distributions", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                // Announce 2 distributions (ID = 1, 2) and  cancel ID = 2
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("100", 6),
                    time,
                    true
                );

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("100", 6),
                    time,
                    true
                );

                await expect(benture.cancelDividends(2))
                    .to.emit(benture, "DividendsCancelled")
                    .withArgs(BigNumber.from("2"));

                let cancelledDist = await benture.getDistribution(2);
                expect(cancelledDist[0]).to.equal(BigNumber.from("2"));
                expect(cancelledDist[1]).to.equal(origToken.address);
                expect(cancelledDist[2]).to.equal(distToken.address);
                expect(cancelledDist[3]).to.equal(parseUnits("100", 6));
                expect(cancelledDist[4]).to.equal(time);
                expect(cancelledDist[5]).to.equal(true);
                expect(cancelledDist[6]).to.equal(1);
                let ids = await benture.getDistributions(ownerAcc.address);
                expect(ids.length).to.equal(2);
                expect(await benture.checkAnnounced(2, ownerAcc.address)).to.equal(
                    true
                );

                // Announce another one (ID = 3) and cancel ID = 1
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("100", 6),
                    time,
                    true
                );
                await expect(benture.cancelDividends(1))
                    .to.emit(benture, "DividendsCancelled")
                    .withArgs(BigNumber.from("1"));

                cancelledDist = await benture.getDistribution(1);
                expect(cancelledDist[0]).to.equal(BigNumber.from("1"));
                expect(cancelledDist[1]).to.equal(origToken.address);
                expect(cancelledDist[2]).to.equal(distToken.address);
                expect(cancelledDist[3]).to.equal(parseUnits("100", 6));
                expect(cancelledDist[4]).to.equal(time);
                expect(cancelledDist[5]).to.equal(true);
                expect(cancelledDist[6]).to.equal(1);
                ids = await benture.getDistributions(ownerAcc.address);
                expect(ids.length).to.equal(3);
                expect(await benture.checkAnnounced(1, ownerAcc.address)).to.equal(
                    true
                );

                // Announce another 2 (ID = 4, 5) and cancel ID = 3
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("100", 6),
                    time,
                    true
                );
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("100", 6),
                    time,
                    true
                );

                await expect(benture.cancelDividends(3))
                    .to.emit(benture, "DividendsCancelled")
                    .withArgs(BigNumber.from("3"));

                cancelledDist = await benture.getDistribution(3);
                expect(cancelledDist[0]).to.equal(BigNumber.from("3"));
                expect(cancelledDist[1]).to.equal(origToken.address);
                expect(cancelledDist[2]).to.equal(distToken.address);
                expect(cancelledDist[3]).to.equal(parseUnits("100", 6));
                expect(cancelledDist[4]).to.equal(time);
                expect(cancelledDist[5]).to.equal(true);
                expect(cancelledDist[6]).to.equal(1);
                ids = await benture.getDistributions(ownerAcc.address);
                expect(ids.length).to.equal(5);
                expect(await benture.checkAnnounced(3, ownerAcc.address)).to.equal(
                    true
                );
            });

            it("Should fail to cancel distribution if caller is not admin", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("100", 6),
                    time,
                    true
                );

                await expect(
                    benture.connect(clientAcc1).cancelDividends(1)
                ).to.be.revertedWith(
                    "BentureAdmin: user does not have an admin token!"
                );
            });

            it("Should fail to cancel not announced distribution", async () => {
                await expect(benture.cancelDividends(1)).to.be.revertedWith(
                    "Benture: distribution with the given ID has not been annouced yet!"
                );
            });
        });

        describe("List All Distributions", () => {
            it("Should list all announcements of the admin", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                // Make 2 announcements
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("100", 6),
                    time,
                    true
                );
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("90", 6),
                    time,
                    true
                );

                let ids = await benture.getDistributions(ownerAcc.address);
                expect(ids.length).to.equal(2);
                expect(ids[0]).to.equal(BigNumber.from("1"));
                expect(ids[1]).to.equal(BigNumber.from("2"));
            });

            it("Should fail to list dividends of a zero address admin", async () => {
                await expect(benture.getDistributions(zeroAddress)).to.be.revertedWith(
                    "Benture: admin can not have a zero address!"
                );
            });
        });

        describe("Get One Distribution", () => {
            it("Should get one distribution", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("90", 6),
                    time,
                    true
                );

                let [id, token1, token2, amount, dueDate, isEqual, status] =
                    await benture.getDistribution(1);
                expect(id).to.equal(BigNumber.from("1"));
                expect(token1).to.equal(origToken.address);
                expect(token2).to.equal(distToken.address);
                expect(amount).to.equal(parseUnits("90", 6));
                expect(dueDate).to.equal(time);
                expect(isEqual).to.equal(true);
                // 0 for `pending` status
                expect(status).to.equal(0);
            });

            it("Should fail to get distribution with invalid ID", async () => {
                await expect(benture.getDistribution(0)).to.be.revertedWith(
                    "Benture: ID of distribution must be greater than 1!"
                );
            });

            it("Should fail to get not announced distribution", async () => {
                await expect(benture.getDistribution(777)).to.be.revertedWith(
                    "Benture: distribution with the given ID has not been annouced yet!"
                );
            });
        });

        describe("Check Who Announced the Distribution", () => {
            it("Should check that announcement was made by the admin", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("90", 6),
                    time,
                    true
                );

                expect(await benture.checkAnnounced(1, ownerAcc.address)).to.equal(
                    true
                );
                expect(await benture.checkAnnounced(1, clientAcc1.address)).to.equal(
                    false
                );
            });

            it("Should fail to check distribution with invalid ID", async () => {
                await expect(
                    benture.checkAnnounced(0, ownerAcc.address)
                ).to.be.revertedWith(
                    "Benture: ID of distribution must be greater than 1!"
                );
            });

            it("Should fail to check distribution that was not announced", async () => {
                await expect(
                    benture.checkAnnounced(2, ownerAcc.address)
                ).to.be.revertedWith(
                    "Benture: distribution with the given ID has not been annouced yet!"
                );
            });

            it("Should fail to check distribution of zero address admin", async () => {
                let time = Date.now() + 3600 * 24 * 31;

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    parseUnits("90", 6),
                    time,
                    true
                );
                await expect(benture.checkAnnounced(1, zeroAddress)).to.be.revertedWith(
                    "Benture: admin can not have a zero address!"
                );
            });
        });
    });

    describe("ERC20 dividends", () => {
        describe("Equal dividends", () => {
            it("Should distribute dividends to a single address", async () => {
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10,
                    0,
                    true
                );

                await origToken.mint(clientAcc1.address, 100_000);
                let ownerStartBalance = await distToken.balanceOf(ownerAcc.address);
                let clientStartBalance = await distToken.balanceOf(clientAcc1.address);
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        10
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let ownerEndBalance = await distToken.balanceOf(ownerAcc.address);
                let clientEndBalance = await distToken.balanceOf(clientAcc1.address);

                expect(ownerStartBalance.sub(ownerEndBalance)).to.equal(10);
                expect(clientEndBalance.sub(clientStartBalance)).to.equal(10);
            });

            it("Should distribute dividends to a list of addresses", async () => {
                await origToken.mint(clientAcc1.address, 100_000);
                await origToken.mint(clientAcc2.address, 100_000);
                let startBalance1 = await distToken.balanceOf(clientAcc1.address);
                let startBalance2 = await distToken.balanceOf(clientAcc2.address);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    90,
                    0,
                    true
                );

                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        90
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance1 = await distToken.balanceOf(clientAcc1.address);
                let endBalance2 = await distToken.balanceOf(clientAcc2.address);
                expect(endBalance1.sub(startBalance1)).to.equal(45);
                expect(endBalance2.sub(startBalance2)).to.equal(45);
            });

            it("Should distribute dividends if one holder gets deleted", async () => {
                // Mint some tokens to 2 accounts. Each of them becomes a holder.
                    await origToken.mint(clientAcc1.address, 1000);
                await origToken.mint(clientAcc2.address, 1000);
                // Burn tokens from one account. He is no longer a holder.
                    await origToken.connect(clientAcc1).burn(1000);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    100,
                    0,
                    true
                );

                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        100
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance1 = await distToken.balanceOf(clientAcc1.address);
                let endBalance2 = await distToken.balanceOf(clientAcc2.address);
                expect(endBalance1).to.equal(0);
                expect(endBalance2).to.equal(100);
            });

            it("Should distribute dividends if one holder is benture address", async () => {
                await origToken.mint(benture.address, 1000);
                await origToken.mint(clientAcc1.address, 1000);
                let clientStartBalance = await distToken.balanceOf(clientAcc1.address);
                let bentureStartBalance = await distToken.balanceOf(benture.address);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    666,
                    0,
                    true
                );

                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        666
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let clientEndBalance = await distToken.balanceOf(clientAcc1.address);
                let bentureEndBalance = await distToken.balanceOf(benture.address);
                // 666 tokens get trasferred to the account
                expect(clientEndBalance.sub(clientStartBalance)).to.equal(666);
                // Benture gets no tokens
                expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(0);
            });

            it("Should distribute tokens to the list of addresses including benture address", async () => {
                await origToken.mint(clientAcc1.address, 10_000);
                await origToken.mint(clientAcc2.address, 10_000);
                await origToken.mint(benture.address, 10_000);
                let client1StartBalance = await distToken.balanceOf(clientAcc1.address);
                let client2StartBalance = await distToken.balanceOf(clientAcc2.address);
                let bentureStartBalance = await distToken.balanceOf(benture.address);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10_000,
                    0,
                    true
                );

                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        10_000
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let client1EndBalance = await distToken.balanceOf(clientAcc1.address);
                let client2EndBalance = await distToken.balanceOf(clientAcc2.address);
                let bentureEndBalance = await distToken.balanceOf(benture.address);
                // 10_000 tokens from Benture should be equaly distributed to 2 accounts
                expect(client1EndBalance.sub(client1StartBalance)).to.equal(5_000);
                expect(client2EndBalance.sub(client2StartBalance)).to.equal(5_000);
                expect(bentureEndBalance).to.equal(0);
            });

            it("Should return undistributed tokens back to admin", async () => {
                await origToken.mint(clientAcc1.address, 1);
                await origToken.mint(clientAcc2.address, 1);
                let ownerStartBalance = await distToken.balanceOf(ownerAcc.address);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1001,
                    0,
                    true
                );

                await expect(
                    benture.connect(ownerAcc).distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        // 1001 / 2 = 500
                        // One should be left
                        1001
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let ownerEndBalance = await distToken.balanceOf(ownerAcc.address);
                // 500 * 2 should be distributed and 1 returned
                expect(ownerStartBalance.sub(ownerEndBalance)).to.equal(1000);
            });

            // This test can be done in one place. No need to copy it to all
            // types of distributions
            it("Should fail to distribute dividends with invalid parameters", async () => {
                await origToken.mint(benture.address, 1000);

                // Call too early
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    Date.now() + 3600,
                    true
                );

                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        1000
                    )
                ).to.be.revertedWith("Benture: too early for distribution!");

                // Different origTokens
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    true
                );

                await expect(
                    benture.distributeDividendsEqual(
                        2,
                        distToken.address,
                        distToken.address,
                        1000
                    )
                ).to.be.revertedWith("Benture: origToken is different!");

                // Different distTokens
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    true
                );

                await expect(
                    benture.distributeDividendsEqual(
                        3,
                        origToken.address,
                        origToken.address,
                        1000
                    )
                ).to.be.revertedWith("Benture: distToken is different!");

                // Different amount
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    true
                );

                await expect(
                    benture.distributeDividendsEqual(
                        4,
                        origToken.address,
                        distToken.address,
                        777
                    )
                ).to.be.revertedWith("Benture: amount is different!");

                // Not pending
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    true
                );
                await benture.distributeDividendsEqual(
                    5,
                    origToken.address,
                    distToken.address,
                    1000
                );
                await expect(
                    benture.distributeDividendsEqual(
                        5,
                        origToken.address,
                        distToken.address,
                        1000
                    )
                ).to.be.revertedWith("Benture: distribution is not pending!");

                // Different type of distribution
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    false
                );

                await expect(
                    benture.distributeDividendsEqual(
                        6,
                        origToken.address,
                        distToken.address,
                        1000
                    )
                ).to.be.revertedWith("Benture: another type of distribution!");
            });

            it("Should not distribute dividends if benture address is the only holder", async () => {
                await origToken.mint(benture.address, 1000);
                let bentureStartBalance = await distToken.balanceOf(benture.address);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    true
                );

                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        1000
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let bentureEndBalance = await distToken.balanceOf(benture.address);
                expect(bentureStartBalance).to.equal(bentureStartBalance);
            });

            it("Should fail to distribute too high dividends #1", async () => {
                await origToken.mint(clientAcc1.address, 1);
                // distToken balance of benture is 1_000_000 (preminted in `beforeEach` hook),
                    // but we try to distribute 1_000_001
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1_000_001,
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        1_000_001
                    )
                ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            });

            it("Should fail to distribute too high dividends #2", async () => {
                // Mint origTokens both to account and the Benture contract
                await origToken.mint(clientAcc1.address, 1);
                await origToken.mint(benture.address, 1);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1_000_001,
                    0,
                    true
                );
                // Try to distribute these tokens (more than minted)
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        1_000_001
                    )
                ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            });

            it("Should fail to distribute too high dividends #3", async () => {
                // Mint origTokens to 2 client accounts
                await origToken.mint(clientAcc1.address, 1);
                await origToken.mint(clientAcc2.address, 1);
                await origToken.mint(benture.address, 1);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1_000_001,
                    0,
                    true
                );
                // Try to distribute these tokens (more than minted)
                // 1_000_001 / 2 is 500_000 because of Solidity arithmetic operations
                // but it checks the whole amount without division into parts
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        1_000_001
                    )
                ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            });

            it("Should fail to distribute dividends if the amount is lower than the number of receivers", async () => {
                // Mint origTokens to 3 accounts
                await origToken.mint(clientAcc1.address, 1_000_000);
                await origToken.mint(clientAcc2.address, 1_000_000);
                await origToken.mint(ownerAcc.address, 1_000_000);
                await origToken.mint(benture.address, 1_000_000);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    2,
                    0,
                    true
                );
                // It is impossible to distribute 2 tokens to 3 accounts
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        2
                    )
                ).to.be.revertedWith(
                    "Benture: too many receivers for the provided amount!"
                );

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1,
                    0,
                    true
                );
                // It is impossible to distribute 1 token to 3 accounts
                await expect(
                    benture.distributeDividendsEqual(
                        2,
                        origToken.address,
                        distToken.address,
                        1
                    )
                ).to.be.revertedWith(
                    "Benture: too many receivers for the provided amount!"
                );
            });

            it("Should fail to distribute dividends to invalid token holders", async () => {
                await origToken.mint(ownerAcc.address, 100_000);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    true
                );
            });

            it("Should fail to distribute dividends to no receivers", async () => {
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        1000
                    )
                ).to.be.revertedWith("Benture: no dividends receivers were found!");
            });

            it("Should fail to distribute dividends if original token has zero address", async () => {
                await origToken.mint(ownerAcc.address, 100_000);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        zeroAddress,
                        distToken.address,
                        1000
                    )
                ).to.be.revertedWith(
                    "Benture: original token can not have a zero address!"
                );
            });

            it("Should fail to distribute dividends from a wrong 3rd attempt", async () => {
                await origToken.mint(ownerAcc.address, 10_000);
                await origToken.mint(benture.address, 10_000);
                await benture.announceDividends(
                    origToken.address,
                    origToken.address,
                    10_000,
                    0,
                    true
                );
                // 10_000 go to owner
                await benture.distributeDividendsEqual(
                    1,
                    origToken.address,
                    origToken.address,
                    10_000
                );

                // Mint 10_000 more
                await origToken.mint(ownerAcc.address, 10_000);
                await benture.announceDividends(
                    origToken.address,
                    origToken.address,
                    10_000,
                    0,
                    true
                );
                // owner has 20_000 tokens
                // benture has 10_000 tokens
                // 10_000 goes from owner to owner
                await benture.distributeDividendsEqual(
                    2,
                    origToken.address,
                    origToken.address,
                    10_000
                );
                await benture.announceDividends(
                    origToken.address,
                    origToken.address,
                    1_000_000,
                    0,
                    true
                );
                // owner has 20_000 tokens
                // benture has 10_000 tokens
                // This fails
                await expect(
                    benture.distributeDividendsEqual(
                        3,
                        origToken.address,
                        origToken.address,
                        1_000_000
                    )
                ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            });

            it("Should fail to distribute dividends if caller is not origToken admin", async () => {
                await origToken.mint(ownerAcc.address, 1000);
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    true
                );
                await expect(
                    benture
                    .connect(clientAcc1)
                    .distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        1000
                    )
                ).to.be.revertedWith(
                    "BentureAdmin: user does not have an admin token!"
                );
            });

            it("Should fail to make the same distribution multiple times", async () => {
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10,
                    0,
                    true
                );

                await origToken.mint(clientAcc1.address, 100_000);
                await benture.distributeDividendsEqual(
                    1,
                    origToken.address,
                    distToken.address,
                    10
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        distToken.address,
                        10
                    )
                ).to.be.revertedWith("Benture: distribution is not pending!");
            });
        });

        describe("Weighted dividends", () => {
            it("Should distribute dividends to a single address", async () => {
                // Provide some origTokens to the client
                await origToken.mint(clientAcc1.address, 1000);
                let startBalance = await distToken.balanceOf(clientAcc1.address);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    50,
                    0,
                    false
                );
                // Client will get 50 * 1000 / 1000 = 50 tokens
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        50
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance = await distToken.balanceOf(clientAcc1.address);
                1, expect(endBalance.sub(startBalance)).to.equal(50);
            });

            it("Should distribute dividends to a list of addresses", async () => {
                await origToken.mint(ownerAcc.address, 1000);
                await origToken.mint(clientAcc1.address, 1000);
                await origToken.mint(clientAcc2.address, 1000);
                let startBalance1 = await distToken.balanceOf(ownerAcc.address);
                let startBalance2 = await distToken.balanceOf(clientAcc1.address);
                let startBalance3 = await distToken.balanceOf(clientAcc2.address);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    50,
                    0,
                    false
                );
                // Each will get 1000 * 50 / 3000 = 16
                // For the owner: 1000 - 50(for all) + 16 (for him) + 2(leftovers)
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        50
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance1 = await distToken.balanceOf(ownerAcc.address);
                let endBalance2 = await distToken.balanceOf(clientAcc1.address);
                let endBalance3 = await distToken.balanceOf(clientAcc2.address);
                expect(startBalance1.sub(endBalance1)).to.equal(32);
                expect(endBalance2.sub(startBalance2)).to.equal(16);
                expect(endBalance3.sub(startBalance3)).to.equal(16);
            });

            it("Should distribute dividends if one holder gets deleted", async () => {
                // Mint some tokens to 2 accounts. Each of them becomes a holder.
                    await origToken.mint(clientAcc1.address, 1000);
                await origToken.mint(clientAcc2.address, 1000);
                // Burn tokens from one account. He is no longer a holder.
                    await origToken.connect(clientAcc1).burn(1000);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    50,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        50
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance1 = await distToken.balanceOf(clientAcc1.address);
                let endBalance2 = await distToken.balanceOf(clientAcc2.address);
                expect(endBalance1).to.equal(0);
                expect(endBalance2).to.equal(50);
            });

            it("Should distribute dividends if one holder is benture address", async () => {
                await origToken.mint(benture.address, 1000);
                await origToken.mint(clientAcc1.address, 1000);
                let bentureStartBalance = await distToken.balanceOf(benture.address);
                let clientStartBalance = await distToken.balanceOf(clientAcc1.address);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10,
                    0,
                    false
                );
                // Client will get 1000 * 10 / 1000 (becase benture's 1000 does not count) = 10
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        10
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let bentureEndBalance = await distToken.balanceOf(benture.address);
                let clientEndBalance = await distToken.balanceOf(clientAcc1.address);
                expect(clientEndBalance.sub(clientStartBalance)).to.equal(10);
                expect(bentureStartBalance).to.eq(bentureEndBalance);
            });

            it("Should distribute tokens to the list of addresses including benture address", async () => {
                await origToken.mint(clientAcc1.address, 10_000);
                await origToken.mint(clientAcc2.address, 10_000);
                await origToken.mint(benture.address, 10_000);
                let client1StartBalance = await distToken.balanceOf(clientAcc1.address);
                let client2StartBalance = await distToken.balanceOf(clientAcc2.address);
                let bentureStartBalance = await distToken.balanceOf(benture.address);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    false
                );
                // Each will get 10_000 * 1000 / 20_000(without benture) = 500
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        1000
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let client1EndBalance = await distToken.balanceOf(clientAcc1.address);
                let client2EndBalance = await distToken.balanceOf(clientAcc2.address);
                let bentureEndBalance = await distToken.balanceOf(benture.address);
                // 10_000 / 1000 = 10 tokens per account shoud be distributed
                expect(client1EndBalance.sub(client1StartBalance)).to.equal(500);
                expect(client2EndBalance.sub(client2StartBalance)).to.equal(500);
                expect(bentureStartBalance).to.equal(bentureEndBalance);
            });

            it("Should return undistributed tokens back to admin", async () => {
                await origToken.mint(clientAcc1.address, 1);
                await origToken.mint(clientAcc2.address, 1);
                let ownerStartBalance = await distToken.balanceOf(ownerAcc.address);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1001,
                    0,
                    false
                );
                await expect(
                    benture.connect(ownerAcc).distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        // 1001 / 2 = 500
                        // One should be left
                        1001
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let ownerEndBalance = await distToken.balanceOf(ownerAcc.address);
                // 500 * 2 should be distributed and 1 returned
                expect(ownerStartBalance.sub(ownerEndBalance)).to.equal(1000);
            });

            it("Should not distribute dividends if benture address is the only holder", async () => {
                await origToken.mint(benture.address, 1000);
                let bentureStartBalance = await distToken.balanceOf(benture.address);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        10
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let bentureEndBalance = await distToken.balanceOf(benture.address);
                expect(bentureStartBalance).to.equal(bentureStartBalance);
            });

            it("Should fail to distribute too high dividends to a single address", async () => {
                await origToken.mint(clientAcc1.address, 10);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10_000_000,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        // Owner's balance is only 1_000_000
                        10_000_000
                    )
                ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            });

            it("Should fail to distribute too high dividends a list of addresses", async () => {
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10_000_000,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        // Owner's balance is only 1_000_000
                        10_000_000
                    )
                ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            });

            it("Should fail to distribute dividends to invalid token holders", async () => {
                await origToken.mint(ownerAcc.address, 1000);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10,
                    0,
                    false
                );
            });

            it("Should fail to distribute dividends to no receivers", async () => {
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        10
                    )
                ).to.be.revertedWith("Benture: no dividends receivers were found!");
            });

            it("Should fail to distribute dividends for native tokens holders", async () => {
                await origToken.mint(ownerAcc.address, 1000);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        zeroAddress,
                        distToken.address,
                        10
                    )
                ).to.be.revertedWith(
                    "Benture: original token can not have a zero address!"
                );
            });

            it("Should fail to distribute dividends with too high weight", async () => {
                await origToken.mint(ownerAcc.address, 10);
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);
                let startBalance = await distToken.balanceOf(benture.address);

                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    false
                );
                await benture.distributeDividendsWeighted(
                    1,
                    origToken.address,
                    distToken.address,
                    // None of the receivers has enough tokens for that weight, so no dividends would be
                    // distributed and the balance of Benture will stay the same
                    1000
                );
                let endBalance = await distToken.balanceOf(benture.address);
                expect(endBalance).to.equal(startBalance);
            });

            it("Should fail to distribute dividends if caller is not origToken admin", async () => {
                await origToken.mint(ownerAcc.address, 1000);
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1000,
                    0,
                    false
                );
                await expect(
                    benture
                    .connect(clientAcc1)
                    .distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        1000
                    )
                ).to.be.revertedWith(
                    "BentureAdmin: user does not have an admin token!"
                );
            });

            it("Should fail to distribute too small amount", async () => {
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    1,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        1
                    )
                ).to.be.revertedWith(
                    "Benture: amount should be greater than the number of dividends receivers!"
                );
            });

            it("Should fail to make the same distribution multiple times", async () => {
                await benture.announceDividends(
                    origToken.address,
                    distToken.address,
                    10,
                    0,
                    false
                );

                await origToken.mint(clientAcc1.address, 100_000);
                await benture.distributeDividendsWeighted(
                    1,
                    origToken.address,
                    distToken.address,
                    10
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        distToken.address,
                        10
                    )
                ).to.be.revertedWith("Benture: distribution is not pending!");
            });
        });
    });

    describe("Native tokens dividends", () => {
        describe("Equal dividends", () => {
            it("Should distribute dividends to a single address", async () => {
                // Premint some origTokens to one account
                await origToken.mint(ownerAcc.address, 1000);
                let startBalance = await ethers.provider.getBalance(ownerAcc.address);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("1"),
                    0,
                    true
                );
                expect(
                    await benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("1"),
                        { value: parseEther("1") }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance = await ethers.provider.getBalance(ownerAcc.address);
                // 1 ether - gas
                expect(endBalance.sub(startBalance)).to.be.lt(parseEther("1"));
            });

            it("Should distribute dividends to a list of addresses", async () => {
                await origToken.mint(clientAcc1.address, 1000);
                await origToken.mint(clientAcc2.address, 1000);
                let startBalance1 = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let startBalance2 = await ethers.provider.getBalance(
                    clientAcc2.address
                );

                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("1"),
                    0,
                    true
                );
                expect(
                    await benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("1"),
                        { value: parseEther("1") }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance1 = await ethers.provider.getBalance(clientAcc1.address);
                let endBalance2 = await ethers.provider.getBalance(clientAcc2.address);
                expect(endBalance1.sub(startBalance1)).to.eq(parseEther("0.5"));
                expect(endBalance2.sub(startBalance2)).to.eq(parseEther("0.5"));
            });

            it("Should distribute dividends if one holder gets deleted", async () => {
                // Mint some tokens to 2 accounts. Each of them becomes a holder.
                    await origToken.mint(clientAcc1.address, 1000);
                await origToken.mint(clientAcc2.address, 1000);
                let startBalance1 = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let startBalance2 = await ethers.provider.getBalance(
                    clientAcc2.address
                );
                // Burn tokens from one account. He is no longer a holder.
                    await origToken.connect(clientAcc1).burn(1000);

                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("5"),
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("5"),
                        { value: parseEther("5") }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance1 = await ethers.provider.getBalance(clientAcc1.address);
                let endBalance2 = await ethers.provider.getBalance(clientAcc2.address);
                // Less then 1 ether should be paid for gas for `burn` operation above
                expect(endBalance1.sub(startBalance1)).to.be.lt(parseEther("1"));
                expect(endBalance2.sub(startBalance2)).to.equal(parseEther("5"));
            });

            it("Should distribute dividends if one holder is benture address", async () => {
                await origToken.mint(benture.address, 1000);
                await origToken.mint(clientAcc1.address, 1000);
                let clientStartBalance = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let bentureStartBalance = await ethers.provider.getBalance(
                    benture.address
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("5"),
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("5"),
                        { value: parseEther("5") }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let clientEndBalance = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let bentureEndBalance = await ethers.provider.getBalance(
                    benture.address
                );
                expect(clientEndBalance.sub(clientStartBalance)).to.eq(parseEther("5"));
                // No tokens get transferred to benture
                expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(
                    parseEther("0")
                );
            });

            it("Should distribute tokens to the list of addresses including benture address", async () => {
                await origToken.mint(clientAcc1.address, 10_000);
                await origToken.mint(clientAcc2.address, 10_000);
                await origToken.mint(benture.address, 10_000);
                let client1StartBalance = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let client2StartBalance = await ethers.provider.getBalance(
                    clientAcc2.address
                );
                let bentureStartBalance = await ethers.provider.getBalance(
                    benture.address
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("6"),
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("6"),
                        { value: parseEther("6") }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let client1EndBalance = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let client2EndBalance = await ethers.provider.getBalance(
                    clientAcc2.address
                );
                let bentureEndBalance = await ethers.provider.getBalance(
                    benture.address
                );
                // 6 / 2 = 3 tokens per account shoud be distributed
                expect(client1EndBalance.sub(client1StartBalance)).to.equal(
                    parseEther("3")
                );
                expect(client2EndBalance.sub(client2StartBalance)).to.equal(
                    parseEther("3")
                );
                expect(bentureEndBalance).to.equal(parseEther("0"));
            });

            it("Should return undistributed tokens back to admin", async () => {
                await origToken.mint(clientAcc1.address, 1);
                await origToken.mint(clientAcc2.address, 1);
                await origToken.mint(clientAcc3.address, 1);
                let ownerStartBalance = await ethers.provider.getBalance(
                    ownerAcc.address
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("5"),
                    0,
                    true
                );
                await expect(
                    benture.connect(ownerAcc).distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        // 500000... / 3 = 16666.....
                        parseEther("5"),
                        { value: parseEther("5") }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let ownerEndBalance = await ethers.provider.getBalance(
                    ownerAcc.address
                );
                let forEach = parseEther("5").div(3);
                let forAll = forEach.mul(3);
                let expectedDiff = ownerStartBalance.sub(forAll);
                let expectedDiffWithGas = expectedDiff.mul(BigNumber.from("2"));
                expect(ownerStartBalance.sub(ownerEndBalance)).to.be.lt(
                    expectedDiffWithGas
                );
            });

            it("Should not distribute dividends if benture address is the only holder", async () => {
                await origToken.mint(benture.address, 1000);
                let bentureStartBalance = await ethers.provider.getBalance(
                    benture.address
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("5"),
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("5"),
                        { value: parseEther("5") }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let bentureEndBalance = await ethers.provider.getBalance(
                    benture.address
                );
                // Some native tokens will be spent on gas
                expect(bentureStartBalance.sub(bentureEndBalance)).to.be.lt(
                    parseEther("1")
                );
            });

            it("Should fail to distribute too high dividends #1", async () => {
                await origToken.mint(ownerAcc.address, 1000);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("10"),
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("10"),
                        { value: parseEther("5") }
                    )
                ).to.be.revertedWith(
                    "Benture: not enough native dividend tokens were provided!"
                );
            });

            it("Should fail to distribute too high dividends #2", async () => {
                await origToken.mint(ownerAcc.address, 1_000);
                await origToken.mint(benture.address, 1_000);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("10"),
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("10"),
                        { value: parseEther("5") }
                    )
                ).to.be.revertedWith(
                    "Benture: not enough native dividend tokens were provided!"
                );
            });

            it("Should fail to distribute too high dividends #3", async () => {
                await origToken.mint(clientAcc1.address, 1_000);
                await origToken.mint(clientAcc2.address, 1_000);
                await origToken.mint(benture.address, 1_000);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("10"),
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("10"),
                        { value: parseEther("5") }
                    )
                ).to.be.revertedWith(
                    "Benture: not enough native dividend tokens were provided!"
                );
            });

            it("Should fail to distribute dividends if the amount is lower than the number of receivers", async () => {
                // Mint origTokens to 3 accounts
                await origToken.mint(clientAcc1.address, 1_000_000);
                await origToken.mint(clientAcc2.address, 1_000_000);
                await origToken.mint(ownerAcc.address, 1_000_000);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    1,
                    0,
                    true
                );
                // It is impossible to distribute 1 wei to 3 accounts
                await expect(
                    // Not 1 ETH, but 1 wei
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        1,
                        {
                            value: 1,
                        }
                    )
                ).to.be.revertedWith(
                    "Benture: too many receivers for the provided amount!"
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    1,
                    0,
                    true
                );
                // It is impossible to distribute 1 wei to 3 accounts
                await expect(
                    benture.distributeDividendsEqual(
                        2,
                        origToken.address,
                        zeroAddress,
                        1,
                        {
                            value: 1,
                        }
                    )
                ).to.be.revertedWith(
                    "Benture: too many receivers for the provided amount!"
                );
            });

            it("Should fail to distribute dividends to invalid token holders", async () => {
                await origToken.mint(ownerAcc.address, 1000);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("1"),
                    0,
                    true
                );
            });

            it("Should fail to distribute dividends to no receivers", async () => {
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("1"),
                    0,
                    true
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("1"),
                        { value: parseEther("1") }
                    )
                ).to.be.revertedWith("Benture: no dividends receivers were found!");
            });

            it("Should fail to distribute dividends if caller is not origToken admin", async () => {
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("1"),
                    0,
                    true
                );
                await expect(
                    benture
                    .connect(clientAcc1)
                    .distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        parseEther("1"),
                        { value: parseEther("1") }
                    )
                ).to.be.revertedWith(
                    "BentureAdmin: user does not have an admin token!"
                );
            });

            it("Should fail to make the same distribution multiple times", async () => {
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    10,
                    0,
                    true
                );

                await origToken.mint(clientAcc1.address, 100_000);
                await benture.distributeDividendsEqual(
                    1,
                    origToken.address,
                    zeroAddress,
                    10,
                    { value: 10 }
                );
                await expect(
                    benture.distributeDividendsEqual(
                        1,
                        origToken.address,
                        zeroAddress,
                        10
                    ),
                    { value: 10 }
                ).to.be.revertedWith("Benture: distribution is not pending!");
            });
        });

        describe("Weighted dividends", () => {
            it("Should distribute dividends to a single address", async () => {
                await origToken.mint(clientAcc2.address, 1000);
                let startBalance = await ethers.provider.getBalance(ownerAcc.address);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    200,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        200,
                        { value: 200 }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance = await ethers.provider.getBalance(ownerAcc.address);
                // 5 ether - gas
                expect(endBalance.sub(startBalance)).to.be.lt(200);
            });

            it("Should distribute dividends to a list of addresses", async () => {
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);
                let startBalance2 = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let startBalance3 = await ethers.provider.getBalance(
                    clientAcc2.address
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    10,
                    0,
                    false
                );
                // Each will get 10 * 10 / 20 = 5
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        10,
                        { value: 10 }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance2 = await ethers.provider.getBalance(clientAcc1.address);
                let endBalance3 = await ethers.provider.getBalance(clientAcc2.address);
                expect(endBalance2.sub(startBalance2)).to.equal(5);
                expect(endBalance3.sub(startBalance3)).to.equal(5);
            });

            it("Should distribute dividends if one holder gets deleted", async () => {
                await origToken.mint(clientAcc1.address, 1000);
                await origToken.mint(clientAcc2.address, 1000);
                let startBalance1 = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let startBalance2 = await ethers.provider.getBalance(
                    clientAcc2.address
                );
                // Burn tokens from one account. He is no longer a holder.
                    await origToken.connect(clientAcc1).burn(1000);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    200,
                    0,
                    false
                );
                // Each will get 200 * 1000 / 1000 = 200
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        200,
                        { value: 200 }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let endBalance1 = await ethers.provider.getBalance(clientAcc1.address);
                let endBalance2 = await ethers.provider.getBalance(clientAcc2.address);
                // Less then 1 ether should be paid for gas for `burn` operation above
                expect(endBalance1.sub(startBalance1)).to.be.lt(parseEther("1"));
                expect(endBalance2.sub(startBalance2)).to.equal(200);
            });

            it("Should distribute dividends if one holder is benture address", async () => {
                await origToken.mint(clientAcc1.address, 1000);
                await origToken.mint(benture.address, 1000);
                let clientStartBalance = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let bentureStartBalance = await ethers.provider.getBalance(
                    benture.address
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    500,
                    0,
                    false
                );
                // Each gets 1000 * 500 / 1000 (without benture) = 500
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        500,
                        { value: 500 }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let clientEndBalance = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let bentureEndBalance = await ethers.provider.getBalance(
                    benture.address
                );
                expect(clientEndBalance.sub(clientStartBalance)).to.equal(500);
                expect(bentureStartBalance).to.equal(bentureEndBalance);
            });

            it("Should distribute tokens to the list of addresses including benture address", async () => {
                await origToken.mint(clientAcc1.address, 10_000);
                await origToken.mint(clientAcc2.address, 10_000);
                await origToken.mint(benture.address, 10_000);
                let client1StartBalance = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let client2StartBalance = await ethers.provider.getBalance(
                    clientAcc2.address
                );
                let bentureStartBalance = await ethers.provider.getBalance(
                    benture.address
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    10_000,
                    0,
                    false
                );
                // Each gets 10000 * 10000 / 20000 = 5000
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        10_000,
                        { value: 10_000 }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let client1EndBalance = await ethers.provider.getBalance(
                    clientAcc1.address
                );
                let client2EndBalance = await ethers.provider.getBalance(
                    clientAcc2.address
                );
                let bentureEndBalance = await ethers.provider.getBalance(
                    benture.address
                );
                expect(client1EndBalance.sub(client1StartBalance)).to.equal(5000);
                expect(client2EndBalance.sub(client2StartBalance)).to.equal(5000);
                expect(bentureStartBalance).to.equal(bentureEndBalance);
            });

            it("Should return undistributed tokens back to admin", async () => {
                await origToken.mint(clientAcc1.address, 1);
                await origToken.mint(clientAcc2.address, 1);
                await origToken.mint(clientAcc3.address, 1);
                let ownerStartBalance = await ethers.provider.getBalance(
                    ownerAcc.address
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    parseEther("5"),
                    0,
                    false
                );
                await expect(
                    benture.connect(ownerAcc).distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        // 500000... / 3 = 16666.....
                        parseEther("5"),
                        { value: parseEther("5") }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);

                let ownerEndBalance = await ethers.provider.getBalance(
                    ownerAcc.address
                );
                let forEach = parseEther("5").div(3);
                let forAll = forEach.mul(3);
                let expectedDiff = ownerStartBalance.sub(forAll);
                let expectedDiffWithGas = expectedDiff.mul(BigNumber.from("2"));
                expect(ownerStartBalance.sub(ownerEndBalance)).to.be.lt(
                    expectedDiffWithGas
                );
            });

            it("Should not distribute dividends if benture address is the only holder", async () => {
                await origToken.mint(benture.address, 100);
                let bentureStartBalance = await ethers.provider.getBalance(
                    benture.address
                );
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    50,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        50,
                        { value: 50 }
                    )
                )
                    .to.emit(benture, "DividendsDistributed")
                    .withArgs(anyValue, anyValue);
                let bentureEndBalance = await ethers.provider.getBalance(
                    benture.address
                );
                // Some native tokens will be spent on gas
                expect(bentureStartBalance.sub(bentureEndBalance)).to.be.lt(
                    parseEther("1")
                );
            });

            it("Should fail to distribute dividends to no receivers", async () => {
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    10,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        10,
                        { value: 10 }
                    )
                ).to.be.revertedWith("Benture: no dividends receivers were found!");
            });

            it("Should fail to distribute dividends for native tokens holders", async () => {
                await origToken.mint(ownerAcc.address, 1000);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    10,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(1, zeroAddress, zeroAddress, 10, {
                        value: 10,
                    })
                ).to.be.revertedWith(
                    "Benture: original token can not have a zero address!"
                );
            });

            it("Should fail to distribute dividends if caller is not origToken admin", async () => {
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    10,
                    0,
                    false
                );
                await expect(
                    benture
                    .connect(clientAcc1)
                    .distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        10,
                        {
                            value: 10,
                        }
                    )
                ).to.be.revertedWith(
                    "BentureAdmin: user does not have an admin token!"
                );
            });

            it("Should fail to distribute too high dividends", async () => {
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    10,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        10,
                        {
                            value: 9,
                        }
                    )
                ).to.be.revertedWith(
                    "Benture: not enough native dividend tokens were provided!"
                );
            });

            it("Should fail to distribute too small amount", async () => {
                await origToken.mint(clientAcc1.address, 10);
                await origToken.mint(clientAcc2.address, 10);
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    1,
                    0,
                    false
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        1,
                        {
                            value: 1,
                        }
                    )
                ).to.be.revertedWith(
                    "Benture: amount should be greater than the number of dividends receivers!"
                );
            });

            it("Should fail to make the same distribution multiple times", async () => {
                await benture.announceDividends(
                    origToken.address,
                    zeroAddress,
                    10,
                    0,
                    false
                );

                await origToken.mint(clientAcc1.address, 100_000);
                await benture.distributeDividendsWeighted(
                    1,
                    origToken.address,
                    zeroAddress,
                    10,
                    { value: 10 }
                );
                await expect(
                    benture.distributeDividendsWeighted(
                        1,
                        origToken.address,
                        zeroAddress,
                        10
                    ),
                    { value: 10 }
                ).to.be.revertedWith("Benture: distribution is not pending!");
            });
        });
    });
});
