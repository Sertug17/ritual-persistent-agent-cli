// Faucet command

import chalk from "chalk";
import { execSync } from "node:child_process";

export async function faucetCommand(options) {
  console.log(chalk.bold.cyan("\n╔══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║       Ritual Testnet Faucet          ║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════╝\n"));

  console.log(chalk.bold("Official Faucet:"));
  console.log(`  ${chalk.blue("https://faucet.ritualfoundation.org/")}`);
  console.log();
  console.log(chalk.yellow("⚠ Access code required for faucet."));
  console.log(chalk.gray("  Get access code from Ritual Discord:"));
  console.log(chalk.gray("  " + chalk.blue("https://discord.gg/ritual-net")));
  console.log(chalk.gray("  Then run /genesis_claim in Discord after deploying."));
  console.log();
  console.log(chalk.bold("Alternative: Check balance on explorer"));
  console.log(`  ${chalk.blue("https://explorer.ritualfoundation.org/")}`);
  console.log();

  if (options.open) {
    try {
      const platform = process.platform;
      if (platform === "darwin") {
        execSync(`open "https://faucet.ritualfoundation.org/"`);
      } else if (platform === "win32") {
        execSync(`start "https://faucet.ritualfoundation.org/"`);
      } else {
        execSync(`xdg-open "https://faucet.ritualfoundation.org/"`);
      }
      console.log(chalk.green("  Opened faucet in browser."));
    } catch (e) {
      console.log(chalk.red("  Could not open browser. Visit the URL manually."));
    }
  }

  console.log(chalk.bold("\n📋 Quick Start:"));
  console.log(chalk.gray("  1. Get access code from Ritual Discord"));
  console.log(chalk.gray("  2. Visit faucet, enter wallet address + code"));
  console.log(chalk.gray("  3. Get 5 RITUAL test tokens"));
  console.log(chalk.gray("  4. Run: ritual deploy --prompt 'hello' --salt myagent"));
}
