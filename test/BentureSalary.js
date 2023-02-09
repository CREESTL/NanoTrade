const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Salary", () => {
    let benture;
    let origToken;
    let adminToken;
    let factory;

    const increaseTime = async (time) => {
        await ethers.provider.send("evm_increaseTime", [time]);
        await ethers.provider.send("evm_mine");
    };

    const getTimestump = async () => {
        let blockNumber = await ethers.provider.getBlockNumber();
        let block = await ethers.provider.getBlock(blockNumber);
        return block.timestamp;
    };

    beforeEach(async () => {
        [adminAcc1, adminAcc2, clientAcc1, clientAcc2, clientAcc3] =
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
            1_000_000_000,
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
            1_000_000_000,
            adminToken.address
        );
        // The address of `lastProducedToken` of factory gets changed here
        distTokenAddress = await factory.lastProducedToken();
        distToken = await ethers.getContractAt(
            "BentureProducedToken",
            distTokenAddress
        );

        // Premint 1M distTokens to the owner
        await distToken.mint(adminAcc1.address, 1_000_000);
        // NOTE: Allow benture to spend all tokens from owner's account (and ever more)
        await distToken
            .connect(adminAcc1)
            .approve(benture.address, 100_000_000);
        await origToken
            .connect(adminAcc1)
            .approve(benture.address, 100_000_000);

        // Deploy another "empty" contract to use its address
        let rummyTx = await ethers.getContractFactory("Rummy");
        rummy = await rummyTx.deploy();
        await rummy.deployed();

        let salaryTx = await ethers.getContractFactory("BentureSalary");
        salary = await salaryTx.deploy(adminToken.address);
        await salary.deployed();

        let mockERC20Tx = await ethers.getContractFactory("MockERC20");
        mockERC20 = await mockERC20Tx.deploy();
        await mockERC20.deployed();

        await adminToken.approve(adminAcc2.address, "1");
        await adminToken.transferFrom(
            adminAcc1.address,
            adminAcc2.address,
            "1"
        );
    });

    describe("Salary tests", () => {
        it("Should add new Employee", async () => {
            await salary.addEmployee(clientAcc1.address);
            expect(
                await salary.checkIfUserIsEmployeeOfAdmin(
                    adminAcc1.address,
                    clientAcc1.address
                )
            ).to.be.true;
            expect(
                await salary.checkIfUserIsAdminOfEmployee(
                    clientAcc1.address,
                    adminAcc1.address
                )
            ).to.be.true;
        });

        it("Should remove Employee", async () => {
            await salary.addEmployee(clientAcc1.address);
            expect(
                await salary.checkIfUserIsEmployeeOfAdmin(
                    adminAcc1.address,
                    clientAcc1.address
                )
            ).to.be.true;
            expect(
                await salary.checkIfUserIsAdminOfEmployee(
                    clientAcc1.address,
                    adminAcc1.address
                )
            ).to.be.true;
            await salary.removeEmployee(clientAcc1.address);
            expect(
                await salary.checkIfUserIsEmployeeOfAdmin(
                    adminAcc1.address,
                    clientAcc1.address
                )
            ).to.be.false;
            expect(
                await salary.checkIfUserIsAdminOfEmployee(
                    clientAcc1.address,
                    adminAcc1.address
                )
            ).to.be.false;
        });

        it("Should add new name to Employee", async () => {
            await salary.addEmployee(clientAcc1.address);
            await salary.setNameToEmployee(clientAcc1.address, "Alice");
            expect(
                await salary.getNameOfEmployee(clientAcc1.address)
            ).to.be.equal("Alice");
        });

        it("Should change name of Employee", async () => {
            await salary.addEmployee(clientAcc1.address);
            await salary.setNameToEmployee(clientAcc1.address, "Alice");
            expect(
                await salary.getNameOfEmployee(clientAcc1.address)
            ).to.be.equal("Alice");
            await salary.setNameToEmployee(clientAcc1.address, "Bob");
            expect(
                await salary.getNameOfEmployee(clientAcc1.address)
            ).to.be.equal("Bob");
        });

        it("Should remove name from Employee", async () => {
            await salary.addEmployee(clientAcc1.address);
            await salary.setNameToEmployee(clientAcc1.address, "Alice");
            expect(
                await salary.getNameOfEmployee(clientAcc1.address)
            ).to.be.equal("Alice");
            await salary.removeNameFromEmployee(clientAcc1.address);
            expect(
                await salary.getNameOfEmployee(clientAcc1.address)
            ).to.be.equal("");
        });

        it("Should add new salary to Employee", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);

            await salary.addEmployee(clientAcc1.address);

            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let admins = await salary.getAdminsByEmployee(clientAcc1.address);
            let id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }
            expect(id.length).to.be.equal(1);

            salaryInfo = await salary.getSalaryById("1");
            expect(salaryInfo.id).to.be.equal("1");
            expect(salaryInfo.periodDuration).to.be.equal(periodDuration);
            expect(salaryInfo.amountOfPeriods).to.be.equal(amountOfPeriods);
            expect(salaryInfo.tokenAddress).to.be.equal(tokenAddress);

            expect(salaryInfo.tokensAmountPerPeriod.toString()).to.be.equal(
                tokensAmountPerPeriod.toString()
            );

            expect(salaryInfo.employer).to.be.equal(adminAcc1.address);
            expect(salaryInfo.employee).to.be.equal(clientAcc1.address);
        });

        it("Should remove salary from Employee", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);

            await salary.addEmployee(clientAcc1.address);

            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
            ];

            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let admins = await salary.getAdminsByEmployee(clientAcc1.address);
            let id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }
            let salaryInfo = await salary.getSalaryById(id[0].toString());
            expect(salaryInfo.id).to.be.equal("1");
            expect(salaryInfo.periodDuration).to.be.equal(periodDuration);
            expect(salaryInfo.amountOfPeriods).to.be.equal(amountOfPeriods);
            expect(salaryInfo.tokenAddress).to.be.equal(tokenAddress);

            expect(salaryInfo.tokensAmountPerPeriod.toString()).to.be.equal(
                tokensAmountPerPeriod.toString()
            );

            expect(salaryInfo.employer).to.be.equal(adminAcc1.address);
            expect(salaryInfo.employee).to.be.equal(clientAcc1.address);

            await salary.removeSalaryFromEmployee("1");

            admins = await salary.getAdminsByEmployee(clientAcc1.address);
            id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }
            expect(id.toString()).to.be.equal("");

            salaryInfo = await salary.getSalaryById("1");
            expect(salaryInfo.toString()).to.be.equal(
                "0,0,0,0,0x0000000000000000000000000000000000000000,,0,0,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000"
            );
        });

        it("Should get salary amount", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(600 * 10);

            let amount = await salary.getSalaryAmount("1");
            expect((await salary.getSalaryAmount("1")).toString()).to.be.equal(
                "550"
            );
        });

        it("Should get salary amount", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(270);

            let amount = await salary.getSalaryAmount("1");
            expect((await salary.getSalaryAmount("1")).toString()).to.be.equal(
                "125"
            );
        });

        it("Should get salary amount", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(60);

            let amount = await salary.getSalaryAmount("1");
            expect((await salary.getSalaryAmount("1")).toString()).to.be.equal(
                "10"
            );
        });

        it("Should get salary amount", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(600 * 10);

            await salary.connect(clientAcc1).withdrawSalary(1);

            let amount = await salary.getSalaryAmount("1");
            expect((await salary.getSalaryAmount("1")).toString()).to.be.equal(
                "0"
            );
        });

        it("Should let withdraw salary to Employee", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let timeBeforeWithdrawal = await getTimestump();

            //Already spent 1 sec
            await increaseTime(59);
            await salary.connect(clientAcc1).withdrawSalary(1);

            let timeAfterWithdrawal = await getTimestump();
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                timeAfterWithdrawal - timeBeforeWithdrawal
            );

            let salaryInfo = await salary.getSalaryById("1");

            expect(salaryInfo.amountOfWithdrawals).to.be.equal(1);

            let expectedBalance =
                (tokensAmountPerPeriod[0] *
                    (timeAfterWithdrawal - timeBeforeWithdrawal)) /
                periodDuration;
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                expectedBalance
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(
                initOwnerBalance - expectedBalance
            );
        });

        it("Should let withdraw all salaries to Employee", async () => {
            let initOwnerBalance = 2400;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);

            await mockERC20
                .connect(adminAcc1)
                .mint(adminAcc2.address, initOwnerBalance);
            await mockERC20
                .connect(adminAcc2)
                .approve(salary.address, initOwnerBalance);

            await salary.addEmployee(clientAcc1.address);
            await salary.connect(adminAcc2).addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await salary
                .connect(adminAcc2)
                .addSalaryToEmployee(
                    clientAcc1.address,
                    periodDuration,
                    amountOfPeriods,
                    tokenAddress,
                    tokensAmountPerPeriod
                );

            //Already spent 1 sec
            await increaseTime(300);
            await salary.connect(clientAcc1).withdrawAllSalaries();
        });

        it("Should let withdraw salary to Employee through Employee removal", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let timeBeforeWithdrawal = await getTimestump();

            //Already spent 1 sec
            await increaseTime(59);

            await salary.removeEmployee(clientAcc1.address);

            let timeAfterWithdrawal = await getTimestump();
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                timeAfterWithdrawal - timeBeforeWithdrawal
            );

            let expectedBalance =
                (tokensAmountPerPeriod[0] *
                    (timeAfterWithdrawal - timeBeforeWithdrawal)) /
                periodDuration;
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                expectedBalance
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(
                initOwnerBalance - expectedBalance
            );
        });

        it("Should delete both salaries through Employee removal", async () => {
            await mockERC20.mint(adminAcc1.address, 800);
            await mockERC20.approve(salary.address, 800);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let admins = await salary.getAdminsByEmployee(clientAcc1.address);
            let id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }

            periodDuration = 100;
            amountOfPeriods = 20;
            tokenAddress = mockERC20.address;
            totalTokenAmount = 200;
            tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
                10, 10, 10, 10,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await increaseTime(59);
            await salary.removeEmployee(clientAcc1.address);

            let isAdmin = await salary.checkIfUserIsEmployeeOfAdmin(
                clientAcc1.address,
                adminAcc1.address
            );

            let salaryInfo = await salary.getSalaryById("1");

            salaryInfo = await salary.getSalaryById("2");
        });

        it("Should not let withdraw any salary to Employee through removeSalaryFromEmployee when all tokens already withdrawed", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(600 * 10);

            await salary.connect(clientAcc1).withdrawSalary("1");
            await salary.connect(adminAcc1).removeSalaryFromEmployee("1");

            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                totalTokenAmount
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(
                initOwnerBalance - totalTokenAmount
            );
        });

        it("Should let not withdraw any additional tokens through removal right after withdraw", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let timeBeforeWithdrawal = await getTimestump();

            //Already spent 1 sec
            await increaseTime(59);
            await salary.connect(clientAcc1).withdrawSalary("1");
            await salary.removeEmployee(clientAcc1.address);

            let timeAfterWithdrawal = await getTimestump();
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                timeAfterWithdrawal - timeBeforeWithdrawal
            );

            let expectedBalance =
                (tokensAmountPerPeriod[0] *
                    (timeAfterWithdrawal - timeBeforeWithdrawal)) /
                periodDuration;
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                expectedBalance
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(
                initOwnerBalance - expectedBalance
            );
        });

        it("Should withdraw through removeEmployee only for setted periods", async () => {
            let initOwnerBalance = 600;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(periodDuration * amountOfPeriods * 100);

            await salary.removeEmployee(clientAcc1.address);

            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                totalTokenAmount
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(0);
        });

        it("Should withdraw through withdrawSalary only for setted periods", async () => {
            let initOwnerBalance = 600;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(periodDuration * amountOfPeriods * 100);

            await salary.connect(clientAcc1).withdrawSalary(1);

            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                totalTokenAmount
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(0);
        });

        it("Should add more than 1 salary to Employee from 1 admin", async () => {
            await mockERC20.mint(adminAcc1.address, 800);
            await mockERC20.approve(salary.address, 800);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let admins = await salary.getAdminsByEmployee(clientAcc1.address);
            let id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }

            let salaryInfo = await salary.getSalaryById(id[0].toString());
            expect(salaryInfo.id).to.be.equal("1");
            expect(salaryInfo.periodDuration).to.be.equal(periodDuration);
            expect(salaryInfo.amountOfPeriods).to.be.equal(amountOfPeriods);
            expect(salaryInfo.tokenAddress).to.be.equal(tokenAddress);

            expect(salaryInfo.tokensAmountPerPeriod.toString()).to.be.equal(
                tokensAmountPerPeriod.toString()
            );
            expect(salaryInfo.employer).to.be.equal(adminAcc1.address);
            expect(salaryInfo.employee).to.be.equal(clientAcc1.address);

            periodDuration = 100;
            amountOfPeriods = 20;
            tokenAddress = mockERC20.address;
            totalTokenAmount = 200;
            tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
                10, 10, 10, 10,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            salaryInfo = await salary.getSalaryById(2);
            expect(salaryInfo.id).to.be.equal("2");
            expect(salaryInfo.periodDuration).to.be.equal(periodDuration);
            expect(salaryInfo.amountOfPeriods).to.be.equal(amountOfPeriods);
            expect(salaryInfo.tokenAddress).to.be.equal(tokenAddress);

            expect(salaryInfo.tokensAmountPerPeriod.toString()).to.be.equal(
                tokensAmountPerPeriod.toString()
            );
            expect(salaryInfo.employer).to.be.equal(adminAcc1.address);
            expect(salaryInfo.employee).to.be.equal(clientAcc1.address);
        });

        it("Should add more than 1 salary to Employee from 1 admin and delete only one of them", async () => {
            await mockERC20.mint(adminAcc1.address, 800);
            await mockERC20.approve(salary.address, 800);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            periodDuration = 100;
            amountOfPeriods = 20;
            tokenAddress = mockERC20.address;
            totalTokenAmount = 200;
            tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
                10, 10, 10, 10,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await salary.removeSalaryFromEmployee("1");
            let admins = await salary.getAdminsByEmployee(clientAcc1.address);
            let id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }

            expect(id.length).to.be.equal(1);

            salaryInfo = await salary.getSalaryById("1");
            expect(salaryInfo.toString()).to.be.equal(
                "0,0,0,0,0x0000000000000000000000000000000000000000,,0,0,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000"
            );

            salaryInfo = await salary.getSalaryById("2");

            expect(salaryInfo.id).to.be.equal("2");
            expect(salaryInfo.periodDuration).to.be.equal(periodDuration);
            expect(salaryInfo.amountOfPeriods).to.be.equal(amountOfPeriods);
            expect(salaryInfo.tokenAddress).to.be.equal(tokenAddress);

            expect(salaryInfo.tokensAmountPerPeriod.toString()).to.be.equal(
                tokensAmountPerPeriod.toString()
            );
            expect(salaryInfo.employer).to.be.equal(adminAcc1.address);
            expect(salaryInfo.employee).to.be.equal(clientAcc1.address);
        });

        it("Should add more than 1 salary to Employee from 2 admins", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let admins = await salary.getAdminsByEmployee(clientAcc1.address);
            let id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }
            let salaryInfo = await salary.getSalaryById(id[0].toString());
            expect(salaryInfo.employer).to.be.equal(adminAcc1.address);

            await mockERC20.mint(adminAcc2.address, 200);
            await mockERC20.connect(adminAcc2).approve(salary.address, 200);
            await salary.connect(adminAcc2).addEmployee(clientAcc1.address);
            periodDuration = 100;
            amountOfPeriods = 20;
            tokenAddress = mockERC20.address;
            totalTokenAmount = 200;
            tokensAmountPerPeriod = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
                10, 10, 10, 10,
            ];
            await salary
                .connect(adminAcc2)
                .addSalaryToEmployee(
                    clientAcc1.address,
                    periodDuration,
                    amountOfPeriods,
                    tokenAddress,
                    tokensAmountPerPeriod
                );

            admins = await salary.getAdminsByEmployee(clientAcc1.address);
            id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }
            salaryInfo = await salary.getSalaryById(id[1].toString());
            expect(salaryInfo.employer).to.be.equal(adminAcc2.address);

            expect(
                (await salary.getAdminsByEmployee(clientAcc1.address)).length
            ).to.be.equal(2);
            expect(
                (await salary.getEmployeesByAdmin(adminAcc1.address)).length
            ).to.be.equal(1);
            expect(
                (await salary.getEmployeesByAdmin(adminAcc2.address)).length
            ).to.be.equal(1);

            expect(id.length).to.be.equal(2);
        });

        it("Should withdraw more than 1 salary", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await mockERC20.mint(adminAcc2.address, 1000);
            await mockERC20.connect(adminAcc2).approve(salary.address, 1000);
            await salary.connect(adminAcc2).addEmployee(clientAcc1.address);
            periodDuration = 60;
            amountOfPeriods = 10;
            tokenAddress = mockERC20.address;
            totalTokenAmount = 1000;
            tokensAmountPerPeriod = [
                100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
            ];
            await salary
                .connect(adminAcc2)
                .addSalaryToEmployee(
                    clientAcc1.address,
                    periodDuration,
                    amountOfPeriods,
                    tokenAddress,
                    tokensAmountPerPeriod
                );

            await increaseTime(59);
            await salary.connect(clientAcc1).withdrawSalary(1);
            await salary.connect(clientAcc1).withdrawSalary(2);

            await increaseTime(40);
            await salary.connect(clientAcc1).withdrawSalary(1);
            await salary.connect(clientAcc1).withdrawSalary(2);
        });

        it("Should withdraw salary for more than 1 period", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await increaseTime(119);
            await salary.connect(clientAcc1).withdrawSalary(1);
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                tokensAmountPerPeriod[0] * 2
            );
        });

        it("Should not let to withdraw more salary than total amount", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await increaseTime(amountOfPeriods * periodDuration * 10);
            await salary.connect(clientAcc1).withdrawSalary(1);
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                totalTokenAmount
            );
        });

        it("Should let add new salary with various tokensAmountPerPeriod", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);

            await salary.addEmployee(clientAcc1.address);

            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let admins = await salary.getAdminsByEmployee(clientAcc1.address);
            let id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }
            expect(id.length).to.be.equal(1);

            salaryInfo = await salary.getSalaryById("1");
            expect(salaryInfo.id).to.be.equal("1");
            expect(salaryInfo.periodDuration).to.be.equal(periodDuration);
            expect(salaryInfo.amountOfPeriods).to.be.equal(amountOfPeriods);
            expect(salaryInfo.tokenAddress).to.be.equal(tokenAddress);

            expect(salaryInfo.tokensAmountPerPeriod.toString()).to.be.equal(
                tokensAmountPerPeriod.toString()
            );

            expect(salaryInfo.employer).to.be.equal(adminAcc1.address);
            expect(salaryInfo.employee).to.be.equal(clientAcc1.address);
        });

        it("Should remove salary from Employee with various tokensAmountPerPeriod", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);

            await salary.addEmployee(clientAcc1.address);

            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];

            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let admins = await salary.getAdminsByEmployee(clientAcc1.address);
            let id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }
            let salaryInfo = await salary.getSalaryById(id[0].toString());
            expect(salaryInfo.id).to.be.equal("1");
            expect(salaryInfo.periodDuration).to.be.equal(periodDuration);
            expect(salaryInfo.amountOfPeriods).to.be.equal(amountOfPeriods);
            expect(salaryInfo.tokenAddress).to.be.equal(tokenAddress);

            expect(salaryInfo.tokensAmountPerPeriod.toString()).to.be.equal(
                tokensAmountPerPeriod.toString()
            );

            expect(salaryInfo.employer).to.be.equal(adminAcc1.address);
            expect(salaryInfo.employee).to.be.equal(clientAcc1.address);

            await salary.removeSalaryFromEmployee("1");

            admins = await salary.getAdminsByEmployee(clientAcc1.address);
            id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }
            expect(id.toString()).to.be.equal("");

            salaryInfo = await salary.getSalaryById("1");
            expect(salaryInfo.toString()).to.be.equal(
                "0,0,0,0,0x0000000000000000000000000000000000000000,,0,0,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000"
            );
        });

        it("Should let withdraw salary to Employee with various tokensAmountPerPeriod", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let timeBeforeWithdrawal = await getTimestump();

            //Already spent 1 sec
            await increaseTime(59);
            await salary.connect(clientAcc1).withdrawSalary(1);

            let timeAfterWithdrawal = await getTimestump();
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                tokensAmountPerPeriod[0]
            );

            let salaryInfo = await salary.getSalaryById("1");

            expect(salaryInfo.amountOfWithdrawals).to.be.equal(1);

            let expectedBalance =
                (tokensAmountPerPeriod[0] *
                    (timeAfterWithdrawal - timeBeforeWithdrawal)) /
                periodDuration;
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                expectedBalance
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(
                initOwnerBalance - expectedBalance
            );
        });

        it("Should let withdraw salary to Employee through Employee removal with various tokensAmountPerPeriod", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let timeBeforeWithdrawal = await getTimestump();

            //Already spent 1 sec
            await increaseTime(59);
            await salary.removeEmployee(clientAcc1.address);

            let timeAfterWithdrawal = await getTimestump();
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                tokensAmountPerPeriod[0]
            );

            let expectedBalance =
                (tokensAmountPerPeriod[0] *
                    (timeAfterWithdrawal - timeBeforeWithdrawal)) /
                periodDuration;
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                expectedBalance
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(
                initOwnerBalance - expectedBalance
            );
        });

        it("Should not let withdraw any salary to Employee through removeSalaryFromEmployee when all tokens already withdrawed with various tokensAmountPerPeriod", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(600 * 10);

            await salary.connect(clientAcc1).withdrawSalary("1");
            await salary.connect(adminAcc1).removeSalaryFromEmployee("1");

            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                totalTokenAmount
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(
                initOwnerBalance - totalTokenAmount
            );
        });

        it("Should let not withdraw any additional tokens through removal right after withdraw with various tokensAmountPerPeriod", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(119);
            await salary.connect(clientAcc1).withdrawSalary("1");
            await salary.removeEmployee(clientAcc1.address);

            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                30
            );

            let expectedBalance =
                tokensAmountPerPeriod[0] + tokensAmountPerPeriod[1];
            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                expectedBalance
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(
                initOwnerBalance - expectedBalance
            );
        });

        it("Should let withdraw salary to Employee with various tokensAmountPerPeriod for not whole periods", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(270);
            await salary.removeEmployee(clientAcc1.address);

            expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(
                125
            );
            expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(
                initOwnerBalance - 125
            );
        });

        it("Should withdraw more than 1 salary with various tokensAmountPerPeriod for not whole periods", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await mockERC20.mint(adminAcc2.address, 2100);
            await mockERC20.connect(adminAcc2).approve(salary.address, 2100);
            await salary.connect(adminAcc2).addEmployee(clientAcc1.address);
            periodDuration = 30;
            amountOfPeriods = 10;
            tokenAddress = mockERC20.address;
            totalTokenAmount = 2100;
            tokensAmountPerPeriod = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            await salary
                .connect(adminAcc2)
                .addSalaryToEmployee(
                    clientAcc1.address,
                    periodDuration,
                    amountOfPeriods,
                    tokenAddress,
                    tokensAmountPerPeriod
                );

            await increaseTime(270);
            await salary.connect(clientAcc1).withdrawSalary(1);
            await salary.connect(clientAcc1).withdrawSalary(2);

            await increaseTime(30);
            await salary.connect(clientAcc1).withdrawSalary(1);
            await salary.connect(clientAcc1).withdrawSalary(2);
        });

        it("Should let add new salary periods", async () => {
            let initOwnerBalance = 910;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(270);
            let salaryInfo = await salary.getSalaryById(1);

            await salary.addPeriodsToSalary(1, [110, 120, 130]);

            salaryInfo = await salary.getSalaryById(1);
        });

        it("Should let withdraw before and after salary addition", async () => {
            let initOwnerBalance = 910;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(270);
            let salaryInfo = await salary.getSalaryById(1);

            await salary.connect(clientAcc1).withdrawSalary(1);

            salaryInfo = await salary.getSalaryById(1);

            await salary.addPeriodsToSalary(1, [110, 120, 130]);

            await increaseTime(30);
            await salary.connect(clientAcc1).withdrawSalary(1);

            salaryInfo = await salary.getSalaryById(1);
        });

        it("Should remove salary periods with salary remove", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //9,5 periods passed
            await increaseTime(568);
            let salaryInfo = await salary.getSalaryById(1);

            await salary.connect(clientAcc1).withdrawSalary(1);

            salaryInfo = await salary.getSalaryById(1);

            await salary.removePeriodsFromSalary(1, 2);

            salaryInfo = await salary.getSalaryById(1);
        });

        it("Should remove salary periods and calculate salary correctly", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //9,5 periods passed
            await increaseTime(240);
            let salaryInfo = await salary.getSalaryById(1);

            await salary.connect(clientAcc1).withdrawSalary(1);

            salaryInfo = await salary.getSalaryById(1);

            await salary.removePeriodsFromSalary(1, 2);

            await increaseTime(6000);
            await salary.connect(clientAcc1).withdrawSalary(1);

            salaryInfo = await salary.getSalaryById(1);
        });
    });

    describe("Salary reverts", () => {
        it("Should revert addPeriodsToSalary with NotEnoughTokensAllowed", async () => {
            let initOwnerBalance = 909;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(270);
            await salary.connect(clientAcc1).withdrawSalary(1);
            await expect(
                salary.addPeriodsToSalary(1, [110, 120, 130])
            ).to.be.revertedWithCustomError(salary, "NotEnoughTokensAllowed");
            await increaseTime(30);
        });

        it("Should revert addPeriodsToSalary with NotAdminForEmployee", async () => {
            let initOwnerBalance = 910;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(270);
            await salary.connect(clientAcc1).withdrawSalary(1);
            await expect(
                salary.connect(adminAcc2).addPeriodsToSalary(1, [110, 120, 130])
            ).to.be.revertedWithCustomError(salary, "NotAdminForEmployee");
            await increaseTime(30);
        });

        it("Should revert removePeriodsFromSalary with NotAdminForEmployee", async () => {
            let initOwnerBalance = 910;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 550;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(270);
            await salary.connect(clientAcc1).withdrawSalary(1);
            await expect(
                salary.connect(adminAcc2).removePeriodsFromSalary(1, 1)
            ).to.be.revertedWithCustomError(salary, "NotAdminForEmployee");
            await increaseTime(30);
        });

        it("Should revert setNameToEmployee with UserDoesNotHaveAnAdminToken", async () => {
            await salary.addEmployee(clientAcc1.address);
            await expect(
                salary
                    .connect(clientAcc1)
                    .setNameToEmployee(clientAcc1.address, "Alice")
            ).to.be.revertedWithCustomError(
                adminToken,
                "UserDoesNotHaveAnAdminToken"
            );
        });

        it("Should revert setNameToEmployee with EmptyName", async () => {
            await salary.addEmployee(clientAcc1.address);
            await expect(
                salary.setNameToEmployee(clientAcc1.address, "")
            ).to.be.revertedWithCustomError(salary, "EmptyName");
        });

        it("Should revert setNameToEmployee with NotAllowedToSetName", async () => {
            await salary.addEmployee(clientAcc1.address);
            await expect(
                salary
                    .connect(adminAcc2)
                    .setNameToEmployee(clientAcc1.address, "Alice")
            ).to.be.revertedWithCustomError(salary, "NotAllowedToSetName");
        });

        it("Should revert removeNameFromEmployee with UserDoesNotHaveAnAdminToken", async () => {
            await salary.addEmployee(clientAcc1.address);
            await expect(
                salary
                    .connect(clientAcc1)
                    .removeNameFromEmployee(clientAcc1.address)
            ).to.be.revertedWithCustomError(
                adminToken,
                "UserDoesNotHaveAnAdminToken"
            );
        });

        it("Should revert removeNameFromEmployee with NotAllowedToRemoveName", async () => {
            await salary.addEmployee(clientAcc1.address);
            await expect(
                salary
                    .connect(adminAcc2)
                    .removeNameFromEmployee(clientAcc1.address)
            ).to.be.revertedWithCustomError(salary, "NotAllowedToRemoveName");
        });

        it("Should return false when user is not Employee", async () => {
            await salary.addEmployee(clientAcc1.address);
            await salary.addEmployee(clientAcc2.address);
            expect(
                await salary.checkIfUserIsEmployeeOfAdmin(
                    adminAcc1.address,
                    clientAcc3.address
                )
            ).to.be.equal(false);
        });

        it("Should revert addEmployee with AllreadyEmployee", async () => {
            await salary.addEmployee(clientAcc1.address);
            await expect(
                salary.addEmployee(clientAcc1.address)
            ).to.be.revertedWithCustomError(salary, "AllreadyEmployee");
        });

        it("Should revert addEmployee with UserDoesNotHaveAnAdminToken", async () => {
            await expect(
                salary.connect(clientAcc1).addEmployee(clientAcc2.address)
            ).to.be.revertedWithCustomError(
                adminToken,
                "UserDoesNotHaveAnAdminToken"
            );
        });

        it("Should revert removeEmployee with AlreadyNotAnEmployee", async () => {
            await expect(
                salary.removeEmployee(clientAcc1.address)
            ).to.be.revertedWithCustomError(salary, "AlreadyNotAnEmployee");
        });

        it("Should removeEmployee without different admin salary removal", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);
            await salary.connect(adminAcc1).addEmployee(clientAcc1.address);
            await salary.connect(adminAcc2).addEmployee(clientAcc1.address);

            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            let admins = await salary.getAdminsByEmployee(clientAcc1.address);
            let id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }

            expect(id[0].toString()).to.be.equal("1");
            expect(id[1].toString()).to.be.equal("");

            await salary.connect(adminAcc2).removeEmployee(clientAcc1.address);

            admins = await salary.getAdminsByEmployee(clientAcc1.address);
            id = [];
            for (i = 0; i < admins.length; i++) {
                id.push(
                    await salary.getSalariesIdByEmployeeAndAdmin(
                        clientAcc1.address,
                        admins[i]
                    )
                );
            }

            expect(id.toString()).to.be.equal("1");
        });

        it("Should revert addSalaryToEmployee with NotEnoughTokensAllowed", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 100);
            await salary.connect(adminAcc1).addEmployee(clientAcc1.address);

            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await expect(
                salary.addSalaryToEmployee(
                    clientAcc1.address,
                    periodDuration,
                    amountOfPeriods,
                    tokenAddress,
                    tokensAmountPerPeriod
                )
            ).to.be.revertedWithCustomError(salary, "NotEnoughTokensAllowed");
        });

        it("Should revert withdrawSalary with NotEmployeeForThisSalary", async () => {
            await mockERC20.mint(adminAcc1.address, 600);
            await mockERC20.approve(salary.address, 600);
            await salary.connect(adminAcc1).addEmployee(clientAcc1.address);

            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];

            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await increaseTime(59);

            await expect(
                salary.connect(clientAcc2).withdrawSalary(1)
            ).to.be.revertedWithCustomError(salary, "NotEmployeeForThisSalary");
        });

        it("Should revert removeSalaryFromEmployee with NotAdminForEmployee", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await expect(
                salary.connect(adminAcc2).removeSalaryFromEmployee("1")
            ).to.be.revertedWithCustomError(salary, "NotAdminForEmployee");
        });

        it("Should revert addSalaryToEmployee with NotAdminForEmployee", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await expect(
                salary
                    .connect(adminAcc2)
                    .addSalaryToEmployee(
                        clientAcc1.address,
                        periodDuration,
                        amountOfPeriods,
                        tokenAddress,
                        tokensAmountPerPeriod
                    )
            ).to.be.revertedWithCustomError(salary, "NotAdminForEmployee");
        });

        it("Should revert removeSalaryFromEmployee with NotAdminForThisSalary", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let totalTokenAmount = 600;
            let tokensAmountPerPeriod = [
                60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            await mockERC20.mint(adminAcc2.address, initOwnerBalance);
            await mockERC20
                .connect(adminAcc2)
                .approve(salary.address, initOwnerBalance);
            await salary.connect(adminAcc2).addEmployee(clientAcc1.address);
            periodDuration = 60;
            amountOfPeriods = 10;
            tokenAddress = mockERC20.address;
            totalTokenAmount = 600;
            tokensAmountPerPeriod = [60, 60, 60, 60, 60, 60, 60, 60, 60, 60];
            await salary
                .connect(adminAcc2)
                .addSalaryToEmployee(
                    clientAcc1.address,
                    periodDuration,
                    amountOfPeriods,
                    tokenAddress,
                    tokensAmountPerPeriod
                );

            await expect(
                salary.connect(adminAcc2).removeSalaryFromEmployee("1")
            ).to.be.revertedWithCustomError(salary, "NotAdminForThisSalary");
        });

        it("Should revert constructor with ZeroAddress", async () => {
            let salaryTx2 = await ethers.getContractFactory("BentureSalary");
            await expect(
                salaryTx2.deploy("0x0000000000000000000000000000000000000000")
            ).to.be.revertedWithCustomError(salary, "ZeroAddress");
        });

        it("Should revert addPeriodsToSalary with SalaryEnded", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(600 * 10);

            await salary.connect(clientAcc1).withdrawSalary(1);
            await expect(
                salary.addPeriodsToSalary(1, [110, 120, 130])
            ).to.be.revertedWithCustomError(salary, "SalaryEnded");
        });

        it("Should revert removePeriodsFromSalary with SalaryEnded", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [
                10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
            ];
            await salary.addSalaryToEmployee(
                clientAcc1.address,
                periodDuration,
                amountOfPeriods,
                tokenAddress,
                tokensAmountPerPeriod
            );

            //Already spent 1 sec
            await increaseTime(600 * 10);

            await salary.connect(clientAcc1).withdrawSalary(1);
            await expect(
                salary.removePeriodsFromSalary(1, 1)
            ).to.be.revertedWithCustomError(salary, "SalaryEnded");
        });

        it("Should revert addSalaryToEmployee with InvalidAmountOfPeriods", async () => {
            let initOwnerBalance = 1200;
            await mockERC20.mint(adminAcc1.address, initOwnerBalance);
            await mockERC20.approve(salary.address, initOwnerBalance);
            await salary.addEmployee(clientAcc1.address);
            let periodDuration = 60;
            let amountOfPeriods = 10;
            let tokenAddress = mockERC20.address;
            let tokensAmountPerPeriod = [10, 20, 30, 40, 50, 60, 70, 80, 90];
            await expect(
                salary.addSalaryToEmployee(
                    clientAcc1.address,
                    periodDuration,
                    amountOfPeriods,
                    tokenAddress,
                    tokensAmountPerPeriod
                )
            ).to.be.revertedWithCustomError(salary, "InvalidAmountOfPeriods");
        });
    });
});
