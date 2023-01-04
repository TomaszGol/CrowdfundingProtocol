import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("ContractControlList", async function () {
  let ccl: Contract;
  let signer: SignerWithAddress;
  let addr: SignerWithAddress;
  beforeEach(async () => {
    [signer, addr] = await ethers.getSigners();
    const ContractControlList = await ethers.getContractFactory(
      "ContractControlList"
    );
    ccl = await ContractControlList.deploy(signer.address);
    await ccl.deployed();
  });
  describe("ContractControlList", async function () {
    it("ContractControlList: admin has FUND_RAISING_ADMIN", async function () {
      const role = await ccl.FUND_RAISING_ADMIN();
      expect(await ccl.hasRole(role, signer.address)).to.be.equal(true);
    });
    it("ContractControlList: admin has FUND_RAISING_MODERATOR", async function () {
      const role = await ccl.FUND_RAISING_MODERATOR();
      expect(await ccl.hasRole(role, signer.address)).to.be.equal(true);
    });

    it("hasFundRaisingAdminRole returns information about FUND_RAISING_ADMIN", async function () {
      const role = await ccl.FUND_RAISING_ADMIN();
      const adminInformationAboutRole = await ccl.hasRole(role, signer.address);
      const addrInformationAboutRole = await ccl.hasRole(role, addr.address);

      expect(await ccl.hasFundRaisingAdminRole(signer.address)).to.be.equal(
        adminInformationAboutRole
      );

      expect(await ccl.hasFundRaisingAdminRole(addr.address)).to.be.equal(
        addrInformationAboutRole
      );
    });
    it("hasFundRaisingModeratorRole returns information about FUND_RAISING_MODERATOR", async function () {
      const role = await ccl.FUND_RAISING_MODERATOR();
      const adminInformationAboutRole = await ccl.hasRole(role, signer.address);
      const addrInformationAboutRole = await ccl.hasRole(role, addr.address);

      expect(await ccl.hasFundRaisingModeratorRole(signer.address)).to.be.equal(
        adminInformationAboutRole
      );

      expect(await ccl.hasFundRaisingModeratorRole(addr.address)).to.be.equal(
        addrInformationAboutRole
      );
    });
    it("Admin should give moderator role", async function () {
      const role = await ccl.FUND_RAISING_MODERATOR();
      const tx = await ccl.giveModeratorRole(addr.address);
      expect(tx)
        .to.be.emit(ccl, "RoleGranted")
        .withArgs(role, addr.address, signer.address);
      expect(await ccl.hasFundRaisingModeratorRole(addr.address)).to.be.true;
    });
    it("Admin should revoke moderator role", async function () {
      const role = await ccl.FUND_RAISING_MODERATOR();
      await ccl.giveModeratorRole(addr.address);
      const tx = ccl.revokeModeratorRole(addr.address);
      expect(tx)
        .to.be.emit(ccl, "RoleRevoked")
        .withArgs(role, addr.address, signer.address);
    });
  });

  describe("ContractControlList", async function () {
    it("Cannot give moderator role, when caller has not admin", async function () {
      await expect(
        ccl.connect(addr).giveModeratorRole(addr.address)
      ).to.be.revertedWith("ContractControlList: Caller is not the admin");
    });
    it("Cannot revoke moderator role, when caller has not admin", async function () {
      await ccl.giveModeratorRole(addr.address);
      await expect(
        ccl.connect(addr).revokeModeratorRole(addr.address)
      ).to.be.revertedWith("ContractControlList: Caller is not the admin");
    });
    it("Cannot revoke moderator role, when user has not moderator role", async function () {
      await ccl.giveModeratorRole(addr.address);
      await expect(
        ccl.connect(addr).revokeModeratorRole(addr.address)
      ).to.be.revertedWith("ContractControlList: Caller is not the admin");
    });
  });
});
