import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, Event } from "ethers";
import { ethers } from "hardhat";

describe("FundRaisingFactory", async function () {
  let fundRaisingFactory: Contract;
  let ccl: Contract;
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
    const ContractControlListFactory = await ethers.getContractFactory(
      "ContractControlList"
    );

    ccl = await ContractControlListFactory.deploy(deployer.address);
    await ccl.deployed();

    const FundRaisingFactory = await ethers.getContractFactory(
      "FundRaisingFactory"
    );

    fundRaisingFactory = await FundRaisingFactory.deploy(
      ccl.address,
      defaultFee
    );
    await fundRaisingFactory.deployed();
  });
  describe("Success cases", async function () {
    it("Owner can change fee", async function () {
      const newFee = 3;

      expect(await fundRaisingFactory.feeSetting()).to.be.equal(defaultFee);

      const tx = await fundRaisingFactory.changeFee(newFee);

      await expect(tx)
        .to.be.emit(fundRaisingFactory, "FeeChanged")
        .withArgs(defaultFee, newFee);
      expect(await fundRaisingFactory.feeSetting()).to.be.equal(newFee);
    });
    // it("Owner can change default owner", async function () {
    //   expect(await fundRaisingFactory.defaultOwner()).to.be.equal(
    //     deployer.address
    //   );

    //   const tx = await fundRaisingFactory.changeOwner(addr1.address);

    //   await expect(tx)
    //     .to.be.emit(fundRaisingFactory, "OwnerChanged")
    //     .withArgs(deployer.address, addr1.address);
    //   await expect(tx)
    //     .to.be.emit(fundRaisingFactory, "OwnershipTransferred")
    //     .withArgs(deployer.address, addr1.address);
    //   expect(await fundRaisingFactory.defaultOwner()).to.be.equal(
    //     addr1.address
    //   );
    //   // DUPA
    //   expect(tx).to.be.emit(ccl, "").withArgs();
    //   expect(tx).to.be.emit(ccl, "").withArgs();
    //   // EMIT ROLE REVOKE
    //   // EMIT ROLE GRANTED
    // });
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

      expect(await fundRaisingFactory.projectsCreated(rentId)).to.be.equal(
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

      expect(await fundRaisingFactory.projectsCreated(projectId)).to.be.equal(
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

      expect(await fundRaisingFactory.projectsCreated(rentId)).to.be.equal(
        projectAddress
      );
    });
    // stopProject
    it("Admin should be able to stop project", async function () {
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

      const cancelTx = await fundRaisingFactory.cancelProject(rentId);

      const ProjectFundRaisingFactory = await ethers.getContractFactory(
        "ProjectFundRaising"
      );

      const projectAddress = await fundRaisingFactory.projectsCreated(rentId);

      const project = await ProjectFundRaisingFactory.attach(projectAddress);

      expect(cancelTx)
        .to.be.emit(fundRaisingFactory, "ProjectCanceled")
        .withArgs(rentId);
      expect(await project.status()).to.be.equal(2);
    });
    it("Moderator should be able to stop project", async function () {
      await ccl.giveModeratorRole(addr2.address);

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

      const cancelTx = await fundRaisingFactory
        .connect(addr2)
        .cancelProject(rentId);

      const ProjectFundRaisingFactory = await ethers.getContractFactory(
        "ProjectFundRaising"
      );

      const projectAddress = await fundRaisingFactory.projectsCreated(rentId);

      const project = await ProjectFundRaisingFactory.attach(projectAddress);

      expect(cancelTx)
        .to.be.emit(fundRaisingFactory, "ProjectCanceled")
        .withArgs(rentId);
      expect(await project.status()).to.be.equal(2);
    });
    // verifyProject
    it("Admin should be able to verify project", async function () {
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

      const cancelTx = await fundRaisingFactory.verifyProject(rentId);

      const ProjectFundRaisingFactory = await ethers.getContractFactory(
        "ProjectFundRaising"
      );

      const projectAddress = await fundRaisingFactory.projectsCreated(rentId);

      const project = await ProjectFundRaisingFactory.attach(projectAddress);

      expect(cancelTx)
        .to.be.emit(fundRaisingFactory, "ProjectCanceled")
        .withArgs(rentId);
      expect(await project.status()).to.be.equal(1);
    });
    it("Moderator should be able to verify project", async function () {
      await ccl.giveModeratorRole(addr2.address);

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

      const cancelTx = await fundRaisingFactory
        .connect(addr2)
        .verifyProject(rentId);

      const ProjectFundRaisingFactory = await ethers.getContractFactory(
        "ProjectFundRaising"
      );

      const projectAddress = await fundRaisingFactory.projectsCreated(rentId);

      const project = await ProjectFundRaisingFactory.attach(projectAddress);

      expect(cancelTx)
        .to.be.emit(fundRaisingFactory, "ProjectCanceled")
        .withArgs(rentId);
      expect(await project.status()).to.be.equal(1);
    });

    describe("Getters", async function () {
      it("Get fee", async function () {
        expect(await fundRaisingFactory.feeSetting()).to.be.equal(defaultFee);
      });
      it("Get owner", async function () {
        expect(await fundRaisingFactory.defaultOwner()).to.be.equal(
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
      ).to.be.revertedWith("FundRaisingFactory: Caller is not the owner");
    });

    // it("Cannot change owner when caller is not the owner", async function () {
    //   await expect(
    //     fundRaisingFactory.connect(addr1).changeOwner(addr1.address)
    //   ).to.be.revertedWith("FundRaisingFactory: Caller is not the owner");
    // });
    //createProject
    it("Cannot create new project when expiration date is longer than month from now", async function () {
      const monthFromNow = 2629743;

      const blockNumber = ethers.provider.getBlockNumber();
      const expirationDate =
        (await ethers.provider.getBlock(blockNumber)).timestamp +
        monthFromNow +
        1000;

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
        "FundRaisingFactory: Expiration date cannot be longer than a one month"
      );
    });
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
    // stopProject
    it("Cannot cancel project, when caller is not admin nor moderator", async function () {
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

      await expect(
        fundRaisingFactory.connect(addr2).cancelProject(rentId)
      ).to.revertedWith(
        "FundRaisingFactory: Caller is not the owner nor moderator"
      );
    });
    // verifyProject
    it("Cannot verify project, when caller is not admin nor moderator", async function () {
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

      await expect(
        fundRaisingFactory.connect(addr2).verifyProject(rentId)
      ).to.be.revertedWith(
        "FundRaisingFactory: Caller is not the owner nor moderator"
      );
    });
  });
});
