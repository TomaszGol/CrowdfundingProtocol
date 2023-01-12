import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("TenumerableMapBytes32ToAddress", async function () {
  let testContract: Contract;
  let deployer: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [deployer, addr1, addr2] = await ethers.getSigners();
    const EnumerableMapBytes32ToAddressFactory =
      await ethers.getContractFactory("TestEnumerableMap");

    testContract = await EnumerableMapBytes32ToAddressFactory.deploy();
    await testContract.deployed();
  });

  describe("Success cases", async function () {
    it("Set element in map", async function () {
      const value = ethers.utils.formatBytes32String("test");
      expect(await testContract.set(value, addr1.address)).to.not.be.reverted;
    });
    it("Remove element from map", async function () {
      const value = ethers.utils.formatBytes32String("test");
      await testContract.set(value, addr1.address);

      expect(await testContract.remove(value)).to.not.be.reverted;
    });
    it("Map contains element", async function () {
      const value = ethers.utils.formatBytes32String("test");
      await testContract.set(value, addr1.address);

      expect(await testContract.contains(value)).to.be.true;
    });
    it("Get map legnth", async function () {
      const value = ethers.utils.formatBytes32String("test");
      await testContract.set(value, addr1.address);
      const value2 = ethers.utils.formatBytes32String("test2");
      await testContract.set(value2, addr2.address);

      expect(await testContract.length()).to.be.equal(2);
    });
    it("Get element at", async function () {
      const value = ethers.utils.formatBytes32String("test");
      await testContract.set(value, addr1.address);
      const value2 = ethers.utils.formatBytes32String("test2");
      await testContract.set(value2, addr2.address);
      expect(await testContract.at(1)).to.be.deep.equals([
        value2,
        addr2.address,
      ]);
    });
    it("Try to get element if exists", async function () {
      const value = ethers.utils.formatBytes32String("test");
      await testContract.set(value, addr1.address);

      expect(await testContract.tryGet(value)).to.be.deep.equals([
        true,
        addr1.address,
      ]);
    });
    it("Try to get element if does not exist", async function () {
      const value = ethers.utils.formatBytes32String("test");

      expect(await testContract.tryGet(value)).to.be.deep.equals([
        false,
        ethers.constants.AddressZero,
      ]);
    });
    it("Get element", async function () {
      const value = ethers.utils.formatBytes32String("test");
      await testContract.set(value, addr1.address);

      expect(await testContract.get(value)).to.be.equals(addr1.address);
    });
    it("Get element with error message", async function () {
      const value = ethers.utils.formatBytes32String("test");
      await testContract.set(value, addr1.address);

      expect(
        await testContract.getWithError(value, "Error message")
      ).to.be.equal(addr1.address);
    });
  });

  describe("Failure cases", async function () {
    it("Get - non existing key", async function () {
      const value = ethers.utils.formatBytes32String("test");

      await expect(testContract.get(value)).to.be.revertedWith(
        "EnumerableMap: nonexistent key"
      );
    });
    it("Get with error - non existing key", async function () {
      const value = ethers.utils.formatBytes32String("test");

      await expect(
        testContract.getWithError(value, "Error message")
      ).to.be.revertedWith("Error message");
    });
  });
});
