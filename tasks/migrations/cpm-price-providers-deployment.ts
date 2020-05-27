import { task } from "@nomiclabs/buidler/config";
import { BuidlerRuntimeEnvironment } from "@nomiclabs/buidler/types";
import {
  fallbackOracles,
  chainlinkAggregators,
  cpmPairs,
  tokensWithAddresses,
  cpmPriceProviderConfigs,
} from "../../helpers/constants";
import { getCpm } from "../../helpers/helpers";
import { eContractid } from "../../helpers/types";

task(
  "cpm-price-providers-deployment",
  "Deployment of all the price provider of CPMs"
).setAction(async (_, localBRE) => {
  const BRE: BuidlerRuntimeEnvironment = await localBRE.run("set-bre");
  const network = BRE.network.name;

  const tokenPriceProviders = chainlinkAggregators[network];
  if (!tokenPriceProviders) {
    throw new Error(
      `Chainlink aggregators on ${network} not properly configured`
    );
  }
  const fallbackOracle = fallbackOracles[network];
  if (!fallbackOracle) {
    throw new Error(`Fallbac oracle on ${network} not properly configured`);
  }

  if (!tokensWithAddresses[network]) {
    throw Error(`${network} not properly configured`);
  }

  for (const pair of cpmPairs) {
    const tokenSymbol = pair.split("/")[0];
    const cpm = (await getCpm(undefined, pair)).address;
    if (!cpm) {
      throw new Error(`Not found address for ${pair} pair on ${network}`);
    }

    const token = tokensWithAddresses[network].find(
      (e) => e[0] === tokenSymbol
    );
    if (!token) {
      throw new Error(
        `Not found address for ${tokenSymbol} token on ${network}`
      );
    }
    const cpmPriceProviderConfig = cpmPriceProviderConfigs[tokenSymbol];
    if (!cpmPriceProviderConfig) {
      throw new Error(`Not found config for ${pair} pair on ${network}`);
    }

    await BRE.run(`deploy-${eContractid.CpmPriceProvider}`, {
      cpm,
      token: token[1],
      tokenSymbol,
      fallbackOracle,
      tokenPriceProvider: tokenPriceProviders[tokenSymbol],
      ...cpmPriceProviderConfigs[tokenSymbol],
    });
  }
});
