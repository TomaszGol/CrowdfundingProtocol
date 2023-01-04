import { BigNumber } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";
import * as path from "path";

export function getConfigDir(): string {
  return path.join(process.cwd(), "config");
}

export function getDeployConfig(): { [key: string]: string | number } {
  try {
    return JSON.parse(
      fs
        .readFileSync(path.join(getConfigDir(), `deploymentConfig.json`))
        .toString()
    );
  } catch (e) {
    return {};
  }
}

export function getConfigFileByName(filename: string): {
  [key: string]: string | number;
} {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(getConfigDir(), filename)).toString()
    );
  } catch (e) {
    return {};
  }
}

export function getContractAddresses(network: string): {
  [key: string]: string | null;
} {
  try {
    return JSON.parse(
      fs
        .readFileSync(
          path.join(getConfigDir(), `${network}_contractAddresses.json`)
        )
        .toString()
    );
  } catch (e) {
    return {};
  }
}
export function getContractAddressPerName(
  network: string,
  contractName: string
): string | null {
  return getContractAddresses(network)[contractName];
}

export function writeMigrationVerificationData(
  constructorArguments: unknown[],
  address: string
) {
  fs.writeFileSync(
    path.join(process.cwd(), "scripts", `verify.json`),
    JSON.stringify(
      {
        constructorArguments,
        address,
      },
      null,
      4
    )
  );
}

export function writeVerificationData(
  networkName: string,
  contractName: string,
  contractAddress: string,
  ctorParams: any[]
) {
  fs.writeFileSync(
    path.join(getConfigDir(), `${networkName}_verify_${contractName}.js`),
    "module.exports = " + JSON.stringify(ctorParams, null, 4) + ";"
  );
  console.log(
    `To verify ${contractName} contract\n 'npx hardhat verify --constructor-args config/${networkName}_verify_${contractName}.js ${contractAddress} --network ${networkName}'`
  );
}

// @ts-ignore
export async function deployContract(
  networkName: string,
  contractName: string,
  contractFactory: any,
  ctorParams: Array<any>
) {
  console.log(`Deploying contract ${contractName}`);
  const contractInstance = await contractFactory.deploy(...ctorParams);
  await contractInstance.deployed();

  const addresses = { ...(await getContractAddresses(networkName)) };
  addresses[contractName] = contractInstance.address as string;
  writeContractAddresses(networkName, addresses);

  writeVerificationData(
    networkName,
    contractName,
    contractInstance.address as string,
    ctorParams
  );
  writeMigrationVerificationData(ctorParams, contractInstance.address);

  return contractInstance;
}

export const getBlockchainTimestamp = async (
  offset = 0
): Promise<BigNumber> => {
  const provider = ethers.providers.getDefaultProvider();
  const latestBlock = await provider.getBlock("latest");
  const now = (await provider.getBlock(latestBlock.number)).timestamp;
  return BigNumber.from(now + offset);
};

export function writeContractAddresses(
  network: string,
  contractAddresses: { [key: string]: string | null }
) {
  fs.writeFileSync(
    path.join(getConfigDir(), `${network}_contractAddresses.json`),
    JSON.stringify(contractAddresses, null, 4) // Indent 2 spaces
  );
}
