import { task, types } from "@nomiclabs/buidler/config";
import { eContractid } from "../../helpers/types";
import {
  deployCpmPriceProvider,
  registerContractInJsonDb,
  getMockToken,
  getMockFallbackOracle,
} from "../../helpers/helpers";
import { NULL_ADDRESS, ePriceDeviation } from "../../helpers/constants";

const { CpmPriceProvider } = eContractid;

task(`deploy-${CpmPriceProvider}`, `Deploys a ${CpmPriceProvider}`)
  .addParam(
    "cpm",
    "The address of the Constant Product Market contract",
    undefined,
    types.string
  )
  .addParam(
    "token",
    "The address of the token part of the CPM pair",
    undefined,
    types.string
  )
  .addParam(
    "tokenSymbol",
    "The symbol of the token part of the CPM pair, for db storage purposes",
    undefined,
    types.string
  )
  .addParam(
    "peggedToEth",
    "If the main subtoken is pegged to ETH, like sETH",
    undefined,
    types.boolean
  )
  .addParam(
    "priceDeviation",
    "max deviation cpm_price/chainlink_price allowed in the CpmPriceProvider before considering an attack ",
    undefined,
    types.string
  )
  .addParam(
    "tokenPriceProvider",
    "The address of the contract providing a price for the token side of the pair on the CPM, e.g. a Chainlink aggregator",
    undefined,
    types.string
  )
  .addParam(
    "fallbackOracle",
    "The address of the fallback oracle contract, providing a price for the token side of the pair on the CPM if the tokenPriceProvider fails",
    undefined,
    types.string
  )
  .addParam(
    "cpmTokenType",
    "The numeric type of the cpm token, 1 for a 2-sides token, like UNI",
    undefined,
    types.string
  )
  .addParam(
    "platformId",
    "The numeric type of the platform behind the Cpm token, 1 for Uniswap",
    undefined,
    types.string
  )
  .setAction(
    async (
      {
        cpm,
        token,
        tokenSymbol,
        peggedToEth,
        priceDeviation,
        tokenPriceProvider,
        fallbackOracle,
        cpmTokenType,
        platformId,
      },
      localBRE
    ) => {
      await localBRE.run("set-bre");

      console.log(`Deploying ${tokenSymbol}/ETH ${CpmPriceProvider}...\n`);

      const cpmPriceProvider = await deployCpmPriceProvider([
        cpm,
        token || (await getMockToken()).address,
        peggedToEth,
        parseInt(priceDeviation) || ePriceDeviation.LOW,
        tokenPriceProvider || NULL_ADDRESS,
        fallbackOracle || (await getMockFallbackOracle()).address,
        cpmTokenType,
        platformId,
      ]);

      await cpmPriceProvider.deployTransaction.wait();

      await registerContractInJsonDb(
        `${tokenSymbol}/ETH${CpmPriceProvider}`,
        cpmPriceProvider
      );

      return cpmPriceProvider;
    }
  );
