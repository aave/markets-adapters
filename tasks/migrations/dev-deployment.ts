import { expect } from "chai";
import { task } from "@nomiclabs/buidler/config";
import { eContractid } from "../../helpers/types";
import {
  deployMockToken,
  deployMockChainlinkAggregator,
  deployMockFallbackOracle,
  deployMockCpm,
} from "../../helpers/helpers";
import { BigNumber as EthersBigNumber } from "ethers/utils";
import { BuidlerRuntimeEnvironment } from "@nomiclabs/buidler/types";
import { CpmPriceProvider } from "../../types/CpmPriceProvider";
import {
  COMPLEX_TOKEN_TYPE,
  UNISWAP_PLATFORM_ID,
  ePriceDeviation,
} from "../../helpers/constants";

task(
  "dev-deployment",
  "Deployment in dev testnet of all the contracts"
).setAction(async (_, localBRE) => {
  const BRE: BuidlerRuntimeEnvironment = await localBRE.run("set-bre");

  const token = await deployMockToken(["Dai Stablecoin", "DAI", 18]);

  const chainlinkAggregator = await deployMockChainlinkAggregator([
    "5876069471276550",
  ]);
  const fallbackOracle = await deployMockFallbackOracle(["6876069471276550"]);

  const cpm = await deployMockCpm();
  await cpm.setup(token.address);

  const initialEthBalance = "18515375352874242182785";
  const initialTokenBalance = "3150862437895467206455727";

  await token.mint(initialTokenBalance);
  await token.approve(cpm.address, initialTokenBalance);
  await cpm.addLiquidity("0", initialTokenBalance, "9999999999", {
    value: new EthersBigNumber(initialEthBalance),
  });

  const cpmPriceProvider: CpmPriceProvider = await BRE.run(
    `deploy-${eContractid.CpmPriceProvider}`,
    {
      cpm: cpm.address,
      token: token.address,
      tokenSymbol: await token.symbol(),
      peggedToEth: false,
      priceDeviation: ePriceDeviation.LOW,
      tokenPriceProvider: chainlinkAggregator.address,
      fallbackOracle: fallbackOracle.address,
      cpmTokenType: COMPLEX_TOKEN_TYPE.MULTISIDE,
      platformId: UNISWAP_PLATFORM_ID,
    }
  );

  expect((await cpmPriceProvider.latestAnswer()).toString()).to.equal(
    "1999962799924303132",
    "FAILED_DEPLOYMENT. The price returned is not correct"
  );
});
