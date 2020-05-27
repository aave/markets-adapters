import { task } from "@nomiclabs/buidler/config";
import { BuidlerRuntimeEnvironment } from "@nomiclabs/buidler/types";
import { tokensWithAddresses } from "../../helpers/constants";
import { eContractid } from "../../helpers/types";

task(
  "mock-cpms-deployment",
  "Deployment in testnet of all the Constant Product Markets (CPMs)"
).setAction(async (_, localBRE) => {
  const BRE: BuidlerRuntimeEnvironment = await localBRE.run("set-bre");
  const network = BRE.network.name;

  if (!tokensWithAddresses[network]) {
    throw Error(`${network} not properly configured`);
  }
  for (const [symbol, token] of tokensWithAddresses[network]) {
    if (!symbol || !token) {
      throw Error(`${network} not properly configured`);
    }
    await BRE.run(`deploy-${eContractid.MockCpm}`, { token, symbol });
  }
});
