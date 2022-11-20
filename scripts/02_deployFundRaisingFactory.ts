import { ethers } from "hardhat";
import { deployContract, getDeployConfig } from "../utils";

export async function deployContractControlList() {
  const [deployer] = await ethers.getSigners();
  //   const config = getDeployConfig();
  const admin = deployer.address;
  const network = (await deployer.provider?.getNetwork())?.name;
  console.log(deployer.address);

  if (!network) {
    throw new Error("Network not defined");
  }
  if (!admin) {
    throw new Error("Admin not defined");
  }
  const cclAddress = "0x76248b372d36e870bF33A932C8c7B57AE390e8B0";
  console.log("Deploying FundRaisingFactory...");
  const FundRaisingFactory = await ethers.getContractFactory(
    "FundRaisingFactory"
  );
  const fundRaisingFactory = await deployContract(
    network as string,
    "FundRaisingFactory",
    FundRaisingFactory,
    [cclAddress, 5]
  );

  await fundRaisingFactory.deployed();
  console.log(`FundRaisingFactory: deployed: ${fundRaisingFactory.address}`);
}

async function main() {
  await deployContractControlList();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
