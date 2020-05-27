import { Contract, Signer, utils } from "ethers";
import { BuidlerRuntimeEnvironment } from "@nomiclabs/buidler/types";
import BigNumber from "bignumber.js";
import BN = require("bn.js");
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

import { tEthereumAddress, eContractid, tStringDecimalUnits } from "./types";
import { CpmPriceProvider } from "../types/CpmPriceProvider";
import { MockToken } from "../types/MockToken";
import { MockFallbackOracle } from "../types/MockFallbackOracle";
import { MockChainlinkAggregator } from "../types/MockChainlinkAggregator";
import { MockCpm } from "../types/MockCpm";

export let BRE: BuidlerRuntimeEnvironment = {} as BuidlerRuntimeEnvironment;
export const setBRE = (_BRE: BuidlerRuntimeEnvironment) => {
  BRE = _BRE;
};

export const getDb = () => low(new FileSync("./deployed-contracts.json"));

export const registerContractInJsonDb = async (
  contractId: string,
  contractInstance: Contract
) => {
  const currentNetwork = BRE.network.name;
  if (currentNetwork !== "buidlerevm") {
    console.log(`*** ${contractId} ***\n`);
    console.log(`Network: ${currentNetwork}`);
    console.log(`tx: ${contractInstance.deployTransaction.hash}`);
    console.log(`contract address: ${contractInstance.address}`);
    console.log(`deployer address: ${contractInstance.deployTransaction.from}`);
    console.log(`gas price: ${contractInstance.deployTransaction.gasPrice}`);
    console.log(`gas used: ${contractInstance.deployTransaction.gasLimit}`);
    console.log(`\n******`);
    console.log();
  }

  await getDb()
    .set(`${contractId}.${currentNetwork}`, {
      address: contractInstance.address,
      deployer: contractInstance.deployTransaction.from,
    })
    .write();
};

export const bnToBigNumber = (amount: BN): BigNumber =>
  new BigNumber(<any>amount);
export const stringToBigNumber = (amount: string): BigNumber =>
  new BigNumber(amount);

export const getEthersSigners = async (): Promise<Signer[]> =>
  await Promise.all(await BRE.ethers.signers());

export const getEthersSignersAddresses = async (): Promise<tEthereumAddress[]> =>
  await Promise.all(
    (await BRE.ethers.signers()).map((signer) => signer.getAddress())
  );

export const getCurrentBlock = async () => {
  return BRE.ethers.provider.getBlockNumber();
};

export const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const decodeAbiNumber = (data: string): number =>
  parseInt(utils.defaultAbiCoder.decode(["uint256"], data).toString());

const deployContract = async <ContractType extends Contract>(
  contractName: string,
  args: any[]
): Promise<ContractType> =>
  (await (await BRE.ethers.getContract(contractName)).deploy(
    ...args
  )) as ContractType;

const getContract = async <ContractType extends Contract>(
  contractName: string,
  address: string
): Promise<ContractType> =>
  (await (await BRE.ethers.getContract(contractName)).attach(
    address
  )) as ContractType;

export const deployCpmPriceProvider = async ([
  cpm,
  token,
  peggedToEth,
  priceDeviation,
  tokenPriceProvider,
  fallbackOracle,
  cpmTokenType,
  platformId,
]: [
  tEthereumAddress,
  tEthereumAddress,
  boolean,
  number,
  tEthereumAddress,
  tEthereumAddress,
  number,
  number
]) =>
  await deployContract<CpmPriceProvider>(eContractid.CpmPriceProvider, [
    cpm,
    token,
    peggedToEth,
    priceDeviation,
    tokenPriceProvider,
    fallbackOracle,
    cpmTokenType,
    platformId,
  ]);

export const deployMockToken = async ([name, symbol, decimals]: [
  string,
  string,
  number
]) =>
  await deployContract<MockToken>(eContractid.MockToken, [
    name,
    symbol,
    decimals,
  ]);

export const deployMockChainlinkAggregator = async ([mockPrice]: [
  tStringDecimalUnits
]) =>
  await deployContract<MockChainlinkAggregator>(
    eContractid.MockChainlinkAggregator,
    [mockPrice]
  );

export const deployMockFallbackOracle = async ([mockPrice]: [
  tStringDecimalUnits
]) =>
  await deployContract<MockFallbackOracle>(eContractid.MockFallbackOracle, [
    mockPrice,
  ]);

export const deployMockCpm = async () =>
  await deployContract<MockCpm>(eContractid.MockCpm, []);

export const getCpm = async (
  address?: tEthereumAddress,
  pairSymbol?: string
) => {
  return await getContract<MockCpm>(
    eContractid.MockCpm,
    address ||
      (
        await getDb()
          .get(`${pairSymbol}${eContractid.MockCpm}.${BRE.network.name}`)
          .value()
      ).address
  );
};

export const getCpmPriceProvider = async (address?: tEthereumAddress) => {
  return await getContract<CpmPriceProvider>(
    eContractid.CpmPriceProvider,
    address ||
      (
        await getDb()
          .get(`${eContractid.CpmPriceProvider}.${BRE.network.name}`)
          .value()
      ).address
  );
};

export const getMockToken = async (address?: tEthereumAddress) => {
  return await getContract<MockToken>(
    eContractid.MockToken,
    address ||
      (
        await getDb()
          .get(`${eContractid.MockToken}.${BRE.network.name}`)
          .value()
      ).address
  );
};

export const getMockFallbackOracle = async (address?: tEthereumAddress) => {
  return await getContract<MockFallbackOracle>(
    eContractid.MockFallbackOracle,
    address ||
      (
        await getDb()
          .get(`${eContractid.MockFallbackOracle}.${BRE.network.name}`)
          .value()
      ).address
  );
};

export const getMockChainlinkAggregator = async (
  address?: tEthereumAddress
) => {
  return await getContract<MockChainlinkAggregator>(
    eContractid.MockChainlinkAggregator,
    address ||
      (
        await getDb()
          .get(`${eContractid.MockChainlinkAggregator}.${BRE.network.name}`)
          .value()
      ).address
  );
};
