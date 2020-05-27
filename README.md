# Aave markets adapters

Adapters smart contracts used on different Aave markets

## Repository structure
This repository is configured to use [Buidler](https://buidler.dev/) with Typescript, [Typechain](https://github.com/ethereum-ts/TypeChain), [Waffle](https://getwaffle.io/) and [ethers.js](https://github.com/ethers-io/ethers.js/).

The folder structure is:
- **contracts/** for the Solidity code
- **helpers/** for misc typescript helpers, including different abstractions, builder-related helpers or the custom types of the project, amongst others.
- **tasks/** for the buidlers tasks, splitted in *deployments* for "atomic" deployment-related tasks per contract, *migrations* for sequences of other tasks and *misc* for additional helper tasks.
- **test/** for the Waffle tests.
- **types/** for the Typechain-generated types.

## Available npm scripts
`docker-compose up` will start a docker container to which is possible to connect by using `docker-compose exec contracts-env bash` from another console. From withing that container, it's possible to execute all the available npm scripts contained on the *package.json* in order to compile the contracts, execute the tests, generate the Typechain types or deploy to buidlerevm, Kovan, Ropsten and Main networks.

For example, to execute the tests on the [CpmPriceProvider](./contracts/proxies/CpmPriceProvider.sol), the available npm script is **npm run test**.

## Deployed contracts
The deployed contracts by network can be found on the [deployed-contracts.json](./deployed-contracts.json) file.

Of those, only the ones including [CpmPriceProvider](./contracts/proxies/CpmPriceProvider.sol) in their name are deployed in the main Ethereum networks and connected to the Aave protocol. 

An audit performed by Consensys Diligence of the [CpmPriceProvider](./contracts/proxies/CpmPriceProvider.sol) contract can be found [here](https://diligence.consensys.net/audits/2020/05/aave-cpm-price-provider/) and more information about it [here](https://docs.aave.com/developers/developing-on-aave/the-protocol/price-oracle) on the **Uniswap Market** tab. In the case of the new Aave Uniswap Market, this is the only piece of logic added to the protocol.

## License
The code on this repository is under the AGPL v3 license