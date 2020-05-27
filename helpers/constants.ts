import { eEthereumNetwork, tEthereumAddress } from "./types";

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

// Default max deviation cpm_price/chainlink_price allowed in the CpmPriceProvider before
// considering an attack 
export enum ePriceDeviation {
  LOW = 30, // 3%
  HIGH = 40 // 4%
}

export const cpmPairs = [
  "DAI/ETH",
  "USDC/ETH",
  "sETH/ETH",
  "LINK/ETH",
  "LEND/ETH",
  "MKR/ETH",
];

export const tokensWithAddresses = {
  [eEthereumNetwork.kovan.toString()]: [
    ["DAI", "0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD"],
    ["USDC", "0xe22da380ee6B445bb8273C81944ADEB6E8450422"],
    ["sETH", "0x40253d9c58c3d15b7709eaf2816feaea31abf725"],
    ["LINK", "0xAD5ce863aE3E4E9394Ab43d4ba0D80f419F61789"],
    ["LEND", "0x1BCe8A0757B7315b74bA1C7A731197295ca4747a"],
    ["MKR", "0x61e4CAE3DA7FD189e52a4879C7B8067D7C2Cc0FA"],
  ],
  [eEthereumNetwork.ropsten.toString()]: [
    ["DAI", "0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108"],
    ["USDC", "0x851dEf71f0e6A903375C1e536Bd9ff1684BAD802"],
    ["sETH", "0x2709bca0Ac821dA5E7F649544F70F95E574898F1"],
    ["LINK", "0x1a906E71FF9e28d8E01460639EB8CF0a6f0e2486"],
    ["LEND", "0x217b896620AfF6518B9862160606695607A63442"],
    ["MKR", "0x2eA9df3bABe04451c9C3B06a2c844587c59d9C37"],
  ],
  [eEthereumNetwork.main.toString()]: [
    ["DAI", "0x6b175474e89094c44da98b954eedeac495271d0f"],
    ["USDC", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
    ["sETH", "0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb"],
    ["LINK", "0x514910771af9ca656af840dff83e8264ecf986ca"],
    ["LEND", "0x80fB784B7eD66730e8b1DBd9820aFD29931aab03"],
    ["MKR", "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2"],
  ],
};

export const UNISWAP_PLATFORM_ID = 2;
export enum COMPLEX_TOKEN_TYPE {
  NONE,
  SINGLESIDE,
  MULTISIDE,
}

export const fallbackOracles = {
  [eEthereumNetwork.kovan.toString()]: "0x50913E8E1c650E790F8a1E741FF9B1B1bB251dfe",
  [eEthereumNetwork.ropsten.toString()]: "0xAD1a978cdbb8175b2eaeC47B01404f8AEC5f4F0d",
  [eEthereumNetwork.main.toString()]: "0xd6d88f2eba3d9a27b24bf77932fdeb547b93df58",
};

export interface iTokenWithAddressByNetwork {
  [network: string]: iTokenWithAddress;
}

export interface iTokenWithAddress {
  [tokenSymbol: string]: tEthereumAddress;
}

export const chainlinkAggregators: iTokenWithAddressByNetwork = {
  [eEthereumNetwork.kovan.toString()]: {
    DAI: "0x6F47077D3B6645Cb6fb7A29D280277EC1e5fFD90",
    USDC: "0x672c1C0d1130912D83664011E7960a42E8cA05D5",
    LEND: "0xdce38940264dfbc01ad1486c21764948e511947e",
    MKR: "0x14D7714eC44F44ECD0098B39e642b246fB2c38D0",
    LINK: "0xf1e71Afd1459C05A2F898502C4025be755aa844A",
  },
  [eEthereumNetwork.ropsten.toString()]: {
    DAI: "0x64b8e49baded7bfb2fd5a9235b2440c0ee02971b",
    USDC: "0xe1480303dde539e2c241bdc527649f37c9cbef7d",
    LEND: "0xf7b4834fe443d1E04D757b4b089b35F5A90F2847",
    MKR: "0x811B1f727F8F4aE899774B568d2e72916D91F392",
    LINK: "0xb8c99b98913bE2ca4899CdcaF33a3e519C20EeEc",
  },
  [eEthereumNetwork.main.toString()]: {
    DAI: "0x037E8F2125bF532F3e228991e051c8A7253B642c",
    USDC: "0xdE54467873c3BCAA76421061036053e371721708",
    LEND: "0x1EeaF25f2ECbcAf204ECADc8Db7B0db9DA845327",
    MKR: "0xda3d675d50ff6c555973c4f0424964e1f6a4e7d3",
    LINK: "0xeCfA53A8bdA4F0c4dd39c55CC8deF3757aCFDD07",
  },
};

export interface iCpmPriceProviderConfigs {
  [tokenSymbol: string]: {
    peggedToEth: boolean;
    priceDeviation: number;
    cpmTokenType: COMPLEX_TOKEN_TYPE;
    platformId: number;
  };
}

export const cpmPriceProviderConfigs: iCpmPriceProviderConfigs = {
  DAI: {
    peggedToEth: false,
    priceDeviation: ePriceDeviation.LOW,
    cpmTokenType: COMPLEX_TOKEN_TYPE.MULTISIDE,
    platformId: UNISWAP_PLATFORM_ID,
  },
  USDC: {
    peggedToEth: false,
    priceDeviation: ePriceDeviation.LOW,
    cpmTokenType: COMPLEX_TOKEN_TYPE.MULTISIDE,
    platformId: UNISWAP_PLATFORM_ID,
  },
  sETH: {
    peggedToEth: true,
    priceDeviation: ePriceDeviation.LOW,
    cpmTokenType: COMPLEX_TOKEN_TYPE.MULTISIDE,
    platformId: UNISWAP_PLATFORM_ID,
  },
  LINK: {
    peggedToEth: false,
    priceDeviation: ePriceDeviation.LOW,
    cpmTokenType: COMPLEX_TOKEN_TYPE.MULTISIDE,
    platformId: UNISWAP_PLATFORM_ID,
  },
  LEND: {
    peggedToEth: false,
    priceDeviation: ePriceDeviation.HIGH,
    cpmTokenType: COMPLEX_TOKEN_TYPE.MULTISIDE,
    platformId: UNISWAP_PLATFORM_ID,
  },
  MKR: {
    peggedToEth: false,
    priceDeviation: ePriceDeviation.LOW,
    cpmTokenType: COMPLEX_TOKEN_TYPE.MULTISIDE,
    platformId: UNISWAP_PLATFORM_ID,
  },
};
