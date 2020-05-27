import BRE from "@nomiclabs/buidler";
import { expect } from "chai";
import { MockProvider } from "ethereum-waffle";
import { CpmPriceProvider } from "../types/CpmPriceProvider";
import { MockToken } from "../types/MockToken";
import { MockFallbackOracle } from "../types/MockFallbackOracle";
import { MockChainlinkAggregator } from "../types/MockChainlinkAggregator";
import { MockCpm as CpmExchange } from "../types/MockCpm";
import { BigNumber as EthersBigNumber } from "ethers/utils";
import BigNumber from "bignumber.js";
import { tStringCurrencyUnits } from "../helpers/types";
import {
  COMPLEX_TOKEN_TYPE,
  UNISWAP_PLATFORM_ID,
  ePriceDeviation,
} from "../helpers/constants";
import { WAD, toWad, initContractsEnv } from "./helpers/helpers";

export const getUniswapEthBalance = async (cpm: CpmExchange) =>
  new BigNumber((await cpm.provider.getBalance(cpm.address)).toString())
    .dividedBy(WAD)
    .toFixed();

export const getUniswapTokenBalance = async (
  cpm: CpmExchange,
  token: MockToken
) =>
  new BigNumber(await (await token.balanceOf(cpm.address)).toString())
    .dividedBy(Math.pow(10, await token.decimals()))
    .toFixed();

export const getTokenToEthUniswapPrice = async (
  cpm: CpmExchange,
  token: MockToken
) =>
  new BigNumber(
    (
      await cpm.getTokenToEthInputPrice(
        Math.pow(10, await token.decimals()).toFixed()
      )
    ).toString()
  )
    .dividedBy(WAD)
    .toFixed();

export const getEthToTokenUniswapPrice = async (
  cpm: CpmExchange,
  token: MockToken
) =>
  new BigNumber((await cpm.getEthToTokenInputPrice(WAD)).toString())
    .dividedBy(Math.pow(10, await token.decimals()))
    .toFixed();

export const getTokenToEthChainlinkPrice = async (
  chainlinkAggregator: MockChainlinkAggregator
) =>
  new BigNumber((await chainlinkAggregator.latestAnswer()).toString())
    .dividedBy(WAD)
    .toFixed();

export const logCpmBalances = async (cpm: CpmExchange, token: MockToken) => {
  console.log(
    `

  ----- BALANCES -----
  ${await getUniswapEthBalance(cpm)} ETH
  ${await getUniswapTokenBalance(cpm, token)} Token
  --------------------

  `
  );
};

export const logPricesInCpm = async (
  cpm: CpmExchange,
  token: MockToken,
  chainlinkAggregator: MockChainlinkAggregator
) => {
  console.log(
    `

  ----- PRICES -----
  ${await getEthToTokenUniswapPrice(cpm, token)} ETH/Token in CPM
  ${await getTokenToEthUniswapPrice(cpm, token)} Token/ETH in CPM
  ${await getTokenToEthChainlinkPrice(
    chainlinkAggregator
  )} Token/ETH in Chainlink
  --------------------

  `
  );
};

export const logCpmPriceProviderPrice = async (
  cpmPriceProvider: CpmPriceProvider
) => {
  console.log(
    `${new BigNumber((await cpmPriceProvider.latestAnswer()).toString())
      .dividedBy(WAD)
      .toFixed()}`
  );
};

export const swapTokenToEth = async (
  tokenAmountToSwap: tStringCurrencyUnits,
  token: MockToken,
  cpm: CpmExchange
) => {
  // console.log(
  //   `
  // > Swapping ${tokenAmountToSwap} token to ETH
  // `
  // );
  const tokenDecimalsAmountToSwap = new BigNumber(tokenAmountToSwap)
    .multipliedBy(Math.pow(10, await token.decimals()))
    .toFixed();

  await token.mint(tokenDecimalsAmountToSwap);
  await token.approve(cpm.address, tokenDecimalsAmountToSwap);
  return await (
    await cpm.tokenToEthSwapInput(
      tokenDecimalsAmountToSwap,
      "1",
      "999999999999"
    )
  ).wait();
};

export const swapEthToToken = async (
  ethAmountToSwap: tStringCurrencyUnits,
  cpm: CpmExchange
) => {
  // console.log(`> Swapping ${ethAmountToSwap} ETH to token`);
  return await (
    await cpm.ethToTokenSwapInput("1", "999999999999", {
      value: new EthersBigNumber(toWad(ethAmountToSwap)),
    })
  ).wait();
};

