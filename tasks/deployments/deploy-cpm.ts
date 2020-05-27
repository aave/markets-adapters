import { task, types } from "@nomiclabs/buidler/config";
import { eContractid } from "../../helpers/types";
import { registerContractInJsonDb, deployMockCpm } from "../../helpers/helpers";

const { MockCpm } = eContractid;

task(`deploy-${MockCpm}`, `Deploys a ${MockCpm}`)
  .addParam(
    "token",
    "The address of the token part of the CPM pair",
    undefined,
    types.string
  )
  .addParam(
    "symbol",
    "The symbol of the token, for logging purposes",
    undefined,
    types.string
  )
  .setAction(async ({ token, symbol }, localBRE) => {
    await localBRE.run("set-bre");

    console.log(`Deploying ${MockCpm} for pair ${symbol}/ETH ...\n`);

    const cpm = await deployMockCpm();

    await cpm.setup(token);

    await registerContractInJsonDb(`${symbol}/ETH${MockCpm}`, cpm);

    return cpm;
  });
