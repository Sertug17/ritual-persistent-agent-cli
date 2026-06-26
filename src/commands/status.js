// Status command - Check agent status

import chalk from "chalk";
import { getAddress, formatEther } from "viem";
import { createPublic } from "../lib/chain.js";
import {
  LAUNCHER_ABI,
  RITUAL_WALLET,
  WALLET_ABI,
} from "../lib/contracts.js";
import { readContract } from "../lib/chain.js";
import { shortAddress, formatRitual, getAgentStateLabel, printSection, printKV } from "../lib/utils.js";

export async function statusCommand(address) {
  if (!address || !address.startsWith("0x")) {
    console.log(chalk.red("✖ Please provide a valid agent address"));
    process.exit(1);
  }

  const publicClient = createPublic();
  const agentAddr = getAddress(address);

  console.log(chalk.bold.cyan("\n╔══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║        Persistent Agent Status       ║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════╝\n"));

  printSection("Agent");
  printKV("Address", chalk.green(agentAddr));

  // Check if agent exists (has code)
  const code = await publicClient.getCode({ address: agentAddr });
  const exists = code && code !== "0x";
  printKV("Deployed", exists ? chalk.green("Yes") : chalk.red("No"));

  if (!exists) {
    console.log(chalk.yellow("\n⚠ Agent is not deployed. Deploy first with 'ritual deploy'"));
    return;
  }

  // Read agent state
  try {
    const configured = await readContract(publicClient, agentAddr, LAUNCHER_ABI, "configured", []);
    printKV("Configured", configured ? chalk.green("true") : chalk.yellow("false"));

    const wakeMode = await readContract(publicClient, agentAddr, LAUNCHER_ABI, "wakeMode", []);
    const wakeLabels = { 0: "Stopped", 1: "Armed", 2: "Sleeping" };
    printKV("Wake mode", wakeLabels[wakeMode] || String(wakeMode));

    const owner = await readContract(publicClient, agentAddr, LAUNCHER_ABI, "owner", []);
    printKV("Owner", shortAddress(owner));

    const stateLabel = getAgentStateLabel({ exists, configured, wakeMode });
    printKV("State", stateLabel);

  } catch (e) {
    console.log(chalk.yellow("  (Some reads failed - agent may not be fully configured)"));
  }

  // Check RitualWallet balance
  printSection("Balance");
  try {
    const balance = await readContract(publicClient, RITUAL_WALLET, WALLET_ABI, "balanceOf", [agentAddr]);
    printKV("Agent balance", `${formatRitual(balance)} RITUAL`);

    const lockAmt = await readContract(publicClient, RITUAL_WALLET, WALLET_ABI, "lockOf", [agentAddr]);
    printKV("Locked", `${formatRitual(lockAmt)} RITUAL`);

    if (balance === 0n) {
      console.log(chalk.yellow("  ⚠ Agent has no balance. Top up with 'ritual topup " + shortAddress(agentAddr) + " --amount 10'"));
    }
  } catch (e) {
    console.log(chalk.gray("  (Could not read wallet balance)"));
  }

  // Explorer link
  printSection("Links");
  console.log(`  Explorer: ${chalk.blue("https://explorer.ritualfoundation.org/address/" + agentAddr)}`);

  // Genesis 1000 compatibility check
  printSection("Genesis 1000 Check");
  const isReady = exists && wakeMode === 1;
  if (isReady) {
    console.log(chalk.green("  ✓ Agent is Armed and ready for Genesis 1000 registry"));
    console.log(chalk.gray("  ✓ If you're in the first 1,000, you'll be etched on-chain"));
    console.log(chalk.gray("  › Claim with /genesis_claim in Ritual Discord"));
  } else if (exists && configured && wakeMode === 0) {
    console.log(chalk.yellow("  ⚠ Agent is deployed but Stopped. Run 'ritual restart <address>'"));
  } else if (exists && !configured) {
    console.log(chalk.yellow("  ⚠ Agent deployed but not configured yet."));
  } else {
    console.log(chalk.gray("  ⚠ Not deployed yet."));
  }
}
