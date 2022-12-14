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
    await distToken.mint(ownerAcc.address, 1_000_000);
    // NOTE: Allow benture to spend all tokens from owner's account (and ever more)
    await distToken.connect(ownerAcc).approve(benture.address, 100_000_000);
    await origToken.connect(ownerAcc).approve(benture.address, 100_000_000);

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
  });

  describe("Salary tests", () => {
    xit("Should add new Employee", async () => {
        //expect(await salary.addEmployee(clientAcc1.address)).to.be.emit(salary, 'addEmployee').withArgs(clientAcc1.address, clientAcc2.address);
        await salary.addEmployee(clientAcc1.address)
        expect(await salary.checkIfUserIsEmployeeOfAdmin(ownerAcc.address, clientAcc1.address)).to.be.true
        expect(await salary.checkIfUserIsAdminOfEmployee(clientAcc1.address, ownerAcc.address)).to.be.true
    });

    xit("Should remove Employee", async () => {
        await salary.addEmployee(clientAcc1.address)
        expect(await salary.checkIfUserIsEmployeeOfAdmin(ownerAcc.address, clientAcc1.address)).to.be.true
        expect(await salary.checkIfUserIsAdminOfEmployee(clientAcc1.address, ownerAcc.address)).to.be.true
        await salary.removeEmployee(clientAcc1.address)
        expect(await salary.checkIfUserIsEmployeeOfAdmin(ownerAcc.address, clientAcc1.address)).to.be.false
        expect(await salary.checkIfUserIsAdminOfEmployee(clientAcc1.address, ownerAcc.address)).to.be.false
    });

    xit("Should add new name to Employee", async () => {
        await salary.addEmployee(clientAcc1.address)
        expect(await salary.checkIfUserIsEmployeeOfAdmin(ownerAcc.address, clientAcc1.address)).to.be.true
        expect(await salary.checkIfUserIsAdminOfEmployee(clientAcc1.address, ownerAcc.address)).to.be.true
        await salary.setNameToEmployee(clientAcc1.address, "Alice")
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("Alice")
    });

    xit("Should change name of Employee", async () => {
        await salary.addEmployee(clientAcc1.address)
        await salary.setNameToEmployee(clientAcc1.address, "Alice")
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("Alice")
        await salary.setNameToEmployee(clientAcc1.address, "Bob")
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("Bob") 
    });

    xit("Should remove name from Employee", async () => {
        await salary.addEmployee(clientAcc1.address)
        await salary.setNameToEmployee(clientAcc1.address, "Alice")
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("Alice")
        await salary.removeNameFromEmployee(clientAcc1.address)
        expect(await salary.getNameOfEmployee(clientAcc1.address)).to.be.equal("")
    });

    xit("Should add new salary to Employee", async () => {
        await mockERC20.mint(ownerAcc.address, 600)
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
        expect(salaryInfo[0].employer).to.be.equal(ownerAcc.address)
        expect(salaryInfo[0].employee).to.be.equal(clientAcc1.address)
        expect(salaryInfo[0].lastWithdrawalTime).to.be.equal((await getTimestump()).toString())
    });

    //should add new ways of removing
    xit("Should remove salary from Employee", async () => {
        await mockERC20.mint(ownerAcc.address, 600)
        await mockERC20.approve(salary.address, 600)
        await salary.addEmployee(clientAcc1.address)
        let periodDuration = 60
        let amountOfPeriods = 10
        let tokenAddress = mockERC20.address
        let totalTokenAmount = 600
        let tokensAmountPerPeriod = 10
        await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)
        //console.log(await salary.getSalaryById(1))
        await salary.removeSalaryFromEmployee(clientAcc1.address)
        let salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
        expect(salaryInfo[0].id).to.be.equal("0")
        expect(salaryInfo[0].periodDuration).to.be.equal("0")
        expect(salaryInfo[0].amountOfPeriods).to.be.equal("0")
        expect(salaryInfo[0].tokenAddress).to.be.equal("0")
        expect(salaryInfo[0].totalTokenAmount).to.be.equal("0")
        expect(salaryInfo[0].tokensAmountPerPeriod).to.be.equal("0")
    });

    xit("Should withdraw salary to Employee", async () => {
        await mockERC20.mint(ownerAcc.address, 600)
        await mockERC20.approve(salary.address, 300)
        await salary.addEmployee(clientAcc1.address)
        let periodDuration = 60
        let amountOfPeriods = 10
        let tokenAddress = mockERC20.address
        let totalTokenAmount = 100
        let tokensAmountPerPeriod = 10
        await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

        periodDuration = 60
        amountOfPeriods = 10
        tokenAddress = mockERC20.address
        totalTokenAmount = 200
        tokensAmountPerPeriod = 20
        await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

        console.log("TIME: ", await getTimestump())
        //console.log(await salary.getSalaryById(1))
        await increaseTime(1600)
        console.log("TIME: ", await getTimestump())
        console.log((await mockERC20.balanceOf(ownerAcc.address)).toString())
        console.log((await mockERC20.balanceOf(clientAcc1.address)).toString())
        await salary.connect(clientAcc1).withdrawSalary(1)
        await salary.connect(clientAcc1).withdrawSalary(2)
        let salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
        console.log(salaryInfo[0].lastWithdrawalTime)
        //expect(salaryInfo[0].lastWithdrawalTime).to.be.equal((await getTimestump()).toString())
        console.log((await mockERC20.balanceOf(ownerAcc.address)).toString())
        console.log((await mockERC20.balanceOf(clientAcc1.address)).toString())


    });

    it("Should add more than 1 salary to Employee", async () => {
        await mockERC20.mint(ownerAcc.address, 600)
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
        expect(salaryInfo[0].employer).to.be.equal(ownerAcc.address)
        expect(salaryInfo[0].employee).to.be.equal(clientAcc1.address)
        expect(salaryInfo[0].lastWithdrawalTime).to.be.equal((await getTimestump()).toString())

        periodDuration = 60
        amountOfPeriods = 10
        tokenAddress = mockERC20.address
        totalTokenAmount = 200
        tokensAmountPerPeriod = 20
        await salary.addSalaryToEmployee(clientAcc1.address, periodDuration, amountOfPeriods, tokenAddress, totalTokenAmount, tokensAmountPerPeriod)

        salaryInfo = await salary.getSalariesByEmployee(clientAcc1.address)
        expect(salaryInfo[1].id).to.be.equal("2")
        expect(salaryInfo[1].periodDuration).to.be.equal(periodDuration)
        expect(salaryInfo[1].amountOfPeriods).to.be.equal(amountOfPeriods)
        expect(salaryInfo[1].tokenAddress).to.be.equal(tokenAddress)
        expect(salaryInfo[1].totalTokenAmount).to.be.equal(totalTokenAmount)
        expect(salaryInfo[1].tokensAmountPerPeriod).to.be.equal(tokensAmountPerPeriod)
        expect(salaryInfo[1].employer).to.be.equal(ownerAcc.address)
        expect(salaryInfo[1].employee).to.be.equal(clientAcc1.address)
        expect(salaryInfo[1].lastWithdrawalTime).to.be.equal((await getTimestump()).toString())

        expect(salaryInfo.length).to.be.equal(2)
    });

    xit("Should add more than 1 salary to Employee from 1 admin", async () => {

    });
  })

})
