import chalk from "chalk";

import { readAccounts } from "./src/readConfig.js";
import { ping } from "./src/ping.js";
import { dailyCheckIn } from "./src/dailyCheckIn.js";
import { fetchAndClaimMission } from "./src/mission.js";
import { claimMine } from "./src/claimMine.js";
import { startMine } from "./src/startMine.js";
import { summary } from "./src/summary.js";

const { green, yellow, cyan } = chalk;

const equals = "=".repeat(100);
const dash = "-".repeat(100);

const runSession = async () => {
  let session = 1;

  const accounts = await readAccounts();

  while (true) {
    console.log(equals);
    console.log(green(`Starting session ${session}... `));

    for (const account of accounts) {
      console.log(dash);

      const { email, userToken, nodeId, nodeToken } = account;

      console.log(yellow(`Running for email: ${cyan(email)}\n`));

      console.log(yellow(`Send ping...`));
      await ping(nodeId, nodeToken);

      console.log(yellow(`Daily check-in...`));
      await dailyCheckIn(userToken);

      console.log(yellow(`Fetching missions...`));
      await fetchAndClaimMission(userToken);

      console.log(yellow("Claiming mining rewards..."));
      await claimMine(nodeId, nodeToken);

      console.log(yellow("Starting mining process..."));
      await startMine(nodeId, nodeToken);

      console.log(yellow("Node summary..."));
      await summary(userToken, nodeId, nodeToken);
    }

    let temp = session + 1;

    console.log(dash);
    console.log(
      green(
        `End of session ${session} | Wait 1 hour for the next session ${temp} | Stop code execution "Ctrl+c"`
      )
    );
    console.log(`${equals}\n`);

    session++;

    // Delay 1 hour
    await new Promise((resolve) => setTimeout(resolve, 3600000));
  }
};

await runSession();
