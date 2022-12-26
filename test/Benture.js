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
        });

        describe("Weighted dividends", () => {
        });
     });

    describe("Native tokens dividends", () => {
        describe("Equal dividends", () => {
          });

        describe("Weighted dividends", () => {
         });
    });
});
