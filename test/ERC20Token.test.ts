import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractReceipt } from "ethers";
import { ethers } from "hardhat";

describe("ProjectFundRaising", async function () {
  let erc20: Contract;
  let deployer: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const tokenName = "Testtoken";
  const tokenSymbol = "TEST";

  beforeEach(async () => {
    [deployer, addr1, addr2] = await ethers.getSigners();
    const ERC20Factory = await ethers.getContractFactory("ERC20Token");

    erc20 = await ERC20Factory.deploy(tokenName, tokenSymbol);
    await erc20.deployed();
  });

  describe("Success cases", async function () {
    it("Owner mint token", async function () {
      const tx = await erc20.mint(addr1.address, 100);
      await expect(tx)
        .to.be.emit(erc20, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, 100);

      const secondTx = await erc20.mint(addr2.address, 200);
      await expect(secondTx)
        .to.be.emit(erc20, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr2.address, 200);

      const thirdTx = await erc20.mint(addr1.address, 10000);
      await expect(thirdTx)
        .to.be.emit(erc20, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, 10000);
    });
  });

  describe("Failure cases", async function () {
    it("Not owner cannot mint token", async function () {
      await expect(
        erc20.connect(addr1).mint(addr2.address, 1000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
