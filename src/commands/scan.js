// Scan command - Find deployed agents for a wallet

import chalk from "chalk";
import { getAddress, keccak256, toHex } from "viem";
import { createPublic, readContract } from "../lib/chain.js";
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  LAUNCHER_ABI,
  RITUAL_WALLET,
  WALLET_ABI,
} from "../lib/contracts.js";
import {
  shortAddress,
  formatRitual,
  getAgentStateLabel,
  printSection,
  printKV,
} from "../lib/utils.js";
import { getPrivateKey } from "../lib/config.js";

export async function scanCommand(options) {
  let owner = options.owner;
  if (!owner) {
    const pk = process.env.RITUAL_PRIVATE_KEY || getPrivateKey();
    if (!pk) {
      console.log(chalk.red("✖ No owner specified and no private key configured"));
      console.log(chalk.gray("  Use: ritual scan --owner 0xYourAddress"));
      process.exit(1);
    }
    const wallet = (await import("../lib/chain.js")).createWallet(pk);
    owner = wallet.address;
  }

  owner = getAddress(owner);
  const publicClient = createPublic();
  const limit = parseInt(options.limit);

  console.log(chalk.bold.cyan("\n╔══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║      Persistent Agent Scanner        ║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════╝\n"));

  printKV("Wallet", chalk.green(shortAddress(owner)));
  printKV("Scan limit", String(limit));
  console.log();

  const agents = [];

  // Scan by trying sequential salts or common patterns
  // The deterministic nature means we can predict addresses without on-chain calls
  for (let i = 0; i < limit; i++) {
    const saltStr = `agent-${i}`;
    const salt = keccak256(toHex(saltStr));

    try {
      const [predicted, actualSalt] = await readContract(
        publicClient, FACTORY_ADDRESS, FACTORY_ABI, "predictCompressedLauncher",
        [owner, salt]
      );

      const code = await publicClient.getCode({ address: getAddress(predicted) });
      const exists = code && code !== "0x";

      if (exists) {
        let configured = false;
        let wakeMode = 0;
        try {
          configured = await readContract(publicClient, predicted, LAUNCHER_ABI, "configured", []);
          wakeMode = await readContract(publicClient, predicted, LAUNCHER_ABI, "wakeMode", []);
        } catch (e) {
          // Agent might not have these functions available yet
        }

        let balance = 0n;
        try {
          balance = await readContract(publicClient, RITUAL_WALLET, WALLET_ABI, "balanceOf", [predicted]);
        } catch (e) {}

        agents.push({
          address: predicted,
          salt: saltStr,
          configured,
          wakeMode,
          balance,
          exists,
        });

        const stateLabel = getAgentStateLabel({ exists, configured, wakeMode });
        console.log(
          `  ${chalk.green("✓")} ${shortAddress(predicted)} ` +
          `[salt: ${saltStr}] ${stateLabel} ` +
          `(${formatRitual(balance)} RITUAL)`
        );
      }
    } catch (e) {
      // Skip errors from individual predictions
    }
  }

  console.log();
  printSection("Summary");
  printKV("Total found", String(agents.length));

  const armed = agents.filter((a) => a.wakeMode === 1).length;
  printKV("Armed", String(armed));

  if (armed > 0) {
    console.log(chalk.green(`\n  🎯 ${armed} agent(s) eligible for Genesis 1000!`));
    console.log(chalk.gray("  Claim with /genesis_claim in Ritual Discord"));
  } else if (agents.length === 0) {
    console.log(chalk.yellow("\n  No agents found for this wallet."));
    console.log(chalk.gray("  Deploy one with: ritual deploy --salt myfirstagent"));
  }

  return agents;
}
