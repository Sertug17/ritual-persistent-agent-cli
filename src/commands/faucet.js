// Faucet command - Updated with Discord access code flow

import chalk from "chalk";
import { execSync } from "node:child_process";

export async function faucetCommand(options) {
  console.log(chalk.bold.cyan("\n╔══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║       Ritual Testnet Faucet          ║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════╝\n"));

  console.log(chalk.bold("Official Faucet:"));
  console.log(`  ${chalk.blue("https://faucet.ritualfoundation.org/")}`);
  console.log();

  console.log(chalk.bold("📋 How to get an Access Code:"));
  console.log(chalk.gray("  1. Join Ritual Discord:"));
  console.log(chalk.gray(`     ${chalk.blue("https://discord.gg/ritual-net")}`));
  console.log(chalk.gray("  2. Go to the #ritdrip channel"));
  console.log(chalk.gray("  3. Run the /get_code command"));
  console.log(chalk.gray("  4. Bot will DM you a unique access code"));
  console.log(chalk.gray("  5. Enter code + wallet address at faucet"));
  console.log(chalk.gray("  6. Claim 5 RITUAL test tokens (once per 24h)"));
  console.log();
  console.log(chalk.yellow("⚠ Note: Requires 'Ritty' role or higher in Discord."));
  console.log(chalk.yellow("  New users can ask someone with higher role for 'Gifted' role."));
  console.log();

  console.log(chalk.bold("🔗 Useful Links:"));
  console.log(`  Explorer: ${chalk.blue("https://explorer.ritualfoundation.org/")}`);
  console.log(`  Discord:  ${chalk.blue("https://discord.gg/ritual-net")}`);
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
  console.log(chalk.gray("  1. Get access code from Discord (#ritdrip → /get_code)"));
  console.log(chalk.gray("  2. Visit faucet, enter wallet address + code"));
  console.log(chalk.gray("  3. Get 5 RITUAL test tokens"));
  console.log(chalk.gray("  4. Run: ritual config set-key 0xYourKey"));
  console.log(chalk.gray("  5. Run: ritual deploy --prompt 'hello' --salt myagent"));
}