interface iLatestAnswerState {
  chainlinkPrice: BigNumber;
  uniswapPrice: BigNumber;
  uniswapWeiBalance: BigNumber;
  uniswapTokenBalanceInDecimalUnits: BigNumber;
  normalizedTokenBalanceInDecimalUnits: BigNumber;
  K: BigNumber;
  normalizedWeiBalance: BigNumber;
  oraclePrice: BigNumber;
}

export const predictLatestAnswer = async (
  cpm: CpmExchange,
  token: MockToken,
  chainlinkAggregator: MockChainlinkAggregator
): Promise<iLatestAnswerState> => {
  const tokenDecimals = await token.decimals();
  const cpmSupply = new BigNumber((await cpm.totalSupply()).toString());
  const chainlinkPrice = new BigNumber(
    (await chainlinkAggregator.latestAnswer()).toString()
  );

  const uniswapPrice = new BigNumber(
    (
      await cpm.getTokenToEthInputPrice(Math.pow(10, tokenDecimals).toFixed())
    ).toString()
  );
  const uniswapWeiBalance = new BigNumber(
    (await cpm.provider.getBalance(cpm.address)).toString()
  );
  const uniswapTokenBalanceInDecimalUnits = new BigNumber(
    (await token.balanceOf(cpm.address)).toString()
  );
  const K = new BigNumber(uniswapWeiBalance).multipliedBy(
    uniswapTokenBalanceInDecimalUnits
  );

  const normalizedTokenBalanceInDecimalUnits = K.div(chainlinkPrice)
    .multipliedBy(Math.pow(10, tokenDecimals).toFixed())
    .squareRoot();
  const normalizedWeiBalance = K.div(normalizedTokenBalanceInDecimalUnits);

  const oraclePrice = normalizedWeiBalance
    .plus(
      normalizedTokenBalanceInDecimalUnits
        .multipliedBy(chainlinkPrice)
        .dividedBy(Math.pow(10, tokenDecimals))
    )
    .multipliedBy(WAD)
    .dividedBy(cpmSupply);

  return {
    chainlinkPrice,
    uniswapPrice,
    uniswapWeiBalance,
    uniswapTokenBalanceInDecimalUnits,
    K,
    normalizedTokenBalanceInDecimalUnits,
    normalizedWeiBalance,
    oraclePrice,
  };
};

const expectCorrectDeviations = (
  oraclePriceFromPriceProvider: BigNumber,
  oraclePriceBeforeImbalance: BigNumber,
  predictedOraclePrice: BigNumber,
  ethPriceInUniswapBeforeSwaps: BigNumber,
  ethPriceInUniswapAfterSwaps: BigNumber,
  oracleDeviation: BigNumber,
  ethPriceDeviation: BigNumber
) => {
  // Checks that the price calculated by the CpmPriceProvider on an imbalanced situation is withing
  // a range of deviation with the price before the imbalance situation appears
  expect(
    oraclePriceFromPriceProvider
      .minus(oraclePriceBeforeImbalance)
      .gte(oracleDeviation.negated()) &&
      oraclePriceFromPriceProvider
        .minus(oraclePriceBeforeImbalance)
        .lt(oracleDeviation),
    "INVALID_DEVIATION_WITH_PRICE_BEFORE_IMBALANCE"
  ).to.be.true;

  // Checks the price predicted offchain is within a range of deviation with the price given by the CpmPriceProvider
  expect(
    oraclePriceFromPriceProvider.minus(predictedOraclePrice).gte(toWad(-1)) &&
      oraclePriceFromPriceProvider.minus(predictedOraclePrice).lt(toWad(1)),
    "INVALID_DEVIATION_WITH_PREDICTED_PRICE"
  ).to.be.true;

  // Checks that, after doing a second swap that applies the correction of balances on an imbalanced situation,
  // the price of eth/token in the CPM is within a range of deviation with the price of eth/token before the imbalanced
  expect(
    ethPriceInUniswapBeforeSwaps
      .div(ethPriceInUniswapAfterSwaps)
      .gte(new BigNumber(1).minus(ethPriceDeviation)) &&
      ethPriceInUniswapBeforeSwaps
        .div(ethPriceInUniswapAfterSwaps)
        .lt(new BigNumber(1).plus(ethPriceDeviation)),
    "INVALID_DEVIATION_BETWEEN_INITIAL_PRICE_AND_AFTER_SWAPS"
  ).to.be.true;
};

