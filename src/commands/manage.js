// Manage command - restart, stop, topup agent

import chalk from "chalk";
import { getAddress, encodeFunctionData, parseEther } from "viem";
import { createWallet, sendTx, waitTx, readContract } from "../lib/chain.js";
import {
  HARNESS_ABI,
  FACTORY_ADDRESS,
  FACTORY_ABI,
  RITUAL_WALLET,
  WALLET_ABI,
} from "../lib/contracts.js";
import { shortAddress, printSection, printKV } from "../lib/utils.js";
import { getPrivateKey } from "../lib/config.js";

export async function manageCommand(action, address, options = {}) {
  const pk = process.env.RITUAL_PRIVATE_KEY || getPrivateKey();
  if (!pk) {
    console.log(chalk.red("✖ No private key configured"));
    process.exit(1);
  }

  const wallet = createWallet(pk);
  const { publicClient, walletClient, address: walletAddr } = wallet;
  const agentAddr = getAddress(address);

  console.log(chalk.bold.cyan(`\n${action === "restart" ? "🔄" : action === "stop" ? "⏹" : "💰"} Agent ${action.charAt(0).toUpperCase() + action.slice(1)}\n`));
  printKV("Agent", chalk.green(shortAddress(agentAddr)));
  printKV("Wallet", shortAddress(walletAddr));

  // Check agent exists
  const code = await publicClient.getCode({ address: agentAddr });
  if (!code || code === "0x") {
    console.log(chalk.red("\n✖ Agent not deployed at this address"));
    return;
  }

  if (action === "topup") {
    const amount = options.amount || "5";
    const amountWei = parseEther(amount);
    printKV("Amount", `${amount} RITUAL`);

    // First deposit to RitualWallet
    const balance = await readContract(publicClient, RITUAL_WALLET, WALLET_ABI, "balanceOf", [walletAddr]);
    if (balance < amountWei) {
      console.log(chalk.gray("  Depositing to RitualWallet first..."));
      const depositTx = await sendTx(walletClient, {
        to: RITUAL_WALLET,
        data: encodeFunctionData({ abi: WALLET_ABI, functionName: "deposit", args: [] }),
        value: amountWei + parseEther("0.1"), // extra for gas
      });
      await waitTx(publicClient, depositTx);
      console.log(chalk.green(`  Deposited. Tx: ${chalk.gray(depositTx)}`));
    }

    const txData = encodeFunctionData({
      abi: WALLET_ABI,
      functionName: "deposit", // Actually top-up involves depositing to RitualWallet for the agent
      args: [],
    });

    console.log(chalk.gray("  Sending top-up transaction..."));
    const tx = await sendTx(walletClient, {
      to: RITUAL_WALLET,
      data: txData,
      value: amountWei,
      gas: 200000n,
    });
    await waitTx(publicClient, tx);
    console.log(chalk.green(`  ✓ Topped up ${amount} RITUAL. Tx: ${chalk.gray(tx)}`));

  } else if (action === "restart" || action === "stop") {
    const fnName = action;
    const gasLimit = action === "restart" ? 500000n : 3500000n;

    const txData = encodeFunctionData({
      abi: HARNESS_ABI,
      functionName: fnName,
      args: [],
    });

    console.log(chalk.gray(`  Sending ${fnName}()...`));
    const tx = await sendTx(walletClient, {
      to: agentAddr,
      data: txData,
      gas: gasLimit,
    });
    await waitTx(publicClient, tx);
    console.log(chalk.green(`  ✓ ${fnName} successful. Tx: ${chalk.gray(tx)}`));

    // Verify state
    try {
      const wakeMode = await readContract(publicClient, agentAddr, HARNESS_ABI, "wakeMode", []);
      const modeLabels = { 0: "Stopped", 1: "Armed", 2: "Sleeping" };
      console.log(chalk.green(`  Current state: ${modeLabels[wakeMode] || wakeMode}`));
    } catch (e) {}
  }

  printSection("Links");
  console.log(`  Explorer: ${chalk.blue("https://explorer.ritualfoundation.org/address/" + agentAddr)}`);
}
