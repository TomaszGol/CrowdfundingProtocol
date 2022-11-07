import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, Event } from "ethers";
import { ethers } from "hardhat";

describe("FundRaisingFactory", async function () {
  let fundRaisingFactory: Contract;
  let deployer: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const title = "Test";
  const backAmount = ethers.utils.parseEther("10");
  const tokenName = "Testtoken";
  const tokenSymbol = "TEST";

  const defaultFee = 5;

  beforeEach(async () => {
    [deployer, addr1, addr2] = await ethers.getSigners();
    const FundRaisingFactory = await ethers.getContractFactory(
      "FundRaisingFactory"
    );

    fundRaisingFactory = await FundRaisingFactory.deploy(defaultFee);
    await fundRaisingFactory.deployed();
  });
  describe("Success cases", async function () {
    it("Owner can change fee", async function () {
      const newFee = 3;

      expect(await fundRaisingFactory.getCurrentFee()).to.be.equal(defaultFee);

      const tx = await fundRaisingFactory.changeFee(newFee);

      await expect(tx)
        .to.be.emit(fundRaisingFactory, "FeeChanged")
        .withArgs(defaultFee, newFee);
      expect(await fundRaisingFactory.getCurrentFee()).to.be.equal(newFee);
    });
    it("Owner can change default owner", async function () {
      expect(await fundRaisingFactory.getCurrentOwner()).to.be.equal(
        deployer.address
      );

      const tx = await fundRaisingFactory.changeOwner(addr1.address);

      await expect(tx)
        .to.be.emit(fundRaisingFactory, "OwnerChanged")
        .withArgs(deployer.address, addr1.address);
      await expect(tx)
        .to.be.emit(fundRaisingFactory, "OwnershipTransferred")
        .withArgs(deployer.address, addr1.address);
      expect(await fundRaisingFactory.getCurrentOwner()).to.be.equal(
        addr1.address
      );
    });
    //createProject
    it("Successfuly created new project", async function () {
      const projectId = 1;
      const blockNumber = ethers.provider.getBlockNumber();
      const expirationDate =
        (await ethers.provider.getBlock(blockNumber)).timestamp + 1000;

      const createProj = await fundRaisingFactory.createProject(
        title,
        backAmount,
        expirationDate,
        tokenName,
        tokenSymbol,
        { value: ethers.utils.parseEther("0.5") }
      );

      const tx = await createProj.wait();

      const events = await tx.events;

      const createProjectEvent = events.find(
        (el: Event) => el.event === "ProjectCreated"
      );
      const rentId = createProjectEvent.args.id.toNumber();
      const projectAddress = createProjectEvent.args.projectAddress;

      await expect(createProj)
        .to.be.emit(fundRaisingFactory, "ProjectCreated")
        .withArgs(rentId, projectAddress, title, expirationDate, backAmount);

      expect(await fundRaisingFactory.isProjectExists(projectId)).to.be.true;

      expect(await fundRaisingFactory.getProjectWithId(rentId)).to.be.equal(
        projectAddress
      );
    });
    it("Successfuly created two new projects", async function () {
      const blockNumber = ethers.provider.getBlockNumber();
      const expirationDate =
        (await ethers.provider.getBlock(blockNumber)).timestamp + 1000;

      await fundRaisingFactory.createProject(
        title,
        backAmount,
        expirationDate,
        tokenName,
        tokenSymbol,
        { value: ethers.utils.parseEther("0.5") }
      );

      const secondTitle = "Test2";
      const secondBackAmount = ethers.utils.parseEther("100");
      const secondTokenName = "Testtoken2";
      const secondTokenSymbol = "TES";
      const secondBlockNumber = ethers.provider.getBlockNumber();
      const secondExpirationDate =
        (await ethers.provider.getBlock(secondBlockNumber)).timestamp + 100000;

      const createProj = await fundRaisingFactory.createProject(
        secondTitle,
        secondBackAmount,
        secondExpirationDate,
        secondTokenName,
        secondTokenSymbol,
        { value: ethers.utils.parseEther("5") }
      );

      const tx = await createProj.wait();

      const events = await tx.events;

      const createProjectEvent = events.find(
        (el: Event) => el.event === "ProjectCreated"
      );
      const rentId = createProjectEvent.args.id.toNumber();
      const projectAddress = createProjectEvent.args.projectAddress;

      const projectId = 2;

      await expect(createProj)
        .to.be.emit(fundRaisingFactory, "ProjectCreated")
        .withArgs(
          rentId,
          projectAddress,
          secondTitle,
          secondExpirationDate,
          secondBackAmount
        );

      expect(await fundRaisingFactory.isProjectExists(projectId)).to.be.true;

      expect(await fundRaisingFactory.getProjectWithId(projectId)).to.be.equal(
        projectAddress
      );
    });
    //isProjectExists
    it("Return true when project exists", async function () {
      const blockNumber = ethers.provider.getBlockNumber();
      const expirationDate =
        (await ethers.provider.getBlock(blockNumber)).timestamp + 1000;

      await fundRaisingFactory.createProject(
        title,
        backAmount,
        expirationDate,
        tokenName,
        tokenSymbol,
        { value: ethers.utils.parseEther("0.5") }
      );

      const projectId = 1;

      expect(await fundRaisingFactory.isProjectExists(projectId)).to.be.true;
    });
    it("Return false when project does not exist", async function () {
      const notExistID = 5;
      expect(await fundRaisingFactory.isProjectExists(notExistID)).to.be.false;
    });
    it("Return created project", async function () {
      const blockNumber = ethers.provider.getBlockNumber();
      const expirationDate =
        (await ethers.provider.getBlock(blockNumber)).timestamp + 1000;

      const createProj = await fundRaisingFactory.createProject(
        title,
        backAmount,
        expirationDate,
        tokenName,
        tokenSymbol,
        { value: ethers.utils.parseEther("0.5") }
      );

      const tx = await createProj.wait();

      const events = await tx.events;

      const createProjectEvent = events.find(
        (el: Event) => el.event === "ProjectCreated"
      );
      const rentId = createProjectEvent.args.id.toNumber();
      const projectAddress = createProjectEvent.args.projectAddress;

      expect(await fundRaisingFactory.getProjectWithId(rentId)).to.be.equal(
        projectAddress
      );
    });
    describe("Getters", async function () {
      it("Get fee", async function () {
        expect(await fundRaisingFactory.getCurrentFee()).to.be.equal(
          defaultFee
        );
      });
      it("Get owner", async function () {
        expect(await fundRaisingFactory.getCurrentOwner()).to.be.equal(
          deployer.address
        );
      });
    });
  });

  describe("Failure cases", async function () {
    it("Cannot change fee when caller is not the owner", async function () {
      const newFee = 3;

      await expect(
        fundRaisingFactory.connect(addr1).changeFee(newFee)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Cannot change owner when caller is not the owner", async function () {
      await expect(
        fundRaisingFactory.connect(addr1).changeOwner(addr1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    //createProject
    it("Cannot create new project when message value not match fee", async function () {
      const blockNumber = ethers.provider.getBlockNumber();
      const expirationDate =
        (await ethers.provider.getBlock(blockNumber)).timestamp + 1000;

      await expect(
        fundRaisingFactory.createProject(
          title,
          backAmount,
          expirationDate,
          tokenName,
          tokenSymbol,
          { value: ethers.utils.parseEther("0.2") }
        )
      ).to.be.revertedWith(
        "FundRaisingFactory: Message value is lower than fee"
      );
    });
  });
});
