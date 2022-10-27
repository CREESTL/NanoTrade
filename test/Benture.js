const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Benture Dividend-Paying Token", () => {
  let benture;
  let origToken;
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

    // Premint 1M distTokens so that Benture contract has funds to pay the dividends
    await distToken.mint(benture.address, 1_000_000);

    // Deploy another "empty" contract to use its address
    let rummyTx = await ethers.getContractFactory("Rummy");
    rummy = await rummyTx.deploy();
    await rummy.deployed();
  });

  describe("ERC20 dividends", () => {
    describe("Equal dividends", () => {
      it("Should distribute dividends to a single address", async () => {
        // Premint one account with 100k of origTokens
        await origToken.mint(ownerAcc.address, 100_000);
        let startBalance = await distToken.balanceOf(ownerAcc.address);
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            distToken.address,
            10
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance = await distToken.balanceOf(ownerAcc.address);
        expect(endBalance.sub(startBalance)).to.equal(10);
      });

      it("Should distribute dividends to a list of addresses", async () => {
        await origToken.mint(ownerAcc.address, 100_000);
        await origToken.mint(clientAcc1.address, 100_000);
        await origToken.mint(clientAcc2.address, 100_000);
        let startBalance1 = await distToken.balanceOf(ownerAcc.address);
        let startBalance2 = await distToken.balanceOf(clientAcc1.address);
        let startBalance3 = await distToken.balanceOf(clientAcc2.address);
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            distToken.address,
            90
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance1 = await distToken.balanceOf(ownerAcc.address);
        let endBalance2 = await distToken.balanceOf(clientAcc1.address);
        let endBalance3 = await distToken.balanceOf(clientAcc2.address);
        expect(endBalance1.sub(startBalance1)).to.equal(30);
        expect(endBalance2.sub(startBalance2)).to.equal(30);
        expect(endBalance3.sub(startBalance3)).to.equal(30);
      });

      it("Should distribute dividends if one holder gets deleted", async () => {
        // Mint some tokens to 2 accounts. Each of them becomes a holder.
        await origToken.mint(ownerAcc.address, 1000);
        await origToken.mint(clientAcc1.address, 1000);
        // Burn tokens from one account. He is no longer a holder.
        await origToken.connect(ownerAcc).burn(1000);
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            distToken.address,
            100
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance1 = await distToken.balanceOf(ownerAcc.address);
        let endBalance2 = await distToken.balanceOf(clientAcc1.address);
        expect(endBalance1).to.equal(0);
        expect(endBalance2).to.equal(100);
      });

      it("Should distribute dividends if one holder is benture address", async () => {
        await origToken.mint(benture.address, 1000);
        await origToken.mint(ownerAcc.address, 1000);
        let ownerStartBalance = await distToken.balanceOf(ownerAcc.address);
        let bentureStartBalance = await distToken.balanceOf(benture.address);
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            distToken.address,
            666
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let ownerEndBalance = await distToken.balanceOf(ownerAcc.address);
        let bentureEndBalance = await distToken.balanceOf(benture.address);
        // 666 tokens get trasfered to the account...
        expect(ownerEndBalance.sub(ownerStartBalance)).to.equal(666);
        // ...from the benture contract
        expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(666);
      });

      it("Should distribute tokens to the list of addresses including benture address", async () => {
        await origToken.mint(clientAcc1.address, 10_000);
        await origToken.mint(clientAcc2.address, 10_000);
        await origToken.mint(benture.address, 10_000);
        let client1StartBalance = await origToken.balanceOf(clientAcc1.address);
        let client2StartBalance = await origToken.balanceOf(clientAcc2.address);
        let bentureStartBalance = await origToken.balanceOf(benture.address);
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            origToken.address,
            10_000
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);

        let client1EndBalance = await origToken.balanceOf(clientAcc1.address);
        let client2EndBalance = await origToken.balanceOf(clientAcc2.address);
        let bentureEndBalance = await origToken.balanceOf(benture.address);
        // 10_000 tokens from Benture should be equaly distributed to 2 accounts
        expect(client1EndBalance.sub(client1StartBalance)).to.equal(5_000);
        expect(client2EndBalance.sub(client2StartBalance)).to.equal(5_000);
        expect(bentureEndBalance).to.equal(0);
      });

      it("Should not distribute dividends if benture address is the only holder", async () => {
        await origToken.mint(benture.address, 1000);
        let bentureStartBalance = await distToken.balanceOf(benture.address);
        await expect(
          benture.distributeDividendsEqual(
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

      it("Should fail to distribute too high dividends", async () => {
        await origToken.mint(ownerAcc.address, 1_000_000);
        // distToken balance of benture is 1_000_000 (preminted in `beforeEach` hook),
        // but we try to distribute 1_000_001
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            distToken.address,
            1_000_001
          )
        ).to.be.revertedWith(
          "Benture: not enough ERC20 dividend tokens to distribute!"
        );
      });

      it("Should fail to distribute too high dividends #2", async () => {
        // Mint origTokens both to account and the Benture contract
        await origToken.mint(ownerAcc.address, 1_000_000);
        await origToken.mint(benture.address, 1_000_000);
        // Try to distribute these tokens (more than minted)
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            origToken.address,
            1_000_001
          )
        ).to.be.revertedWith(
          "Benture: not enough ERC20 dividend tokens to distribute!"
        );
      });

      it("Should fail to distribute dividends to invalid token holders", async () => {
        await origToken.mint(ownerAcc.address, 100_000);
        await expect(
          benture.distributeDividendsEqual(
            rummy.address,
            distToken.address,
            1000
          )
        ).to.be.revertedWith(
          "Benture: provided original token does not support required functions!"
        );
      });

      it("Should fail to distribute dividends to no receivers", async () => {
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            distToken.address,
            1000
          )
        ).to.be.revertedWith("Benture: no dividends receivers were found!");
      });

      it("Should fail to distribute dividends if original token has zero address", async () => {
        await origToken.mint(ownerAcc.address, 100_000);
        await expect(
          benture.distributeDividendsEqual(zeroAddress, distToken.address, 1000)
        ).to.be.revertedWith(
          "Benture: original token can not have a zero address!"
        );
      });

      it("Should fail to distribute dividends from a wrong 3rd attempt", async () => {
        // owner has 10_000 tokens
        // benture has 10_000 tokens
        await origToken.mint(ownerAcc.address, 10_000);
        await origToken.mint(benture.address, 10_000);
        await benture.distributeDividendsEqual(
          origToken.address,
          origToken.address,
          10_000
        );
        // owner has 20_000 tokens
        // benture has 0 tokens
        await origToken.mint(benture.address, 10_000);
        // owner has 20_000 tokens
        // benture has 10_000 tokens
        await benture.distributeDividendsEqual(
          origToken.address,
          origToken.address,
          10_000
        );
        // owner has 30_000 tokens
        // benture has 0 tokens
        // This fails
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            origToken.address,
            5_000
          )
        ).to.be.revertedWith(
          "Benture: not enough ERC20 dividend tokens to distribute!"
        );
      });
    });

    describe("Weighted dividends", () => {
      it("Should distribute dividends to a single address", async () => {
        // Provide some origTokens to the owner contract
        await origToken.mint(ownerAcc.address, 1000);
        let startBalance = await distToken.balanceOf(ownerAcc.address);
        // 1000 / 10 = 100 (minimum balance of distTokens of benture contract required)
        // But is has 1 000 000 so it will pass
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            distToken.address,
            10
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance = await distToken.balanceOf(ownerAcc.address);
        expect(endBalance.sub(startBalance)).to.equal(100);
      });

      it("Should distribute dividends to a list of addresses", async () => {
        await origToken.mint(ownerAcc.address, 1000);
        await origToken.mint(clientAcc1.address, 1000);
        await origToken.mint(clientAcc2.address, 1000);
        let startBalance1 = await distToken.balanceOf(ownerAcc.address);
        let startBalance2 = await distToken.balanceOf(clientAcc1.address);
        let startBalance3 = await distToken.balanceOf(clientAcc2.address);
        // 1000 / 10 = 100 (minimum balance of distTokens of benture contract required)
        // But is has 1 000 000 so it will pass
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            distToken.address,
            10
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance1 = await distToken.balanceOf(ownerAcc.address);
        let endBalance2 = await distToken.balanceOf(clientAcc1.address);
        let endBalance3 = await distToken.balanceOf(clientAcc2.address);
        expect(endBalance1.sub(startBalance1)).to.equal(100);
        expect(endBalance2.sub(startBalance2)).to.equal(100);
        expect(endBalance3.sub(startBalance3)).to.equal(100);
      });

      it("Should distribute dividends if one holder gets deleted", async () => {
        // Mint some tokens to 2 accounts. Each of them becomes a holder.
        await origToken.mint(ownerAcc.address, 1000);
        await origToken.mint(clientAcc1.address, 1000);
        // Burn tokens from one account. He is no longer a holder.
        await origToken.connect(ownerAcc).burn(1000);
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            distToken.address,
            10
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance1 = await distToken.balanceOf(ownerAcc.address);
        let endBalance2 = await distToken.balanceOf(clientAcc1.address);
        expect(endBalance1).to.equal(0);
        expect(endBalance2).to.equal(100);
      });

      it("Should distribute dividends if one holder is benture address", async () => {
        await origToken.mint(benture.address, 1000);
        await origToken.mint(ownerAcc.address, 1000);
        let ownerStartBalance = await distToken.balanceOf(ownerAcc.address);
        let bentureStartBalance = await distToken.balanceOf(benture.address);
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            distToken.address,
            10
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let ownerEndBalance = await distToken.balanceOf(ownerAcc.address);
        let bentureEndBalance = await distToken.balanceOf(benture.address);
        // 1000 / 10 = 100 tokens get trasfered to the account...
        expect(ownerEndBalance.sub(ownerStartBalance)).to.equal(100);
        // ...from the benture contract
        expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(100);
      });

      it("Should distribute tokens to the list of addresses including benture address", async () => {
        await origToken.mint(clientAcc1.address, 10_000);
        await origToken.mint(clientAcc2.address, 10_000);
        await origToken.mint(benture.address, 10_000);
        let client1StartBalance = await origToken.balanceOf(clientAcc1.address);
        let client2StartBalance = await origToken.balanceOf(clientAcc2.address);
        let bentureStartBalance = await origToken.balanceOf(benture.address);
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            origToken.address,
            1000
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);

        let client1EndBalance = await origToken.balanceOf(clientAcc1.address);
        let client2EndBalance = await origToken.balanceOf(clientAcc2.address);
        let bentureEndBalance = await origToken.balanceOf(benture.address);
        // 10_000 / 1000 = 10 tokens per account shoud be distributed
        expect(client1EndBalance.sub(client1StartBalance)).to.equal(10);
        expect(client2EndBalance.sub(client2StartBalance)).to.equal(10);
        expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(20);
      });

      it("Should not distribute dividends if benture address is the only holder", async () => {
        await origToken.mint(benture.address, 1000);
        let bentureStartBalance = await distToken.balanceOf(benture.address);
        await expect(
          benture.distributeDividendsWeighted(
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
        await origToken.mint(ownerAcc.address, 10_000_000);
        // 10_000_000 / 1 = 10_000_000 (minimum balance of distTokens of benture contract required)
        // But is has 1 000 000 so it will fail
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            distToken.address,
            1
          )
        ).to.be.revertedWith(
          "Benture: not enough dividend tokens to distribute with the provided weight!"
        );
      });

      it("Should fail to distribute too high dividends a list of addresses", async () => {
        await origToken.mint(ownerAcc.address, 10_000_000);
        await origToken.mint(clientAcc1.address, 10_000_000);
        await origToken.mint(clientAcc2.address, 10_000_000);
        // 30_000_000 / 10 = 3_000_000 (minimum balance of distTokens of benture contract required)
        // But is has 1 000 000 so it will fail
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            distToken.address,
            10
          )
        ).to.be.revertedWith(
          "Benture: not enough dividend tokens to distribute with the provided weight!"
        );
      });

      it("Should fail to distribute dividends to invalid token holders", async () => {
        await origToken.mint(ownerAcc.address, 1000);
        await expect(
          benture.distributeDividendsWeighted(
            rummy.address,
            distToken.address,
            10
          )
        ).to.be.revertedWith(
          "Benture: provided original token does not support required functions!"
        );
      });

      it("Should fail to distribute dividends to no receivers", async () => {
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            distToken.address,
            10
          )
        ).to.be.revertedWith("Benture: no dividends receivers were found!");
      });

      it("Should fail to distribute dividends for native tokens holders", async () => {
        await origToken.mint(ownerAcc.address, 1000);
        await expect(
          benture.distributeDividendsWeighted(
            zeroAddress,
            distToken.address,
            10
          )
        ).to.be.revertedWith(
          "Benture: original token can not have a zero address!"
        );
      });

      it("Should fail to distribute dividends with too low weight", async () => {
        await origToken.mint(ownerAcc.address, 1000);
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            distToken.address,
            0
          )
        ).to.be.revertedWith("Benture: weight is too low!");
      });

      it("Should fail to distribute dividends with too high weight", async () => {
        await origToken.mint(ownerAcc.address, 10);
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            distToken.address,
            1000
          )
        ).to.be.revertedWith(
          "Benture: some of the receivers does not have enough tokens for the provided weight!"
        );
      });
    });
  });

  describe("Native tokens dividends", () => {
    describe("Equal dividends", () => {
      it("Should distribute dividends to a single address", async () => {
        // Premint some origTokens to one account
        await origToken.mint(ownerAcc.address, 1000);
        // Provide some ether to the benture contract to be able to pay dividends
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        let startBalance = await ethers.provider.getBalance(ownerAcc.address);
        expect(
          await benture.distributeDividendsEqual(
            origToken.address,
            zeroAddress,
            parseEther("1")
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance = await ethers.provider.getBalance(ownerAcc.address);
        // 1 ether - gas
        expect(endBalance.sub(startBalance)).to.be.lt(parseEther("1"));
      });

      it("Should distribute dividends to a list of addresses", async () => {
        await origToken.mint(ownerAcc.address, 1000);
        await origToken.mint(clientAcc1.address, 1000);
        await origToken.mint(clientAcc2.address, 1000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        let startBalance1 = await ethers.provider.getBalance(ownerAcc.address);
        let startBalance2 = await ethers.provider.getBalance(
          clientAcc1.address
        );
        let startBalance3 = await ethers.provider.getBalance(
          clientAcc2.address
        );
        expect(
          await benture.distributeDividendsEqual(
            origToken.address,
            zeroAddress,
            parseEther("1")
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance1 = await ethers.provider.getBalance(ownerAcc.address);
        let endBalance2 = await ethers.provider.getBalance(clientAcc1.address);
        let endBalance3 = await ethers.provider.getBalance(clientAcc2.address);
        // Each should get 0.33333... ether - gas
        expect(endBalance1.sub(startBalance1)).to.be.gt(parseEther("0.3"));
        expect(endBalance2.sub(startBalance2)).to.be.gt(parseEther("0.3"));
        expect(endBalance3.sub(startBalance3)).to.be.gt(parseEther("0.3"));
      });

      it("Should distribute dividends if one holder gets deleted", async () => {
        // Mint some tokens to 2 accounts. Each of them becomes a holder.
        await origToken.mint(clientAcc1.address, 1000);
        await origToken.mint(clientAcc2.address, 1000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        let startBalance1 = await ethers.provider.getBalance(
          clientAcc1.address
        );
        let startBalance2 = await ethers.provider.getBalance(
          clientAcc2.address
        );
        // Burn tokens from one account. He is no longer a holder.
        await origToken.connect(clientAcc1).burn(1000);
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            zeroAddress,
            parseEther("5")
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
        await origToken.mint(ownerAcc.address, 1000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        let ownerStartBalance = await ethers.provider.getBalance(
          ownerAcc.address
        );
        let bentureStartBalance = await ethers.provider.getBalance(
          benture.address
        );
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            zeroAddress,
            parseEther("5")
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let ownerEndBalance = await ethers.provider.getBalance(
          ownerAcc.address
        );
        let bentureEndBalance = await ethers.provider.getBalance(
          benture.address
        );
        // 5 ETH (-gas because calling from ownerAcc) gets trasfered to the account...
        expect(ownerEndBalance.sub(ownerStartBalance)).to.be.lt(
          parseEther("5")
        );
        // ...from the benture contract
        expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(
          parseEther("5")
        );
      });

      it("Should distribute tokens to the list of addresses including benture address", async () => {
        await origToken.mint(clientAcc1.address, 10_000);
        await origToken.mint(clientAcc2.address, 10_000);
        await origToken.mint(benture.address, 10_000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("6"),
        });
        let client1StartBalance = await ethers.provider.getBalance(
          clientAcc1.address
        );
        let client2StartBalance = await ethers.provider.getBalance(
          clientAcc2.address
        );
        let bentureStartBalance = await ethers.provider.getBalance(
          benture.address
        );
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            zeroAddress,
            parseEther("6")
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

      it("Should not distribute dividends if benture address is the only holder", async () => {
        await origToken.mint(benture.address, 1000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        let bentureStartBalance = await ethers.provider.getBalance(
          benture.address
        );
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            zeroAddress,
            parseEther("5")
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

      it("Should fail to distribute too high dividends", async () => {
        await origToken.mint(ownerAcc.address, 1000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            zeroAddress,
            parseEther("10")
          )
        ).to.be.revertedWith(
          "Benture: not enough native dividend tokens to distribute!"
        );
      });

      it("Should fail to distribute dividends to invalid token holders", async () => {
        await origToken.mint(ownerAcc.address, 1000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        await expect(
          benture.distributeDividendsEqual(
            rummy.address,
            zeroAddress,
            parseEther("1")
          )
        ).to.be.revertedWith(
          "Benture: provided original token does not support required functions!"
        );
      });

      it("Should fail to distribute dividends to no receivers", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        await expect(
          benture.distributeDividendsEqual(
            origToken.address,
            zeroAddress,
            parseEther("1")
          )
        ).to.be.revertedWith("Benture: no dividends receivers were found!");
      });
    });

    describe("Weighted dividends", () => {
      it("Should distribute dividends to a single address", async () => {
        await origToken.mint(clientAcc2.address, 1000);
        // Provide some ether to the benture contract to be able to pay dividends
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        let startBalance = await ethers.provider.getBalance(ownerAcc.address);
        // 1000 / 200 = 5 (minimum balance of distTokens of benture contract required)
        // But is has 8 so it will pass
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            zeroAddress,
            200
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance = await ethers.provider.getBalance(ownerAcc.address);
        // 5 ether - gas
        expect(endBalance.sub(startBalance)).to.be.lt(parseEther("5"));
      });

      it("Should distribute dividends to a list of addresses", async () => {
        // Provide some ether to the benture contract to be able to pay dividends
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("6"),
        });
        await origToken.mint(ownerAcc.address, 10);
        await origToken.mint(clientAcc1.address, 10);
        await origToken.mint(clientAcc2.address, 10);
        let startBalance1 = await ethers.provider.getBalance(ownerAcc.address);
        let startBalance2 = await ethers.provider.getBalance(
          clientAcc1.address
        );
        let startBalance3 = await ethers.provider.getBalance(
          clientAcc2.address
        );
        // 10 / 10 = 1 (x3) (minimum balance of distTokens of benture contract required)
        // But is has 6 so it will pass
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            zeroAddress,
            10
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let endBalance1 = await ethers.provider.getBalance(ownerAcc.address);
        let endBalance2 = await ethers.provider.getBalance(clientAcc1.address);
        let endBalance3 = await ethers.provider.getBalance(clientAcc2.address);
        expect(endBalance1.sub(startBalance1)).to.be.lt(parseEther("2"));
        expect(endBalance2.sub(startBalance2)).to.be.lt(parseEther("2"));
        expect(endBalance3.sub(startBalance3)).to.be.lt(parseEther("2"));
      });

      it("Should distribute dividends if one holder gets deleted", async () => {
        // Mint some tokens to 2 accounts. Each of them becomes a holder.
        await origToken.mint(clientAcc1.address, 1000);
        await origToken.mint(clientAcc2.address, 1000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        let startBalance1 = await ethers.provider.getBalance(
          clientAcc1.address
        );
        let startBalance2 = await ethers.provider.getBalance(
          clientAcc2.address
        );
        // Burn tokens from one account. He is no longer a holder.
        await origToken.connect(clientAcc1).burn(1000);
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            zeroAddress,
            200
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
        await origToken.mint(ownerAcc.address, 1000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        let ownerStartBalance = await ethers.provider.getBalance(
          ownerAcc.address
        );
        let bentureStartBalance = await ethers.provider.getBalance(
          benture.address
        );
        // 1000 / 500 = 2 ETH, and benture has 5. Should pass.
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            zeroAddress,
            500
          )
        )
          .to.emit(benture, "DividendsDistributed")
          .withArgs(anyValue, anyValue);
        let ownerEndBalance = await ethers.provider.getBalance(
          ownerAcc.address
        );
        let bentureEndBalance = await ethers.provider.getBalance(
          benture.address
        );
        // 2 ETH (-gas because calling from ownerAcc) gets trasfered to the account...
        expect(ownerEndBalance.sub(ownerStartBalance)).to.be.lt(
          parseEther("2")
        );
        // ...from the benture contract
        expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(
          parseEther("2")
        );
      });

      it("Should distribute tokens to the list of addresses including benture address", async () => {
        await origToken.mint(clientAcc1.address, 10_000);
        await origToken.mint(clientAcc2.address, 10_000);
        await origToken.mint(benture.address, 10_000);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("6"),
        });
        let client1StartBalance = await ethers.provider.getBalance(
          clientAcc1.address
        );
        let client2StartBalance = await ethers.provider.getBalance(
          clientAcc2.address
        );
        let bentureStartBalance = await ethers.provider.getBalance(
          benture.address
        );
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            zeroAddress,
            10_000
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
        // 10_000 / 10_000 = 1 token per account shoud be distributed
        expect(client1EndBalance.sub(client1StartBalance)).to.equal(
          parseEther("1")
        );
        expect(client2EndBalance.sub(client2StartBalance)).to.equal(
          parseEther("1")
        );
        expect(bentureStartBalance.sub(bentureEndBalance)).to.equal(
          parseEther("2")
        );
      });

      it("Should not distribute dividends if benture address is the only holder", async () => {
        await origToken.mint(benture.address, 100);
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("5"),
        });
        let bentureStartBalance = await ethers.provider.getBalance(
          benture.address
        );
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            zeroAddress,
            50
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

      it("Should fail to distribute too high dividends to a single address", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 1000);
        // 1000 / 1 = 1000 (minimum balance of distTokens of benture contract required)
        // But is has 8 so it will fail
        await expect(
          benture.distributeDividendsWeighted(origToken.address, zeroAddress, 1)
        ).to.be.revertedWith(
          "Benture: not enough dividend tokens to distribute with the provided weight!"
        );
      });

      it("Should fail to distribute too high dividends to a list of addresses", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 100);
        await origToken.mint(clientAcc1.address, 100);
        await origToken.mint(clientAcc2.address, 100);
        // 100 / 10 = 10 (x3) (minimum balance of distTokens of benture contract required)
        // But is has 8so it will fail
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            zeroAddress,
            10
          )
        ).to.be.revertedWith(
          "Benture: not enough dividend tokens to distribute with the provided weight!"
        );
      });

      it("Should fail to distribute dividends to invalid token holders", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 1000);
        await expect(
          benture.distributeDividendsWeighted(rummy.address, zeroAddress, 10)
        ).to.be.revertedWith(
          "Benture: provided original token does not support required functions!"
        );
      });

      it("Should fail to distribute dividends to no receivers", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            zeroAddress,
            10
          )
        ).to.be.revertedWith("Benture: no dividends receivers were found!");
      });

      it("Should fail to distribute dividends for native tokens holders", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 1000);
        await expect(
          benture.distributeDividendsWeighted(zeroAddress, zeroAddress, 10)
        ).to.be.revertedWith(
          "Benture: original token can not have a zero address!"
        );
      });

      it("Should fail to distribute dividends with too low weight", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 1000);
        await expect(
          benture.distributeDividendsWeighted(origToken.address, zeroAddress, 0)
        ).to.be.revertedWith("Benture: weight is too low!");
      });

      it("Should fail to distribute dividends with too high weight", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 10);
        await expect(
          benture.distributeDividendsWeighted(
            origToken.address,
            zeroAddress,
            1000
          )
        ).to.be.revertedWith(
          "Benture: some of the receivers does not have enough tokens for the provided weight!"
        );
      });
    });
  });

  describe("Extras", () => {
    describe("Calculate Minimum Weight", () => {
      it("Should calculate minimum weight correctly for a single receiver", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 1000);
        let minWeight = await benture.calcMinWeight(origToken.address);
        expect(minWeight).to.equal(1000);
      });

      it("Should calculate minimum weight correctly for a list of receivers", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 1000);
        await origToken.mint(clientAcc1.address, 800);
        // This should be the minimum weight
        await origToken.mint(clientAcc2.address, 1);
        let minWeight = await benture.calcMinWeight(origToken.address);
        expect(minWeight).to.equal(1);
      });

      it("Should fail to calculate minimum weight if original token has zero address", async () => {
        await expect(benture.calcMinWeight(zeroAddress)).to.be.revertedWith(
          "Benture: original token can not have a zero address!"
        );
      });
    });

    describe("Check Weight", () => {
      it("Should reject too high weight", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 1000);
        await origToken.mint(clientAcc1.address, 1000);
        await origToken.mint(clientAcc2.address, 1000);
        await expect(
          benture.checkWeight(origToken.address, 10_000)
        ).to.be.revertedWith(
          "Benture: some of the receivers does not have enough tokens for the provided weight!"
        );
      });

      it("Should accept normal weight", async () => {
        await ownerAcc.sendTransaction({
          to: benture.address,
          value: parseEther("8"),
        });
        await origToken.mint(ownerAcc.address, 1000);
        await origToken.mint(clientAcc1.address, 1000);
        await origToken.mint(clientAcc2.address, 1000);
        await expect(benture.checkWeight(origToken.address, 1000));
      });

      it("Should fail to check weight if original token has zero address", async () => {
        await expect(benture.checkWeight(zeroAddress, 1000)).to.be.revertedWith(
          "Benture: original token can not have a zero address!"
        );
      });
    });
  });
});
