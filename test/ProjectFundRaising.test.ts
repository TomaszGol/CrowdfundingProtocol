import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractReceipt } from "ethers";
import { ethers } from "hardhat";
import { erc20 } from "../typechain-types/@openzeppelin/contracts/token";

describe("ProjectFundRaising", async function () {
  let projectFundRaising: Contract;
  let erc20: Contract;
  let deployer: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const projectID = 1;
  const title = "Test";
  const backAmount = ethers.utils.parseEther("10");
  const tokenName = "Testtoken";
  const tokenSymbol = "TEST";
  let expirationDate: number;

  beforeEach(async () => {
    [deployer, addr1, addr2] = await ethers.getSigners();
    const ProjectFundRaisingFactory = await ethers.getContractFactory(
      "ProjectFundRaising"
    );

    const blockNumber = ethers.provider.getBlockNumber();
    expirationDate =
      (await ethers.provider.getBlock(blockNumber)).timestamp + 1000;

    projectFundRaising = await ProjectFundRaisingFactory.deploy(
      projectID,
      title,
      backAmount,
      expirationDate,
      tokenName,
      tokenSymbol
    );
    await projectFundRaising.deployed();

    const deployedErc20Address = await projectFundRaising.getERC20Address();
    const ERC20Factory = await ethers.getContractFactory("ERC20Token");
    erc20 = await ERC20Factory.attach(deployedErc20Address);
  });

  describe("Success cases", async function () {
    it("User succesfully backed project", async function () {
      const backValue = ethers.utils.parseEther("1");

      const addr1Balance = await addr1.getBalance();

      const tx = await projectFundRaising
        .connect(addr1)
        .backProject({ value: backValue });
      const receipt: ContractReceipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      await expect(tx)
        .to.be.emit(projectFundRaising, "ProjectBacked")
        .withArgs(addr1.address, backValue);
      await expect(tx)
        .to.be.emit(erc20, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, backValue);
      expect(await erc20.balanceOf(addr1.address)).to.be.equal(backValue);

      expect(await addr1.getBalance()).to.be.equal(
        addr1Balance.sub(backValue).sub(gasUsed)
      );

      const contractBalance = await ethers.provider.getBalance(
        projectFundRaising.address
      );

      expect(contractBalance).to.be.equal(backValue);
    });
    it("Back value is correct when user backed 2 times", async function () {
      const backValue = ethers.utils.parseEther("1");
      const twoBackValue = ethers.utils.parseEther("2");

      const addr1Balance = await addr1.getBalance();

      const tx = await projectFundRaising
        .connect(addr1)
        .backProject({ value: backValue });
      const receipt: ContractReceipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const ndTx = await projectFundRaising
        .connect(addr1)
        .backProject({ value: backValue });
      const ndReceipt: ContractReceipt = await ndTx.wait();
      const ndGasUsed = ndReceipt.gasUsed.mul(ndReceipt.effectiveGasPrice);

      await expect(ndTx)
        .to.be.emit(projectFundRaising, "ProjectBacked")
        .withArgs(addr1.address, backValue);
      await expect(ndTx)
        .to.be.emit(erc20, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, backValue);
      expect(await erc20.balanceOf(addr1.address)).to.be.equal(twoBackValue);

      expect(await addr1.getBalance()).to.be.equal(
        addr1Balance.sub(twoBackValue).sub(gasUsed).sub(ndGasUsed)
      );

      const contractBalance = await ethers.provider.getBalance(
        projectFundRaising.address
      );
      expect(contractBalance).to.be.equal(twoBackValue);
    });
    it("Back project from 2 adresses", async function () {
      const backValue = ethers.utils.parseEther("1");
      const secondBackValue = ethers.utils.parseEther("2");

      const addr1Balance = await addr1.getBalance();
      const addr2Balance = await addr2.getBalance();

      const tx = await projectFundRaising
        .connect(addr1)
        .backProject({ value: backValue });
      const receipt: ContractReceipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const tx2 = await projectFundRaising
        .connect(addr2)
        .backProject({ value: secondBackValue });
      const ndReceipt: ContractReceipt = await tx2.wait();
      const ndGasUsed = ndReceipt.gasUsed.mul(ndReceipt.effectiveGasPrice);

      expect(await erc20.balanceOf(addr1.address)).to.be.equal(backValue);
      expect(await erc20.balanceOf(addr2.address)).to.be.equal(secondBackValue);

      expect(await addr1.getBalance()).to.be.equal(
        addr1Balance.sub(backValue).sub(gasUsed)
      );
      expect(await addr2.getBalance()).to.be.equal(
        addr2Balance.sub(secondBackValue).sub(ndGasUsed)
      );

      const contractBalance = await ethers.provider.getBalance(
        projectFundRaising.address
      );
      expect(contractBalance).to.be.equal(ethers.utils.parseEther("3"));
    });
    it("Owner withdraw funds from project", async function () {
      const backValue = ethers.utils.parseEther("5");
      const secondBackValue = ethers.utils.parseEther("6");

      const deployerBalance = await deployer.getBalance();

      await projectFundRaising.connect(addr1).backProject({ value: backValue });

      await projectFundRaising
        .connect(addr2)
        .backProject({ value: secondBackValue });

      const withdrawTx = await projectFundRaising.ownerWithdrawFunds();
      const collectedAmount = await projectFundRaising.getCollectedAmount();

      const receipt: ContractReceipt = await withdrawTx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      await expect(withdrawTx)
        .to.be.emit(projectFundRaising, "fundsWithdrawedByOwner")
        .withArgs(deployer.address, collectedAmount);

      expect(await deployer.getBalance()).to.be.equal(
        deployerBalance.add(collectedAmount).sub(gasUsed)
      );
    });
    it("Backer withdraw funds from project", async function () {
      const backValue = ethers.utils.parseEther("3");

      await projectFundRaising.connect(addr1).backProject({ value: backValue });

      const nextBlocksTimestamp = expirationDate + 1000;
      await ethers.provider.send("evm_mine", [nextBlocksTimestamp]);

      await erc20.connect(addr1).approve(projectFundRaising.address, backValue);

      const addr1Balance = await addr1.getBalance();

      const tx = await projectFundRaising.connect(addr1).backerWithdrawFunds();

      const receiptWithdraw: ContractReceipt = await tx.wait();
      const gasUsedWithdraw = receiptWithdraw.gasUsed.mul(
        receiptWithdraw.effectiveGasPrice
      );

      await expect(tx)
        .to.be.emit(projectFundRaising, "fundsWithdrawedByBacker")
        .withArgs(addr1.address, backValue);

      await expect(tx)
        .to.be.emit(erc20, "Transfer")
        .withArgs(addr1.address, ethers.constants.AddressZero, backValue);

      expect(await erc20.balanceOf(addr1.address)).to.be.equal(0);

      expect(await addr1.getBalance()).to.be.equal(
        addr1Balance.add(backValue).sub(gasUsedWithdraw)
      );

      const contractBalance = await ethers.provider.getBalance(
        projectFundRaising.address
      );

      expect(contractBalance).to.be.equal(0);
    });
    it("Backer withdraw funds from project after 2 deposits", async function () {
      const firstValue = ethers.utils.parseEther("1");
      const secondValue = ethers.utils.parseEther("3");

      const backValue = ethers.utils.parseEther("4");
      await projectFundRaising
        .connect(addr1)
        .backProject({ value: firstValue });

      await projectFundRaising
        .connect(addr1)
        .backProject({ value: secondValue });

      const nextBlocksTimestamp = expirationDate + 1000;
      await ethers.provider.send("evm_mine", [nextBlocksTimestamp]);

      await erc20.connect(addr1).approve(projectFundRaising.address, backValue);

      const addr1Balance = await addr1.getBalance();

      const tx = await projectFundRaising.connect(addr1).backerWithdrawFunds();

      const receiptWithdraw: ContractReceipt = await tx.wait();
      const gasUsedWithdraw = receiptWithdraw.gasUsed.mul(
        receiptWithdraw.effectiveGasPrice
      );

      await expect(tx)
        .to.be.emit(projectFundRaising, "fundsWithdrawedByBacker")
        .withArgs(addr1.address, backValue);

      await expect(tx)
        .to.be.emit(erc20, "Transfer")
        .withArgs(addr1.address, ethers.constants.AddressZero, backValue);

      expect(await erc20.balanceOf(addr1.address)).to.be.equal(0);

      expect(await addr1.getBalance()).to.be.equal(
        addr1Balance.add(backValue).sub(gasUsedWithdraw)
      );

      const contractBalance = await ethers.provider.getBalance(
        projectFundRaising.address
      );

      expect(contractBalance).to.be.equal(0);
    });
    describe("Getters", async function () {
      it("Get title of project", async function () {
        expect(await projectFundRaising.getTitle()).to.be.equal(title);
      });
      it("Get expiration of project", async function () {
        expect(await projectFundRaising.getExpiration()).to.be.equal(
          expirationDate
        );
      });
      it("Get owner of project", async function () {
        expect(await projectFundRaising.getOwnerOfProject()).to.be.equal(
          deployer.address
        );
      });
      it("Get collected amount of project", async function () {
        expect(await projectFundRaising.getCollectedAmount()).to.be.equal(
          ethers.utils.parseEther("0")
        );
      });
      it("Get ammount to back of project", async function () {
        expect(await projectFundRaising.getAmountToColect()).to.be.equal(
          backAmount
        );
      });
      it("Get address of project's erc20", async function () {
        expect(await projectFundRaising.getERC20Address()).to.be.equal(
          erc20.address
        );
      });
      it("Get information about whether project is finished or not", async function () {
        expect(await projectFundRaising.isFinished()).to.be.false;
        const backValue = ethers.utils.parseEther("10");

        await projectFundRaising
          .connect(addr1)
          .backProject({ value: backValue });
        expect(await projectFundRaising.isFinished()).to.be.true;
      });
    });
  });

  describe("Failure cases", async function () {
    it("Cannot deposit fund when project is finished", async function () {});
    it("Owner cannot withdraw funds from project when funds not raised", async function () {});
    it("Cannot withdraw funds from project when caller is not the owner", async function () {
      const backValue = ethers.utils.parseEther("5");
      const secondBackValue = ethers.utils.parseEther("6");

      await projectFundRaising.connect(addr1).backProject({ value: backValue });

      await projectFundRaising
        .connect(addr2)
        .backProject({ value: secondBackValue });

      await expect(
        projectFundRaising.connect(addr1).ownerWithdrawFunds()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Backer cannot withdraw funds from project when it is not expired", async function () {});
    it("Backer cannot withdraw funds from project when funds are collected", async function () {});
    it("User cannot withdraw funds when caller is not a backer", async function () {});
  });
});

//GET EXPIRATION
// const blockNumber = ethers.provider.getBlockNumber();
// let expirationDate =
//   (await ethers.provider.getBlock(blockNumber)).timestamp + 1000;

//TOKEN MINE
// const nextBlocksTimestamp = expirationDate + 1000;
//       await ethers.provider.send("evm_mine", [nextBlocksTimestamp]);
