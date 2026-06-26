// Utility functions

import chalk from "chalk";
import { formatEther } from "viem";

/**
 * Shorten an address for display
 */
export function shortAddress(address) {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format RITUAL value (wei -> RITUAL with decimals)
 */
export function formatRitual(wei, precision = 4) {
  const val = parseFloat(formatEther(wei));
  return val.toFixed(precision);
}

/**
 * Agent state label
 */
export function getAgentStateLabel(agent) {
  if (!agent) return chalk.gray("Unknown");
  if (!agent.exists) return chalk.gray("Not deployed");
  if (!agent.configured) return chalk.yellow("Unconfigured");
  if (agent.wakeMode === 1) return chalk.green("Armed");
  return chalk.red("Stopped");
}

/**
 * Sleep
 */
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Print a table-like section
 */
export function printSection(title) {
  console.log(chalk.bold(`\n${title}`));
  console.log(chalk.gray("─".repeat(50)));
}

/**
 * Print a key-value pair
 */
export function printKV(key, value, indent = 0) {
  const pad = " ".repeat(indent);
  console.log(`${pad}${chalk.cyan(key)}: ${value}`);
}
