import { ethers } from "hardhat";
import { deployContract } from "../utils";

export async function deployContractControlList() {
  const [deployer] = await ethers.getSigners();

  const admin = deployer.address;
  const network = (await deployer.provider?.getNetwork())?.name;
  console.log(deployer.address);

  if (!network) {
    throw new Error("Network not defined");
  }
  if (!admin) {
    throw new Error("Admin not defined");
  }

  console.log("Deploying ContractControlList...");
  const ContractControlList = await ethers.getContractFactory(
    "ContractControlList"
  );
  const contractControlList = await deployContract(
    network as string,
    "ContractControlList",
    ContractControlList,
    [admin]
  );

  await contractControlList.deployed();
  console.log(`ContractControlList deployed: ${contractControlList.address}`);
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
