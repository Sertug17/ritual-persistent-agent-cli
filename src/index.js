#!/usr/bin/env node

// Ritual Persistent Agent CLI - Main Entry Point

import { program } from "commander";
import chalk from "chalk";

import { deployCommand } from "./commands/deploy.js";
import { statusCommand } from "./commands/status.js";
import { scanCommand } from "./commands/scan.js";
import { manageCommand } from "./commands/manage.js";
import { faucetCommand } from "./commands/faucet.js";
import { configCommand } from "./commands/config.js";
import { RITUAL_CHAIN } from "./lib/contracts.js";
import { getPrivateKey } from "./lib/config.js";

program
  .name("ritual")
  .description("CLI tool for deploying and managing Ritual Sovereign Agents")
  .version("0.1.0");

// Global option for private key (can also be set via config)
program
  .option("-k, --key <key>", "Private key (or set RITUAL_PRIVATE_KEY env)")
  .hook("preAction", (thisCmd) => {
    const opts = thisCmd.optsWithGlobals();
    if (opts.key) {
      process.env.RITUAL_PRIVATE_KEY = opts.key;
    }
    // Check if we have a key somewhere
    const pk = process.env.RITUAL_PRIVATE_KEY || getPrivateKey();
    if (!pk && thisCmd.args[0] !== "config" && thisCmd.args[0] !== "faucet") {
      console.log(
        chalk.yellow(
          "⚠ No private key set. Use --key, RITUAL_PRIVATE_KEY env, or run 'ritual config set-key'"
        )
      );
    }
  });

program
  .command("deploy")
  .description("Deploy a new Sovereign Agent")
  .option("-p, --prompt <prompt>", "Agent prompt / soul")
  .option("-m, --model <model>", "LLM model (e.g. claude-sonnet-4, gpt-4o)")
  .option("-s, --salt <salt>", "Unique salt for deterministic address")
  .option("-d, --deposit <amount>", "Deposit amount in RITUAL", "10")
  .option("-l, --lock <blocks>", "Lock blocks", "1000")
  .option("--provider <provider>", "LLM provider (anthropic, openai, gemini, xai, openrouter, ritual)", "ritual")
  .option("--api-key <key>", "LLM API key (not needed for ritual provider)")
  .option("--executor <address>", "Specific executor address (auto-discover if not set)")
  .action(deployCommand);

program
  .command("status")
  .description("Check agent status")
  .argument("<address>", "Agent launcher address")
  .action(statusCommand);

program
  .command("scan")
  .description("Scan wallet for deployed agents")
  .option("--owner <address>", "Owner address (default: connected wallet)")
  .option("--limit <count>", "Max agents to scan", "20")
  .action(scanCommand);

program
  .command("restart")
  .description("Restart a stopped agent")
  .argument("<address>", "Agent launcher address")
  .action((addr) => manageCommand("restart", addr));

program
  .command("stop")
  .description("Stop an armed agent")
  .argument("<address>", "Agent launcher address")
  .action((addr) => manageCommand("stop", addr));

program
  .command("topup")
  .description("Top up agent balance")
  .argument("<address>", "Agent launcher address")
  .option("-a, --amount <amount>", "Amount in RITUAL", "5")
  .action((addr, opts) => manageCommand("topup", addr, opts));

program
  .command("faucet")
  .description("Open Ritual faucet page or info")
  .option("--open", "Open faucet in browser")
  .action(faucetCommand);

program
  .command("config")
  .description("Manage CLI configuration")
  .argument("[action]", "get, set-key, show, clear")
  .argument("[key]", "Config key")
  .argument("[value]", "Config value")
  .action(configCommand);

program.parse(process.argv);