describe("CpmPriceProvider", () => {
  const [wallet] = new MockProvider().getWallets();
  const DAI_PRICE_CHAINLINK = "5354890000000000";
  const DAI_PRICE_IN_FALLBACK = "5555550000000000";
  const ETH_BALANCE_DAI_CPM = "19459612149632905006122";
  const TOKEN_BALANCE_DAI_CPM = "3648060747043017549501706";
  const MAX_ORACLE_DEVIATION = new BigNumber(toWad(0.003));
  const MAX_ETH_PRICE_DEVIATION = new BigNumber(1);
  const USDC_PRICE_CHAINLINK = "5334345527735212";
  const USDC_PRICE_IN_FALLBACK = "5666666666666666";
  const ETH_BALANCE_USDC_CPM = "15981699179254027962737";
  const TOKEN_BALANCE_USDC_CPM = "2997928101120";

  before(async () => {
    await BRE.run("set-bre");
  });

  it("CPM: UNIV1 DAI/ETH. Price source: CHAINLINK. Deviation: NO_DEVIATION", async () => {
    const { cpmPriceProvider } = await initContractsEnv(
      DAI_PRICE_CHAINLINK,
      DAI_PRICE_IN_FALLBACK,
      ETH_BALANCE_DAI_CPM,
      TOKEN_BALANCE_DAI_CPM,
      18,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );

    expect((await cpmPriceProvider.latestAnswer()).toString()).to.equal(
      "2003872218188156474"
    );
  });

  it("CPM: UNIV1 DAI/ETH. Price source: FALLBACK. Deviation: NO_DEVIATION", async () => {
    const { cpmPriceProvider } = await initContractsEnv(
      "0",
      DAI_PRICE_IN_FALLBACK,
      ETH_BALANCE_DAI_CPM,
      TOKEN_BALANCE_DAI_CPM,
      18,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );

    expect((await cpmPriceProvider.latestAnswer()).toString()).to.equal(
      "2041067966294721303"
    );
  });

  it("CPM: UNIV1 DAI/ETH. Price source: NONE. Deviation: NO_DEVIATION", async () => {
    const { cpmPriceProvider } = await initContractsEnv(
      "0",
      "0",
      ETH_BALANCE_DAI_CPM,
      TOKEN_BALANCE_DAI_CPM,
      18,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );

    expect((await cpmPriceProvider.latestAnswer()).toString()).to.equal("0");
  });

  it("CPM: UNIV1 USDC/ETH. Price source: CHAINLINK. Deviation: NO_DEVIATION", async () => {
    const { cpmPriceProvider } = await initContractsEnv(
      USDC_PRICE_CHAINLINK,
      USDC_PRICE_IN_FALLBACK,
      ETH_BALANCE_USDC_CPM,
      TOKEN_BALANCE_USDC_CPM,
      6,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );

    expect((await cpmPriceProvider.latestAnswer()).toString()).to.equal(
      "2000643559818752671"
    );
  });

  it("CPM: UNIV1 USDC/ETH. Price source: FALLBACK. Deviation: NO_DEVIATION", async () => {
    const { cpmPriceProvider } = await initContractsEnv(
      "0",
      USDC_PRICE_IN_FALLBACK,
      ETH_BALANCE_USDC_CPM,
      TOKEN_BALANCE_USDC_CPM,
      6,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );

    expect((await cpmPriceProvider.latestAnswer()).toString()).to.equal(
      "2062020409907475977"
    );
  });

  it("CPM: UNIV1 SETH/ETH. Price source: NOT USED. Deviation: NO_DEVIATION", async () => {
    const { cpmPriceProvider } = await initContractsEnv(
      "0",
      "0",
      "14666310396622461599163",
      "14666310396622461599163",
      18,
      true,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );

    expect((await cpmPriceProvider.latestAnswer()).toString()).to.equal(
      "2000000000000000000"
    );
  });

  it("CPM: generic with token price higher than ETH. Price source: CHAINLINK. Deviation: NO_DEVIATION", async () => {
    const { cpmPriceProvider } = await initContractsEnv(
      toWad("1.5"),
      "0",
      WAD,
      WAD,
      18,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );

    expect((await cpmPriceProvider.latestAnswer()).toString()).to.equal(
      "2449489742783178098"
    );
  });

  it("CPM: UNIV1 DAI/ETH. Price source: CHAINLINK. Deviation: WITH_PREVIOUS_SWAP_ETH_TOKEN", async () => {
    const {
      cpmPriceProvider,
      cpm,
      token,
      chainlinkAggregator,
    } = await initContractsEnv(
      DAI_PRICE_CHAINLINK,
      DAI_PRICE_IN_FALLBACK,
      ETH_BALANCE_DAI_CPM,
      TOKEN_BALANCE_DAI_CPM,
      18,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );
    const amountToSwap: tStringCurrencyUnits = "50000";
    const oraclePriceBeforeImbalance = new BigNumber(
      (await cpmPriceProvider.latestAnswer()).toString()
    );
    const ethPriceInUniswapBeforeSwaps = new BigNumber(
      (await cpm.getEthToTokenInputPrice(WAD)).toString()
    ).dividedBy(Math.pow(10, await token.decimals()));

    await swapEthToToken(amountToSwap, cpm);
    const {
      oraclePrice: predictedOraclePrice,
      normalizedTokenBalanceInDecimalUnits,
      uniswapTokenBalanceInDecimalUnits,
    } = await predictLatestAnswer(cpm, token, chainlinkAggregator);

    const oraclePriceFromPriceProvider = new BigNumber(
      (await cpmPriceProvider.latestAnswer()).toString()
    );

    await swapTokenToEth(
      normalizedTokenBalanceInDecimalUnits
        .minus(uniswapTokenBalanceInDecimalUnits)
        .dividedBy(Math.pow(10, await token.decimals()))
        .toFixed(0),
      token,
      cpm
    );

    const ethPriceInUniswapAfterSwaps = new BigNumber(
      (await cpm.getEthToTokenInputPrice(WAD)).toString()
    ).dividedBy(Math.pow(10, await token.decimals()));

    expectCorrectDeviations(
      oraclePriceFromPriceProvider,
      oraclePriceBeforeImbalance,
      predictedOraclePrice,
      ethPriceInUniswapBeforeSwaps,
      ethPriceInUniswapAfterSwaps,
      MAX_ORACLE_DEVIATION,
      MAX_ETH_PRICE_DEVIATION
    );
  });

  it("CPM: UNIV1 USDC/ETH. Price source: CHAINLINK. Deviation: WITH_PREVIOUS_SWAP_ETH_TOKEN", async () => {
    const {
      cpmPriceProvider,
      cpm,
      token,
      chainlinkAggregator,
    } = await initContractsEnv(
      USDC_PRICE_CHAINLINK,
      USDC_PRICE_IN_FALLBACK,
      ETH_BALANCE_USDC_CPM,
      TOKEN_BALANCE_USDC_CPM,
      6,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );
    const amountToSwap: tStringCurrencyUnits = "42000";
    const oraclePriceBeforeImbalance = new BigNumber(
      (await cpmPriceProvider.latestAnswer()).toString()
    );
    const ethPriceInUniswapBeforeSwaps = new BigNumber(
      (await cpm.getEthToTokenInputPrice(WAD)).toString()
    ).dividedBy(Math.pow(10, await token.decimals()));

    await swapEthToToken(amountToSwap, cpm);
    const {
      oraclePrice: predictedOraclePrice,
      normalizedTokenBalanceInDecimalUnits,
      uniswapTokenBalanceInDecimalUnits,
    } = await predictLatestAnswer(cpm, token, chainlinkAggregator);

    const oraclePriceFromPriceProvider = new BigNumber(
      (await cpmPriceProvider.latestAnswer()).toString()
    );

    await swapTokenToEth(
      normalizedTokenBalanceInDecimalUnits
        .minus(uniswapTokenBalanceInDecimalUnits)
        .dividedBy(Math.pow(10, await token.decimals()))
        .toFixed(0),
      token,
      cpm
    );

    const ethPriceInUniswapAfterSwaps = new BigNumber(
      (await cpm.getEthToTokenInputPrice(WAD)).toString()
    ).dividedBy(Math.pow(10, await token.decimals()));

    expectCorrectDeviations(
      oraclePriceFromPriceProvider,
      oraclePriceBeforeImbalance,
      predictedOraclePrice,
      ethPriceInUniswapBeforeSwaps,
      ethPriceInUniswapAfterSwaps,
      MAX_ORACLE_DEVIATION,
      MAX_ETH_PRICE_DEVIATION
    );
  });

  it("CPM: UNIV1 DAI/ETH. Price source: CHAINLINK. Deviation: WITH_PREVIOUS_SWAP_TOKEN_ETH", async () => {
    const {
      cpmPriceProvider,
      cpm,
      token,
      chainlinkAggregator,
    } = await initContractsEnv(
      DAI_PRICE_CHAINLINK,
      DAI_PRICE_IN_FALLBACK,
      ETH_BALANCE_DAI_CPM,
      TOKEN_BALANCE_DAI_CPM,
      18,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );
    const amountToSwap: tStringCurrencyUnits = "2500000";
    const oraclePriceBeforeImbalance = new BigNumber(
      (await cpmPriceProvider.latestAnswer()).toString()
    );
    const ethPriceInUniswapBeforeSwaps = new BigNumber(
      (await cpm.getEthToTokenInputPrice(WAD)).toString()
    ).dividedBy(Math.pow(10, await token.decimals()));

    await swapTokenToEth(amountToSwap, token, cpm);

    const {
      oraclePrice: predictedOraclePrice,
      normalizedWeiBalance,
      uniswapWeiBalance,
    } = await predictLatestAnswer(cpm, token, chainlinkAggregator);

    const oraclePriceFromPriceProvider = new BigNumber(
      (await cpmPriceProvider.latestAnswer()).toString()
    );

    await swapEthToToken(
      normalizedWeiBalance
        .minus(uniswapWeiBalance)
        .dividedBy(WAD)
        .toFixed(0),
      cpm
    );

    const ethPriceInUniswapAfterSwaps = new BigNumber(
      (await cpm.getEthToTokenInputPrice(WAD)).toString()
    ).dividedBy(Math.pow(10, await token.decimals()));

    expectCorrectDeviations(
      oraclePriceFromPriceProvider,
      oraclePriceBeforeImbalance,
      predictedOraclePrice,
      ethPriceInUniswapBeforeSwaps,
      ethPriceInUniswapAfterSwaps,
      MAX_ORACLE_DEVIATION,
      MAX_ETH_PRICE_DEVIATION
    );
  });

  it("CPM: UNIV1 USDC/ETH. Price source: CHAINLINK. Deviation: WITH_PREVIOUS_SWAP_TOKEN_ETH", async () => {
    const {
      cpmPriceProvider,
      cpm,
      token,
      chainlinkAggregator,
    } = await initContractsEnv(
      USDC_PRICE_CHAINLINK,
      USDC_PRICE_IN_FALLBACK,
      ETH_BALANCE_USDC_CPM,
      TOKEN_BALANCE_USDC_CPM,
      6,
      false,
      ePriceDeviation.LOW,
      COMPLEX_TOKEN_TYPE.MULTISIDE,
      UNISWAP_PLATFORM_ID,
      wallet
    );
    const amountToSwap: tStringCurrencyUnits = "2000000";
    const oraclePriceBeforeImbalance = new BigNumber(
      (await cpmPriceProvider.latestAnswer()).toString()
    );
    const ethPriceInUniswapBeforeSwaps = new BigNumber(
      (await cpm.getEthToTokenInputPrice(WAD)).toString()
    ).dividedBy(Math.pow(10, await token.decimals()));

    await swapTokenToEth(amountToSwap, token, cpm);

    const {
      oraclePrice: predictedOraclePrice,
      normalizedWeiBalance,
      uniswapWeiBalance,
    } = await predictLatestAnswer(cpm, token, chainlinkAggregator);

    const oraclePriceFromPriceProvider = new BigNumber(
      (await cpmPriceProvider.latestAnswer()).toString()
    );

    await swapEthToToken(
      normalizedWeiBalance
        .minus(uniswapWeiBalance)
        .dividedBy(WAD)
        .toFixed(0),
      cpm
    );

    const ethPriceInUniswapAfterSwaps = new BigNumber(
      (await cpm.getEthToTokenInputPrice(WAD)).toString()
    ).dividedBy(Math.pow(10, await token.decimals()));

    expectCorrectDeviations(
      oraclePriceFromPriceProvider,
      oraclePriceBeforeImbalance,
      predictedOraclePrice,
      ethPriceInUniswapBeforeSwaps,
      ethPriceInUniswapAfterSwaps,
      MAX_ORACLE_DEVIATION,
      MAX_ETH_PRICE_DEVIATION
    );
  });
});
