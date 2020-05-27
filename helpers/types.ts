import BigNumber from "bignumber.js";

export enum eEthereumNetwork {
  kovan = "kovan",
  ropsten = "ropsten",
  main = "main",
}

export enum eContractid {
  CpmPriceProvider = "CpmPriceProvider",
  MockCpm = "MockCpm",
  MockToken = "MockToken",
  MockFallbackOracle = "MockFallbackOracle",
  MockChainlinkAggregator = "MockChainlinkAggregator",
}

export type tEthereumAddress = string;

export type tStringCurrencyUnits = string; // ex. 2.5
export type tStringDecimalUnits = string; // ex 2500000000000000000
export type tBigNumberCurrencyUnits = BigNumber;
export type tBigNumberDecimalUnits = BigNumber;
