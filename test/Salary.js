const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Salary", () => {
    let benture;
    let origToken;
    let adminToken;
    let factory;

    const increaseTime = async (time) => {
        await ethers.provider.send("evm_increaseTime", [time])
        await ethers.provider.send("evm_mine")
      }

    const getTimestump = async () => {
        let blockNumber = await ethers.provider.getBlockNumber()
        let block = await ethers.provider.getBlock(blockNumber)
        return block.timestamp
    }

  beforeEach(async () => {
    [adminAcc1, adminAcc2, clientAcc1, clientAcc2] = await ethers.getSigners();

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
    await distToken.connect(adminAcc1).approve(benture.address, 100_000_000);
    await origToken.connect(adminAcc1).approve(benture.address, 100_000_000);

    // Deploy another "empty" contract to use its address
    let rummyTx = await ethers.getContractFactory("Rummy");
    rummy = await rummyTx.deploy();
    await rummy.deployed();

    let salaryTx = await ethers.getContractFactory("Salary");
    salary = await salaryTx.deploy(adminToken.address);
    await salary.deployed();

    let mockERC20Tx = await ethers.getContractFactory("MockERC20");
    mockERC20 = await mockERC20Tx.deploy();
    await mockERC20.deployed();

    await adminToken.approve(adminAcc2.address, "1")
    await adminToken.transferFrom(adminAcc1.address, adminAcc2.address, "1")
  });

  xdescribe("Salary tests", () => {
    it("Should add new Employee", async () => {
        await salary.addEmployee(clientAcc1.address)
        expect(await salary.checkIfUserIsEmployeeOfAdmin(adminAcc1.address, clientAcc1.address)).to.be.true
        expect(await salary.checkIfUserIsAdminOfEmployee(clientAcc1.address, adminAcc1.address)).to.be.true
    });

    it("Should remove Employee", async () => {
        await salary.addEmployee(clientAcc1.address)
        expect(await salary.checkIfUserIsEmployeeOfAdmin(adminAcc1.address, clientAcc1.address)).to.be.true
        expect(await salary.checkIfUserIsAdminOfEmployee(clientAcc1.address, adminAcc1.address)).to.be.true
        await salary.removeEmployee(clientAcc1.address)
        expect(await salary.checkIfUserIsEmployeeOfAdmin(adminAcc1.address, clientAcc1.address)).to.be.false
        expect(await salary.checkIfUserIsAdminOfEmployee(clientAcc1.address, adminAcc1.address)).to.be.false
    });

    it("Should add new name to Employee", async () => {
        await salary.addEmployee(clientAcc1.address)
        await salary.setNameToEmployee(clientAcc1.address, "Alice")
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("Alice")
    });

    it("Should change name of Employee", async () => {
        await salary.addEmployee(clientAcc1.address)
        await salary.setNameToEmployee(clientAcc1.address, "Alice")
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("Alice")
        await salary.setNameToEmployee(clientAcc1.address, "Bob")
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("Bob") 
    });

    it("Should remove name from Employee", async () => {
        await salary.addEmployee(clientAcc1.address)
        await salary.setNameToEmployee(clientAcc1.address, "Alice")
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("Alice")
        await salary.removeNameFromEmployee(clientAcc1.address)
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("")
    });

    it("Should add new salary to Employee", async () => {
        await mockERC20.mint(adminAcc1.address, 600)
        await mockERC20.approve(salary.address, 600)

        await salary.addEmployee(clientAcc1.address)

        let periodDuration = 60
        let amountOfPeriods = 10
        let tokenAddress = mockERC20.address
        let totalTokenAmount = 600
        let tokensAmountPerPeriod = 10
        await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)
        
        //console.log(await salary.getSalaryById(1))
        let salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
        expect(salaryInfo[0].id).to.be.equal("1")
        expect(salaryInfo[0].periodDuration).to.be.equal(periodDuration)
        expect(salaryInfo[0].amountOfPeriods).to.be.equal(amountOfPeriods)
        expect(salaryInfo[0].tokenAddress).to.be.equal(tokenAddress)
        expect(salaryInfo[0].totalTokenAmount).to.be.equal(totalTokenAmount)
        expect(salaryInfo[0].tokensAmountPerPeriod).to.be.equal(tokensAmountPerPeriod)
        expect(salaryInfo[0].lastWithdrawalTime).to.be.equal((await getTimestump()).toString())
        expect(salaryInfo[0].employer).to.be.equal(adminAcc1.address)
        expect(salaryInfo[0].employee).to.be.equal(clientAcc1.address)

        salaryInfo = await salary.getSalaryById("1")
        expect(salaryInfo.id).to.be.equal("1")
        expect(salaryInfo.periodDuration).to.be.equal(periodDuration)
        expect(salaryInfo.amountOfPeriods).to.be.equal(amountOfPeriods)
        expect(salaryInfo.tokenAddress).to.be.equal(tokenAddress)
        expect(salaryInfo.totalTokenAmount).to.be.equal(totalTokenAmount)
        expect(salaryInfo.tokensAmountPerPeriod).to.be.equal(tokensAmountPerPeriod)
        expect(salaryInfo.lastWithdrawalTime).to.be.equal((await getTimestump()).toString())
        expect(salaryInfo.employer).to.be.equal(adminAcc1.address)
        expect(salaryInfo.employee).to.be.equal(clientAcc1.address)
    });

    it("Should remove salary from Employee", async () => {
      await mockERC20.mint(adminAcc1.address, 600)
      await mockERC20.approve(salary.address, 600)

      await salary.addEmployee(clientAcc1.address)

      let periodDuration = 60
      let amountOfPeriods = 10
      let tokenAddress = mockERC20.address
      let totalTokenAmount = 600
      let tokensAmountPerPeriod = 10

      await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)
      
      let salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
      expect(salaryInfo[0].id).to.be.equal("1")
      expect(salaryInfo[0].periodDuration).to.be.equal(periodDuration)
      expect(salaryInfo[0].amountOfPeriods).to.be.equal(amountOfPeriods)
      expect(salaryInfo[0].tokenAddress).to.be.equal(tokenAddress)
      expect(salaryInfo[0].totalTokenAmount).to.be.equal(totalTokenAmount)
      expect(salaryInfo[0].tokensAmountPerPeriod).to.be.equal(tokensAmountPerPeriod)
      expect(salaryInfo[0].lastWithdrawalTime).to.be.equal((await getTimestump()).toString())
      expect(salaryInfo[0].employer).to.be.equal(adminAcc1.address)
      expect(salaryInfo[0].employee).to.be.equal(clientAcc1.address)

      await salary.removeSalaryFromEmployee("1")
      salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
      expect(salaryInfo.toString()).to.be.equal("")

      salaryInfo = await salary.getSalaryById("1")
      expect(salaryInfo.toString()).to.be.equal("0,0,0,0,0x0000000000000000000000000000000000000000,0,0,0,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000")
    });

    it("Should let withdraw salary to Employee", async () => {
        let initOwnerBalance = 1200
        await mockERC20.mint(adminAcc1.address, initOwnerBalance)
        await mockERC20.approve(salary.address, initOwnerBalance)
        await salary.addEmployee(clientAcc1.address)
        let periodDuration = 60
        let amountOfPeriods = 10
        let tokenAddress = mockERC20.address
        let totalTokenAmount = 600
        let tokensAmountPerPeriod = 60
        await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

        let timeBeforeWithdrawal = await getTimestump()

        //Already spent 1 sec
        await increaseTime(59)
        await salary.connect(clientAcc1).withdrawSalary(1)

        let timeAfterWithdrawal = await getTimestump()
        expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(timeAfterWithdrawal - timeBeforeWithdrawal)
        let salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
        expect(salaryInfo[0].lastWithdrawalTime).to.be.equal(await getTimestump())
        expect(salaryInfo[0].amountOfWithdrawals).to.be.equal(1)

        salaryInfo = await salary.getSalaryById("1")
        expect(salaryInfo.lastWithdrawalTime).to.be.equal(await getTimestump())
        expect(salaryInfo.amountOfWithdrawals).to.be.equal(1)

        let expectedBalance = tokensAmountPerPeriod * (timeAfterWithdrawal - timeBeforeWithdrawal) / periodDuration
        expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(expectedBalance)
        expect(await mockERC20.balanceOf(adminAcc1.address)).to.be.equal(initOwnerBalance - expectedBalance)
    });

    it("Should add more than 1 salary to Employee from 1 admin", async () => {
        await mockERC20.mint(adminAcc1.address, 800)
        await mockERC20.approve(salary.address, 800)
        await salary.addEmployee(clientAcc1.address)
        let periodDuration = 60
        let amountOfPeriods = 10
        let tokenAddress = mockERC20.address
        let totalTokenAmount = 600
        let tokensAmountPerPeriod = 10
        await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

        let salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
        expect(salaryInfo[0].id).to.be.equal("1")
        expect(salaryInfo[0].periodDuration).to.be.equal(periodDuration)
        expect(salaryInfo[0].amountOfPeriods).to.be.equal(amountOfPeriods)
        expect(salaryInfo[0].tokenAddress).to.be.equal(tokenAddress)
        expect(salaryInfo[0].totalTokenAmount).to.be.equal(totalTokenAmount)
        expect(salaryInfo[0].tokensAmountPerPeriod).to.be.equal(tokensAmountPerPeriod)
        expect(salaryInfo[0].employer).to.be.equal(adminAcc1.address)
        expect(salaryInfo[0].employee).to.be.equal(clientAcc1.address)
        expect(salaryInfo[0].lastWithdrawalTime).to.be.equal((await getTimestump()).toString())

        periodDuration = 100
        amountOfPeriods = 20
        tokenAddress = mockERC20.address
        totalTokenAmount = 200
        tokensAmountPerPeriod = 10
        await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

        salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
        expect(salaryInfo[1].id).to.be.equal("2")
        expect(salaryInfo[1].periodDuration).to.be.equal(periodDuration)
        expect(salaryInfo[1].amountOfPeriods).to.be.equal(amountOfPeriods)
        expect(salaryInfo[1].tokenAddress).to.be.equal(tokenAddress)
        expect(salaryInfo[1].totalTokenAmount).to.be.equal(totalTokenAmount)
        expect(salaryInfo[1].tokensAmountPerPeriod).to.be.equal(tokensAmountPerPeriod)
        expect(salaryInfo[1].employer).to.be.equal(adminAcc1.address)
        expect(salaryInfo[1].employee).to.be.equal(clientAcc1.address)
        expect(salaryInfo[1].lastWithdrawalTime).to.be.equal((await getTimestump()).toString())

        expect(salaryInfo.length).to.be.equal(2)
    });

    it("Should add more than 1 salary to Employee from 1 admin and delete only one of them", async () => {
      await mockERC20.mint(adminAcc1.address, 800)
      await mockERC20.approve(salary.address, 800)
      await salary.addEmployee(clientAcc1.address)
      let periodDuration = 60
      let amountOfPeriods = 10
      let tokenAddress = mockERC20.address
      let totalTokenAmount = 600
      let tokensAmountPerPeriod = 10
      await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

      periodDuration = 100
      amountOfPeriods = 20
      tokenAddress = mockERC20.address
      totalTokenAmount = 200
      tokensAmountPerPeriod = 10
      await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

      await salary.removeSalaryFromEmployee("1")
      let salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
      expect(salaryInfo.length).to.be.equal(1)

      salaryInfo = await salary.getSalaryById("1")
      expect(salaryInfo.toString()).to.be.equal("0,0,0,0,0x0000000000000000000000000000000000000000,0,0,0,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000")
    
      salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
      expect(salaryInfo[0].id).to.be.equal("2")
      expect(salaryInfo[0].periodDuration).to.be.equal(periodDuration)
      expect(salaryInfo[0].amountOfPeriods).to.be.equal(amountOfPeriods)
      expect(salaryInfo[0].tokenAddress).to.be.equal(tokenAddress)
      expect(salaryInfo[0].totalTokenAmount).to.be.equal(totalTokenAmount)
      expect(salaryInfo[0].tokensAmountPerPeriod).to.be.equal(tokensAmountPerPeriod)
      expect(salaryInfo[0].employer).to.be.equal(adminAcc1.address)
      expect(salaryInfo[0].employee).to.be.equal(clientAcc1.address)
    });

    it("Should add more than 1 salary to Employee from 2 admins", async () => {
      await mockERC20.mint(adminAcc1.address, 600)
      await mockERC20.approve(salary.address, 600)
      await salary.addEmployee(clientAcc1.address)
      let periodDuration = 60
      let amountOfPeriods = 10
      let tokenAddress = mockERC20.address
      let totalTokenAmount = 600
      let tokensAmountPerPeriod = 10
      await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

      let salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
      expect(salaryInfo[0].employer).to.be.equal(adminAcc1.address)


      await mockERC20.mint(adminAcc2.address, 200)
      await mockERC20.connect(adminAcc2).approve(salary.address, 200)
      await salary.connect(adminAcc2).addEmployee(clientAcc1.address)
      periodDuration = 100
      amountOfPeriods = 20
      tokenAddress = mockERC20.address
      totalTokenAmount = 200
      tokensAmountPerPeriod = 10
      await salary.connect(adminAcc2).addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

      salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
      expect(salaryInfo[1].employer).to.be.equal(adminAcc2.address)

      expect((await salary.getAdminsByEmployee(clientAcc1.address)).length).to.be.equal(2)
      expect((await salary.getEmployeesByAdmin(adminAcc1.address)).length).to.be.equal(1)
      expect((await salary.getEmployeesByAdmin(adminAcc2.address)).length).to.be.equal(1)
      
      expect(salaryInfo.length).to.be.equal(2)
    });

    it("Should withdraw more than 1 salary", async () => {
      await mockERC20.mint(adminAcc1.address, 600)
      await mockERC20.approve(salary.address, 600)
      await salary.addEmployee(clientAcc1.address)
      let periodDuration = 60
      let amountOfPeriods = 10
      let tokenAddress = mockERC20.address
      let totalTokenAmount = 600
      let tokensAmountPerPeriod = 60
      await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

      await mockERC20.mint(adminAcc2.address, 1000)
      await mockERC20.connect(adminAcc2).approve(salary.address, 1000)
      await salary.connect(adminAcc2).addEmployee(clientAcc1.address)
      periodDuration = 60
      amountOfPeriods = 10
      tokenAddress = mockERC20.address
      totalTokenAmount = 1000
      tokensAmountPerPeriod = 100
      await salary.connect(adminAcc2).addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

      console.log("---------------------------------------------")

      console.log("Balance of 1 Admin before first withdraw: ", (await mockERC20.balanceOf(adminAcc1.address)).toString())
      console.log("Balance of 2 Admin before first withdraw: ", (await mockERC20.balanceOf(adminAcc2.address)).toString())
      console.log("Balance of Employee before first withdraw: ", (await mockERC20.balanceOf(clientAcc1.address)).toString())

      console.log("---------------------------------------------")

      await increaseTime(59)
      await salary.connect(clientAcc1).withdrawSalary(1)
      await salary.connect(clientAcc1).withdrawSalary(2)

      console.log("Balance of 1 Admin after first withdraw: ", (await mockERC20.balanceOf(adminAcc1.address)).toString())
      console.log("Balance of 2 Admin after first withdraw: ", (await mockERC20.balanceOf(adminAcc2.address)).toString())
      console.log("Balance of Employee after first withdraw: ", (await mockERC20.balanceOf(clientAcc1.address)).toString())

      console.log("---------------------------------------------")

      await increaseTime(40)
      await salary.connect(clientAcc1).withdrawSalary(1)
      await salary.connect(clientAcc1).withdrawSalary(2)

      console.log("Balance of 1 Admin after second withdraw: ", (await mockERC20.balanceOf(adminAcc1.address)).toString())
      console.log("Balance of 2 Admin after second withdraw: ", (await mockERC20.balanceOf(adminAcc2.address)).toString())
      console.log("Balance of Employee after second withdraw: ", (await mockERC20.balanceOf(clientAcc1.address)).toString())

      console.log("---------------------------------------------")
    });

    it("Should withdraw salary for more than 1 period", async () => {
      await mockERC20.mint(adminAcc1.address, 600)
      await mockERC20.approve(salary.address, 600)
      await salary.addEmployee(clientAcc1.address)
      let periodDuration = 60
      let amountOfPeriods = 10
      let tokenAddress = mockERC20.address
      let totalTokenAmount = 600
      let tokensAmountPerPeriod = 60
      await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

      await increaseTime(119)
      await salary.connect(clientAcc1).withdrawSalary(1)
      expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(tokensAmountPerPeriod * 2)
    });

    it("Should not let to withdraw more salary than total amount", async () => {
      await mockERC20.mint(adminAcc1.address, 600)
      await mockERC20.approve(salary.address, 600)
      await salary.addEmployee(clientAcc1.address)
      let periodDuration = 60
      let amountOfPeriods = 10
      let tokenAddress = mockERC20.address
      let totalTokenAmount = 600
      let tokensAmountPerPeriod = 60
      await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

      await increaseTime((amountOfPeriods * periodDuration) * 10)
      await salary.connect(clientAcc1).withdrawSalary(1)
      expect(await mockERC20.balanceOf(clientAcc1.address)).to.be.equal(totalTokenAmount)
    });

  })

  describe("Salary reverts", () => {
    it("Should revert setNameToEmployee with BentureAdmin: user does not have an admin token!", async () => {
        await salary.addEmployee(clientAcc1.address)
        await expect(salary.connect(clientAcc1).setNameToEmployee(clientAcc1.address, "Alice")).to.be.revertedWith("BentureAdmin: user does not have an admin token!")
    });

    it("Should revert setNameToEmployee with Salary: not allowed to set name!", async () => {
      await salary.addEmployee(clientAcc1.address)
      await expect(salary.connect(adminAcc2).setNameToEmployee(clientAcc1.address, "Alice")).to.be.revertedWith("Salary: not allowed to set name!")
    });

    xit("Should not let to withdraw more salary than total amount", async () => {

    });

    xit("Should not let to withdraw more salary than total amount", async () => {

    });
  })

})
