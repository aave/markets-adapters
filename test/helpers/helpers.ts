import { deployContract } from "ethereum-waffle";
import CpmPriceProviderArtifact from "../../artifacts/CpmPriceProvider.json";
import MockTokenArtifact from "../../artifacts/MockToken.json";
import MockFallbackOracleArtifact from "../../artifacts/MockFallbackOracle.json";
import MockChainlinkAggregatorArtifact from "../../artifacts/MockChainlinkAggregator.json";
import CpmExchangeArtifact from "../../artifacts/MockCpm.json";
import { CpmPriceProvider } from "../../types/CpmPriceProvider";
import { MockToken } from "../../types/MockToken";
import { MockFallbackOracle } from "../../types/MockFallbackOracle";
import { MockChainlinkAggregator } from "../../types/MockChainlinkAggregator";
import { MockCpm as CpmExchange } from "../../types/MockCpm";
import { BigNumber as EthersBigNumber } from "ethers/utils";
import BigNumber from "bignumber.js";
import { tStringDecimalUnits } from "../../helpers/types";
import { Wallet } from "ethers";

export const WAD = Math.pow(10, 18).toString();

export const toWad = (value: string | number) =>
  new BigNumber(value).times(WAD).toFixed();

export interface iContractsEnv {
  cpm: CpmExchange;
  token: MockToken;
  chainlinkAggregator: MockChainlinkAggregator;
  fallbackOracle: MockFallbackOracle;
  cpmPriceProvider: CpmPriceProvider;
}

export const initContractsEnv = async (
  aggregatorPrice: tStringDecimalUnits,
  fallbackPrice: tStringDecimalUnits,
  cpmEthBalance: tStringDecimalUnits,
  cpmTokenBalance: tStringDecimalUnits,
  tokenDecimals: number,
  peggedToEth: boolean,
  priceDeviation: number,
  cpmTokenType: number,
  platformId: number,
  wallet: Wallet
): Promise<iContractsEnv> => {
  const token = (await deployContract(wallet, MockTokenArtifact, [
    "Dai Stablecoin",
    "DAI",
    tokenDecimals,
  ])) as MockToken;
  const chainlinkAggregator = (await deployContract(
    wallet,
    MockChainlinkAggregatorArtifact,
    [aggregatorPrice]
  )) as MockChainlinkAggregator;
  const fallbackOracle = (await deployContract(
    wallet,
    MockFallbackOracleArtifact,
    [fallbackPrice]
  )) as MockFallbackOracle;

  const cpm = (await deployContract(
    wallet,
    CpmExchangeArtifact
  )) as CpmExchange;
  await cpm.setup(token.address);
  const cpmPriceProvider = (await deployContract(
    wallet,
    CpmPriceProviderArtifact,
    [
      cpm.address,
      token.address,
      peggedToEth,
      priceDeviation,
      chainlinkAggregator.address,
      fallbackOracle.address,
      cpmTokenType,
      platformId,
    ]
  )) as CpmPriceProvider;

  await token.mint(cpmTokenBalance);
  await token.approve(cpm.address, cpmTokenBalance);
  await cpm.addLiquidity("0", cpmTokenBalance, "9999999999", {
    value: new EthersBigNumber(cpmEthBalance),
  });

  return {
    cpm,
    token,
    chainlinkAggregator,
    fallbackOracle,
    cpmPriceProvider,
  };
};
