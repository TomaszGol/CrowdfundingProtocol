import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "hardhat-contract-sizer";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  contractSizer: {
    runOnCompile: true,
    strict: true,
  },
  networks: {
    bnbt: {
      url: process.env.BSCT_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    ganache: {
      url: process.env.GANACHE_URL || "",
      accounts: process.env.GANACHE_PRIVATE_KEY
        ? [process.env.GANACHE_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey: process.env.BNB_API_KEY || "",
  },
};

export default config;
