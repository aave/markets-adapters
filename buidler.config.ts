import { usePlugin, BuidlerConfig } from "@nomiclabs/buidler/config";
import path from "path";
import fs from "fs";
// @ts-ignore
import { accounts } from "./test-wallets.js";
import { eEthereumNetwork } from "./helpers/types";

usePlugin("@nomiclabs/buidler-ethers");
usePlugin("buidler-typechain");
usePlugin("@nomiclabs/buidler-waffle");

["misc", "deployments", "migrations"].forEach((folder) => {
  const tasksPath = path.join(__dirname, "tasks", folder);
  fs.readdirSync(tasksPath).forEach((task) => require(`${tasksPath}/${task}`));
});

const DEFAULT_BLOCK_GAS_LIMIT = 9500000;
const DEFAULT_GAS_PRICE = 10;
const INFURA_KEY = "";
const MNEMONICS: { [network: string]: string } = {
  [eEthereumNetwork.kovan]: "",
  [eEthereumNetwork.ropsten]: "",
  [eEthereumNetwork.main]: "",
};

const config: BuidlerConfig = {
  solc: {
    version: "0.6.6",
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "istanbul",
  },
  typechain: {
    outDir: "types",
    target: "ethers",
  },
  defaultNetwork: "buidlerevm",
  mocha: {
    enableTimeouts: false,
  },
  networks: {
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_KEY}`,
      hardfork: "istanbul",
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gasMultiplier: DEFAULT_GAS_PRICE,
      chainId: 42,
      accounts: {
        mnemonic: MNEMONICS.kovan,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_KEY}`,
      hardfork: "istanbul",
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gasMultiplier: DEFAULT_GAS_PRICE,
      chainId: 3,
      accounts: {
        mnemonic: MNEMONICS.ropsten,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    main: {
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      hardfork: "istanbul",
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gasMultiplier: DEFAULT_GAS_PRICE,
      chainId: 1,
      accounts: {
        mnemonic: MNEMONICS.main,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    buidlerevm: {
      hardfork: "istanbul",
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: 8000000000,
      chainId: 31337,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts: accounts.map(
        ({ secretKey, balance }: { secretKey: string; balance: string }) => ({
          privateKey: secretKey,
          balance,
        })
      ),
    },
  },
};

export default config;
