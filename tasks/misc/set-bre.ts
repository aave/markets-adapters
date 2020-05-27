import { task } from "@nomiclabs/buidler/config";
import { setBRE } from "../../helpers/helpers";

task(
  `set-bre`,
  `Inits the BRE, to have access to all the plugins' objects`
).setAction(async (_, BRE) => {
  setBRE(BRE);
  return BRE;
});
