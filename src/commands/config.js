// Config command

import chalk from "chalk";
import { getPrivateKey, setPrivateKey, getConfig, setConfig, getAllConfig, clearConfig } from "../lib/config.js";

export function configCommand(action, key, value) {
  switch (action) {
    case "set-key": {
      if (!value) {
        console.log(chalk.red("✖ Usage: ritual config set-key <private_key>"));
        return;
      }
      setPrivateKey(value);
      const masked = value.slice(0, 6) + "..." + value.slice(-4);
      console.log(chalk.green(`✓ Private key set: ${chalk.gray(masked)}`));
      break;
    }

    case "show": {
      const all = getAllConfig();
      console.log(chalk.bold.cyan("\nCurrent Configuration:\n"));
      for (const [k, v] of Object.entries(all)) {
        if (k === "privateKey" && v) {
          console.log(`  ${chalk.cyan(k)}: ${chalk.gray(v.slice(0, 6) + "..." + v.slice(-4))}`);
        } else {
          console.log(`  ${chalk.cyan(k)}: ${chalk.gray(v || "(not set)")}`);
        }
      }
      break;
    }

    case "clear": {
      clearConfig();
      console.log(chalk.green("✓ Configuration cleared"));
      break;
    }

    case "get": {
      if (!key) {
        console.log(chalk.red("✖ Usage: ritual config get <key>"));
        return;
      }
      const val = getConfig(key);
      if (val) {
        console.log(val);
      } else {
        console.log(chalk.yellow(`Config key '${key}' not set`));
      }
      break;
    }

    case "set": {
      if (!key || !value) {
        console.log(chalk.red("✖ Usage: ritual config set <key> <value>"));
        return;
      }
      setConfig(key, value);
      console.log(chalk.green(`✓ ${key} = ${value}`));
      break;
    }

    default: {
      console.log(chalk.bold.cyan("\nUsage:"));
      console.log(chalk.gray("  ritual config set-key <private_key>   Set your wallet private key"));
      console.log(chalk.gray("  ritual config show                    Show all config"));
      console.log(chalk.gray("  ritual config get <key>               Get a config value"));
      console.log(chalk.gray("  ritual config set <key> <value>       Set a config value"));
      console.log(chalk.gray("  ritual config clear                   Clear all config"));
      console.log();
      console.log(chalk.bold("Environment variables (override config):"));
      console.log(chalk.gray("  RITUAL_PRIVATE_KEY"));
      console.log(chalk.gray("  RITUAL_PROMPT"));
      console.log(chalk.gray("  RITUAL_MODEL"));
      console.log(chalk.gray("  RITUAL_PROVIDER"));
      console.log(chalk.gray("  RITUAL_API_KEY"));
      break;
    }
  }
}
