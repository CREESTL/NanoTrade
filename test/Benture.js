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

        let mockERC20Tx = await ethers.getContractFactory("MockERC20");
        mockERC20 = await mockERC20Tx.deploy();
        await mockERC20.deployed();

        // Deploy a factory contract
        let factoryTx = await ethers.getContractFactory("BentureFactory");
        factory = await factoryTx.deploy();
        await factory.deployed();

        // Deploy an admin token (ERC721)
        let adminTx = await ethers.getContractFactory("BentureAdmin");
        adminToken = await adminTx.deploy(factory.address);
        await adminToken.deployed();
        
        // Deploy dividend-distribution contract
        let bentureTx = await ethers.getContractFactory("Benture");
        benture = await bentureTx.deploy(factory.address);
        await benture.deployed();

        await factory.setBentureAddress(benture.address);

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
        xdescribe("Equal dividends", () => {
            it("Distribute equal and claim" , async () => {
                let pool = await benture.getPool(origToken.address)
                let expectedPool = [origToken.address, 0, 0]
                expect(pool.toString()).to.be.equal(expectedPool.toString())

                await origToken.mint(clientAcc1.address, 1000)
                await origToken.mint(clientAcc2.address, 1000)
                await distToken.mint(benture.address, 1000)
                
                expect(await origToken.balanceOf(clientAcc1.address)).to.be.equal(1000)
                expect(await origToken.balanceOf(clientAcc2.address)).to.be.equal(1000)

                await origToken.connect(clientAcc1).approve(benture.address, 1000)
                await origToken.connect(clientAcc2).approve(benture.address, 1000)

                expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(false)
                expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(false)

                await benture.connect(clientAcc1).lockTokens(origToken.address, 600)
                await benture.connect(clientAcc2).lockTokens(origToken.address, 400)

                pool = await benture.getPool(origToken.address)
                expectedPool = [origToken.address, 2, 1000]
                expect(pool.toString()).to.be.equal(expectedPool.toString())

                expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(true)
                expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(true)

                let lockers = await benture.getLockers(origToken.address)
                let expectedLockers = [clientAcc1.address, clientAcc2.address]

                expect(lockers.toString()).to.be.equal(expectedLockers.toString())

                
                expect(await origToken.balanceOf(clientAcc1.address)).to.be.equal(400)
                expect(await origToken.balanceOf(clientAcc2.address)).to.be.equal(600)

                expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(0)
                expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(0)
                await benture.distributeDividends(origToken.address, distToken.address, 1000, true)

                let result = await benture.getDistribution(1)
                
                let expected = [
                    BigNumber.from("1"),
                    origToken.address,
                    distToken.address,
                    BigNumber.from("1000"),
                    true
                ]

                expect(result.toString()).to.be.equal(expected.toString())

                expect(await benture.checkStartedByAdmin(1, ownerAcc.address)).to.be.equal(true)

                expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(false)
                expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

                await benture.connect(clientAcc1).claimDividends(1)

                expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(true)
                expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

                await benture.connect(clientAcc2).claimDividends(1)

                expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(true)
                expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(true)

                expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(500)
                expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(500)
            })

            it("Distribute equal and claim in different distribution" , async () => {
                await origToken.mint(clientAcc1.address, 1000)
                await origToken.mint(clientAcc2.address, 1000)
                await distToken.mint(benture.address, 10000)

                await origToken.connect(clientAcc1).approve(benture.address, 1000)
                await origToken.connect(clientAcc2).approve(benture.address, 1000)

                await benture.connect(clientAcc1).lockTokens(origToken.address, 600)
                await benture.connect(clientAcc2).lockTokens(origToken.address, 400)

                expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(true)
                expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(true)

                await benture.distributeDividends(origToken.address, distToken.address, 1000, true)

                await benture.connect(clientAcc1).claimDividends(1)

                expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(true)
                expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

                expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(500)
                expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(0)

                await benture.distributeDividends(origToken.address, distToken.address, 1000, true)

                
                await benture.connect(clientAcc2).claimMultipleDividends([1,2])

                expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(500)
                expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(1000)
            })
        });

        xdescribe("Weighted dividends", () => {
            it("Distribute weighted and claim" , async () => {
                let pool = await benture.getPool(origToken.address)
                let expectedPool = [origToken.address, 0, 0]
                expect(pool.toString()).to.be.equal(expectedPool.toString())

                await origToken.mint(clientAcc1.address, 1000)
                await origToken.mint(clientAcc2.address, 1000)
                await distToken.mint(benture.address, 1000)
                
                expect(await origToken.balanceOf(clientAcc1.address)).to.be.equal(1000)
                expect(await origToken.balanceOf(clientAcc2.address)).to.be.equal(1000)

                await origToken.connect(clientAcc1).approve(benture.address, 1000)
                await origToken.connect(clientAcc2).approve(benture.address, 1000)

                expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(false)
                expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(false)

                await benture.connect(clientAcc1).lockTokens(origToken.address, 600)
                await benture.connect(clientAcc2).lockTokens(origToken.address, 400)

                pool = await benture.getPool(origToken.address)
                expectedPool = [origToken.address, 2, 1000]
                expect(pool.toString()).to.be.equal(expectedPool.toString())

                expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(true)
                expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(true)

                let lockers = await benture.getLockers(origToken.address)
                let expectedLockers = [clientAcc1.address, clientAcc2.address]

                expect(lockers.toString()).to.be.equal(expectedLockers.toString())

                
                expect(await origToken.balanceOf(clientAcc1.address)).to.be.equal(400)
                expect(await origToken.balanceOf(clientAcc2.address)).to.be.equal(600)

                expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(0)
                expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(0)
                await benture.distributeDividends(origToken.address, distToken.address, 1000, false)

                let result = await benture.getDistribution(1)
                
                let expected = [
                    BigNumber.from("1"),
                    origToken.address,
                    distToken.address,
                    BigNumber.from("1000"),
                    false
                ]

                expect(result.toString()).to.be.equal(expected.toString())

                expect(await benture.checkStartedByAdmin(1, ownerAcc.address)).to.be.equal(true)

                expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(false)
                expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

                await benture.connect(clientAcc1).claimDividends(1)

                expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(true)
                expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

                await benture.connect(clientAcc2).claimDividends(1)

                expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(true)
                expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(true)

                expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(600)
                expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(400)
            })

            it("Distribute weighted and claim in different distribution" , async () => {
                await origToken.mint(clientAcc1.address, 1000)
                await origToken.mint(clientAcc2.address, 1000)
                await distToken.mint(benture.address, 10000)

                await origToken.connect(clientAcc1).approve(benture.address, 1000)
                await origToken.connect(clientAcc2).approve(benture.address, 1000)

                await benture.connect(clientAcc1).lockTokens(origToken.address, 600)
                await benture.connect(clientAcc2).lockTokens(origToken.address, 400)

                expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(true)
                expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(true)

                await benture.distributeDividends(origToken.address, distToken.address, 1000, false)

                await benture.connect(clientAcc1).claimDividends(1)

                expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(true)
                expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

                expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(600)
                expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(0)

                await benture.distributeDividends(origToken.address, distToken.address, 1000, false)

                
                await benture.connect(clientAcc2).claimMultipleDividends([1,2])

                expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(600)
                expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(800)
            })
        });

        it("Distribute weighted and equal distributions together" , async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.mint(clientAcc2.address, 1000)
            await distToken.mint(benture.address, 10000)

            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await origToken.connect(clientAcc2).approve(benture.address, 1000)

            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)
            await benture.connect(clientAcc2).lockTokens(origToken.address, 400)

            expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(true)
            expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(true)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, false)

            expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(false)
            expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

            expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(0)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(0)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, true)

            await benture.connect(clientAcc1).claimMultipleDividends([1,2])
            await benture.connect(clientAcc2).claimMultipleDividends([1,2])

            expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(1100)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(900)
        })

        it("Claim and unlock tokens" , async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.mint(clientAcc2.address, 1000)
            await distToken.mint(benture.address, 10000)

            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await origToken.connect(clientAcc2).approve(benture.address, 1000)

            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)
            await benture.connect(clientAcc2).lockTokens(origToken.address, 400)

            expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(true)
            expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(true)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, true)

            await benture.connect(clientAcc1).claimDividends(1)

            expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(true)
            expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

            expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(500)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(0)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, true)
            
            await benture.connect(clientAcc2).claimMultipleDividendsAndUnlock([1,2], origToken.address)

            expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(false)

            expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(500)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(10000)
        })

        it("Dist tokens equally with uneven balance" , async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.mint(clientAcc2.address, 1000)
            await origToken.mint(clientAcc3.address, 1000)
            await distToken.mint(benture.address, 1000)

            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await origToken.connect(clientAcc2).approve(benture.address, 1000)
            await origToken.connect(clientAcc3).approve(benture.address, 1000)

            await benture.connect(clientAcc1).lockTokens(origToken.address, 500)
            await benture.connect(clientAcc2).lockTokens(origToken.address, 500)
            await benture.connect(clientAcc3).lockTokens(origToken.address, 500)

            expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(true)
            expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(true)
            expect(await benture.isLocker(origToken.address, clientAcc3.address)).to.be.equal(true)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, false)

            await benture.connect(clientAcc1).claimDividends(1)
            await benture.connect(clientAcc2).claimDividends(1)
            await benture.connect(clientAcc3).claimDividends(1)

            expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(333)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(333)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(333)
            expect(await distToken.balanceOf(benture.address)).to.be.equal(1)
        })

        xit("Change dist ratio when lock more tokens" , async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.mint(clientAcc2.address, 1000)
            await origToken.mint(clientAcc3.address, 1000)
            await distToken.mint(benture.address, 10000)

            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await origToken.connect(clientAcc2).approve(benture.address, 1000)
            await origToken.connect(clientAcc3).approve(benture.address, 1000)

            await benture.connect(clientAcc1).lockTokens(origToken.address, 500)
            await benture.connect(clientAcc2).lockTokens(origToken.address, 500)
            await benture.connect(clientAcc3).lockTokens(origToken.address, 500)

            expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(true)
            expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(true)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, false)

            await benture.connect(clientAcc1).claimDividends(1)
            await benture.connect(clientAcc2).claimDividends(1)
            await benture.connect(clientAcc3).claimDividends(1)

            expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(333)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(333)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(333)
            expect(await distToken.balanceOf(benture.address)).to.be.equal(1)
        })

        it("Not claiming past distributions" , async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.mint(clientAcc2.address, 1000)
            await distToken.mint(benture.address, 10000)

            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await origToken.connect(clientAcc2).approve(benture.address, 1000)

            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)
            await benture.connect(clientAcc2).lockTokens(origToken.address, 400)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, false)

            await benture.connect(clientAcc2).claimDividends(1)

            expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(0)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(400)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, false)

            await benture.connect(clientAcc2).claimDividends(2)
            expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(0)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(800)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, true)

            await benture.connect(clientAcc1).claimDividends(3)
            await benture.connect(clientAcc2).claimDividends(3)
            expect(await distToken.balanceOf(clientAcc1.address)).to.be.equal(500)
            expect(await distToken.balanceOf(clientAcc2.address)).to.be.equal(1300)

            expect(await benture.getCurrentLock(origToken.address, clientAcc1.address)).to.be.equal(600)
            expect(await benture.getCurrentLock(origToken.address, clientAcc2.address)).to.be.equal(400)  
        })
    });

    describe("Native tokens dividends", () => {
        describe("Equal dividends", () => {it("Distribute equal and claim" , async () => {
            let pool = await benture.getPool(origToken.address)
            let expectedPool = [origToken.address, 0, 0]
            expect(pool.toString()).to.be.equal(expectedPool.toString())

            await origToken.mint(clientAcc1.address, 1000)
            await origToken.mint(clientAcc2.address, 1000)
            
            expect(await origToken.balanceOf(clientAcc1.address)).to.be.equal(1000)
            expect(await origToken.balanceOf(clientAcc2.address)).to.be.equal(1000)

            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await origToken.connect(clientAcc2).approve(benture.address, 1000)

            expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(false)
            expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(false)

            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)
            await benture.connect(clientAcc2).lockTokens(origToken.address, 400)

            pool = await benture.getPool(origToken.address)
            expectedPool = [origToken.address, 2, 1000]
            expect(pool.toString()).to.be.equal(expectedPool.toString())

            expect(await benture.isLocker(origToken.address, clientAcc1.address)).to.be.equal(true)
            expect(await benture.isLocker(origToken.address, clientAcc2.address)).to.be.equal(true)

            let lockers = await benture.getLockers(origToken.address)
            let expectedLockers = [clientAcc1.address, clientAcc2.address]

            expect(lockers.toString()).to.be.equal(expectedLockers.toString())

            
            expect(await origToken.balanceOf(clientAcc1.address)).to.be.equal(400)
            expect(await origToken.balanceOf(clientAcc2.address)).to.be.equal(600)

            let acc1BalanceBefore = await ethers.provider.getBalance(clientAcc1.address)
            let acc2BalanceBefore = await ethers.provider.getBalance(clientAcc2.address)

            //expect((await ethers.provider.getBalance(clientAcc1.address)) - acc1BalanceBefore).to.be.equal(0)
            //expect((await ethers.provider.getBalance(clientAcc2.address)) - acc2BalanceBefore).to.be.equal(0)
            await benture.distributeDividends(origToken.address, zeroAddress, "10000000000000000000", true, {value: "10000000000000000000"})

            let result = await benture.getDistribution(1)
            
            let expected = [
                BigNumber.from("1"),
                origToken.address,
                zeroAddress,
                BigNumber.from("10000000000000000000"),
                true
            ]

            expect(result.toString()).to.be.equal(expected.toString())

            expect(await benture.checkStartedByAdmin(1, ownerAcc.address)).to.be.equal(true)

            expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(false)
            expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

            await benture.connect(clientAcc1).claimDividends(1)

            expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(true)
            expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(false)

            await benture.connect(clientAcc2).claimDividends(1)

            expect(await benture.hasClaimed(1, clientAcc1.address)).to.be.equal(true)
            expect(await benture.hasClaimed(1, clientAcc2.address)).to.be.equal(true)

            console.log("Native Tokens ACC1 Balance Before Claim: ", acc1BalanceBefore)
            console.log("Native Tokens ACC1 Balance After Claim: ", await ethers.provider.getBalance(clientAcc1.address))

            console.log("Native Tokens ACC2 Balance Before Claim: ", acc2BalanceBefore)
            console.log("Native Tokens ACC2 Balance After Claim: ", await ethers.provider.getBalance(clientAcc2.address))
        })});

        describe("Weighted dividends", () => {});
    });

    xdescribe("Reverts", () => {
        it("Should revert createPool with Benture: caller is neither admin nor factory!", async () => {
            await expect(benture.connect(clientAcc1).createPool(distToken.address)).to.be.revertedWith("Benture: caller is neither admin nor factory!")
        });

        xit("Should revert createPool with Benture: caller is neither admin nor factory!", async () => {
            await expect(benture.connect(ownerAcc).createPool(zeroAddress)).to.be.revertedWith("Benture: caller is neither admin nor factory!")
        });

        it("Should revert lockTokens with customError InvalidLockAmount", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await expect(benture.connect(clientAcc1).lockTokens(origToken.address, 0)).to.be.revertedWithCustomError(benture, "InvalidLockAmount")
        });

        it("Should revert lockTokens with customError CanNotLockZeroAddressTokens", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await expect(benture.connect(clientAcc1).lockTokens(zeroAddress, 600)).to.be.revertedWithCustomError(benture, "CanNotLockZeroAddressTokens")
        });

        it("Should revert lockTokens with customError PoolDoesNotExist", async () => {
            await mockERC20.mint(clientAcc1.address, 1000)
            await mockERC20.connect(clientAcc1).approve(benture.address, 1000)
            await expect(benture.connect(clientAcc1).lockTokens(mockERC20.address, 600)).to.be.revertedWithCustomError(benture, "PoolDoesNotExist")
        });

        it("Should revert lockTokens with customError UserDoesNotHaveProjectTokens", async () => {
            await expect(benture.connect(clientAcc1).lockTokens(origToken.address, 1000)).to.be.revertedWithCustomError(benture, "UserDoesNotHaveProjectTokens")
        });

        it("Should revert unlockTokens with customError InvalidUnlockAmount", async () => {
            await expect(benture.connect(clientAcc1).unlockTokens(origToken.address, 0)).to.be.revertedWithCustomError(benture, "InvalidUnlockAmount")
        });

        it("Should revert unlockTokens with customError CanNotUnlockZeroAddressTokens", async () => {
            await expect(benture.connect(clientAcc1).unlockTokens(zeroAddress, 200)).to.be.revertedWithCustomError(benture, "CanNotUnlockZeroAddressTokens")
        });

        it("Should revert unlockTokens with customError PoolDoesNotExist", async () => {
            await expect(benture.connect(clientAcc1).unlockTokens(mockERC20.address, 200)).to.be.revertedWithCustomError(benture, "PoolDoesNotExist")
        });

        it("Should revert unlockTokens with customError UserDoesNotHaveAnyLockedTokens", async () => {
            await expect(benture.connect(clientAcc1).unlockTokens(origToken.address, 200)).to.be.revertedWithCustomError(benture, "UserDoesNotHaveAnyLockedTokens")
        });

        it("Should revert unlockTokens with customError WithdrawAmountIsTooBig", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)

            await expect(benture.connect(clientAcc1).unlockTokens(origToken.address, 1000)).to.be.revertedWithCustomError(benture, "WithdrawAmountIsTooBig")
        });

        it("Should revert distributeDividends with customError OriginalTokenCanNotHaveAZeroAddress", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)

            await expect(benture.distributeDividends(zeroAddress, distToken.address, 1000, true)).to.be.revertedWithCustomError(benture, "OriginalTokenCanNotHaveAZeroAddress")
        });

        it("Should revert distributeDividends with customError UserDoesNotHaveAnAdminToken", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)

            await expect(benture.connect(clientAcc1).distributeDividends(origToken.address, distToken.address, 1000, true)).to.be.revertedWithCustomError(benture, "UserDoesNotHaveAnAdminToken")
        });

        it("Should revert distributeDividends with customError DividendsAmountCanNotBeZero", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)

            await expect(benture.distributeDividends(origToken.address, distToken.address, 0, true)).to.be.revertedWithCustomError(benture, "DividendsAmountCanNotBeZero")
        });

        it("Should revert distributeDividends with customError NotEnoughNativeTokensWereProvided", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)

            await expect(benture.distributeDividends(origToken.address, zeroAddress, 1000, true, {value: "1"})).to.be.revertedWithCustomError(benture, "NotEnoughNativeTokensWereProvided")
        });

        it("Should revert claimDividends with customError DistributionHasNotStartedYet", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)

            await expect(benture.connect(clientAcc1).claimDividends(1)).to.be.revertedWithCustomError(benture, "DistributionHasNotStartedYet")
        });

        it("Should revert claimDividends with customError UserHasNoLockedTokens", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, true)

            await expect(benture.connect(clientAcc2).claimDividends(1)).to.be.revertedWithCustomError(benture, "UserHasNoLockedTokens")
        });

        it("Should revert claimDividends with customError AlreadyClaimed", async () => {
            await origToken.mint(clientAcc1.address, 1000)
            await origToken.connect(clientAcc1).approve(benture.address, 1000)
            await benture.connect(clientAcc1).lockTokens(origToken.address, 600)

            await benture.distributeDividends(origToken.address, distToken.address, 1000, true)

            await benture.connect(clientAcc1).claimDividends(1)

            await expect(benture.connect(clientAcc1).claimDividends(1)).to.be.revertedWithCustomError(benture, "AlreadyClaimed")
        });

        it("Should revert getPool with customError PoolsCanNotHoldZeroAddressTokens", async () => {
            await expect(benture.connect(clientAcc1).getPool(zeroAddress)).to.be.revertedWithCustomError(benture, "PoolsCanNotHoldZeroAddressTokens")
        });

        it("Should revert isLocker with customError PoolsCanNotHoldZeroAddressTokens", async () => {
            await expect(benture.connect(clientAcc1).isLocker(zeroAddress, clientAcc1.address)).to.be.revertedWithCustomError(benture, "PoolsCanNotHoldZeroAddressTokens")
        });

        it("Should revert isLocker with customError UserCanNotHaveZeroAddress", async () => {
            await expect(benture.connect(clientAcc1).isLocker(origToken.address, zeroAddress)).to.be.revertedWithCustomError(benture, "UserCanNotHaveZeroAddress")
        });

        it("Should revert getCurrentLock with customError PoolsCanNotHoldZeroAddressTokens", async () => {
            await expect(benture.connect(clientAcc1).getCurrentLock(zeroAddress, clientAcc1.address)).to.be.revertedWithCustomError(benture, "PoolsCanNotHoldZeroAddressTokens")
        });

        it("Should revert getCurrentLock with customError UserCanNotHaveZeroAddress", async () => {
            await expect(benture.connect(clientAcc1).getCurrentLock(origToken.address, zeroAddress)).to.be.revertedWithCustomError(benture, "UserCanNotHaveZeroAddress")
        });

        it("Should revert getDistributions with customError AdminCanNotHaveAZeroAddress", async () => {
            await expect(benture.connect(clientAcc1).getDistributions(zeroAddress)).to.be.revertedWithCustomError(benture, "AdminCanNotHaveAZeroAddress")
        });

        it("Should revert getDistribution with customError IDOfDistributionMustBeGreaterThanOne", async () => {
            await expect(benture.connect(clientAcc1).getDistribution(0)).to.be.revertedWithCustomError(benture, "IDOfDistributionMustBeGreaterThanOne")
        });

        it("Should revert getDistribution with customError DistributionWithTheGivenIDHasNotBeenAnnoucedYet", async () => {
            await expect(benture.connect(clientAcc1).getDistribution(5)).to.be.revertedWithCustomError(benture, "DistributionWithTheGivenIDHasNotBeenAnnoucedYet")
        });

        it("Should revert checkStartedByAdmin with customError IDOfDistributionMustBeGreaterThanOne", async () => {
            await expect(benture.connect(clientAcc1).checkStartedByAdmin(0, ownerAcc.address)).to.be.revertedWithCustomError(benture, "IDOfDistributionMustBeGreaterThanOne")
        });

        it("Should revert checkStartedByAdmin with customError DistributionWithTheGivenIDHasNotBeenAnnoucedYet", async () => {
            await expect(benture.connect(clientAcc1).checkStartedByAdmin(5, ownerAcc.address)).to.be.revertedWithCustomError(benture, "DistributionWithTheGivenIDHasNotBeenAnnoucedYet")
        });

        it("Should revert checkStartedByAdmin with customError DistributionWithTheGivenIDHasNotBeenAnnoucedYet", async () => {
            await expect(benture.connect(clientAcc1).checkStartedByAdmin(5, zeroAddress)).to.be.revertedWithCustomError(benture, "DistributionWithTheGivenIDHasNotBeenAnnoucedYet")
        });
    });
});
