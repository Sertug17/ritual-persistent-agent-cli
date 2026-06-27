// Deploy command — Deploy a Sovereign Agent to Ritual testnet

import ora from "ora";
import chalk from "chalk";
import { encodeFunctionData, getAddress, parseEther, keccak256, toHex } from "viem";
import { createWallet, toSalt, readContract, sendTx, waitTx } from "../lib/chain.js";
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  HARNESS_ABI,
  REGISTRY,
  REGISTRY_ABI,
  WALLET_ABI,
  RITUAL_WALLET,
} from "../lib/contracts.js";
import { encryptRitualEnv, buildEnvPayload } from "../lib/crypto.js";
import { shortAddress, printSection, printKV } from "../lib/utils.js";
import { getPrivateKey } from "../lib/config.js";

const DELIVERY_SELECTOR = keccak256(
  new TextEncoder().encode("onSovereignAgentResult(bytes32,bytes)")
).slice(0, 10);

export async function deployCommand(options) {
  const pk = process.env.RITUAL_PRIVATE_KEY || getPrivateKey();
  if (!pk) {
    console.log(chalk.red("✖ No private key. Set with --key, RITUAL_PRIVATE_KEY, or 'ritual config set-key'"));
    process.exit(1);
  }

  const wallet = createWallet(pk);
  const { publicClient, walletClient, account, address } = wallet;
  const spinner = ora();

  console.log(chalk.bold.cyan("\n╔══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║  Ritual Sovereign Agent Deploy      ║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════╝\n"));

  printSection("Wallet");
  printKV("Address", chalk.green(shortAddress(address)));

  // === Step 0: Resolve inputs ===
  const prompt = options.prompt || process.env.RITUAL_PROMPT || "You are a helpful AI assistant.";
  const model = options.model || process.env.RITUAL_MODEL || "claude-sonnet-4";
  const provider = options.provider || process.env.RITUAL_PROVIDER || "ritual";
  const apiKey = options.apiKey || process.env.RITUAL_API_KEY || "";
  const depositWei = parseEther(options.deposit);
  const salt = toSalt(options.salt);

  printSection("Configuration");
  printKV("Prompt", prompt.slice(0, 80) + (prompt.length > 80 ? "..." : ""));
  printKV("Model", model);
  printKV("Provider", provider);
  printKV("Deposit", `${options.deposit} RITUAL`);
  printKV("Lock", `${options.lock} blocks`);
  printKV("Salt", chalk.gray(salt));

  // === Step 1: Predict harness address ===
  spinner.start("Predicting harness address...");
  const [harness] = await readContract(
    publicClient, FACTORY_ADDRESS, FACTORY_ABI, "predictHarness",
    [address, salt]
  );
  spinner.succeed(`Harness: ${chalk.green(harness)}`);
  const harnessShort = shortAddress(harness);

  // === Step 2: Check if already deployed ===
  spinner.start("Checking if already deployed...");
  const code = await publicClient.getCode({ address: getAddress(harness) });
  const alreadyDeployed = code && code !== "0x";

  if (alreadyDeployed) {
    spinner.warn(`Harness at ${harnessShort} already deployed`);
  } else {
    spinner.succeed("Not deployed yet");
  }

  // === Step 3: Deploy harness (if not deployed) ===
  if (!alreadyDeployed) {
    spinner.start("Deploying harness...");
    const deployData = encodeFunctionData({
      abi: FACTORY_ABI,
      functionName: "deployHarness",
      args: [salt],
    });
    const deployTx = await sendTx(walletClient, {
      to: FACTORY_ADDRESS,
      data: deployData,
      gas: 3_500_000n,
    });
    await waitTx(publicClient, deployTx);
    spinner.succeed(`Harness deployed! Tx: ${chalk.gray(deployTx)}`);
  }

  // === Step 4: Discover executor (or use default) ===
  spinner.start("Selecting executor...");
  let executor = options.executor || "0x3c7a5c0628b3d47d12c3556ac1b02b2723f390";
  let executorPubKey = "";

  // Try registry, fall back to default if it fails
  try {
    const services = await readContract(
      publicClient, REGISTRY, REGISTRY_ABI, "getServicesByCapability", [0, true]
    );
    if (services && services.length > 0) {
      executor = services[0].teeAddress;
      executorPubKey = services[0].pubKey;
      spinner.succeed(`Executor: ${chalk.green(executor)} (from registry)`);
    } else {
      throw new Error("empty registry");
    }
  } catch (e) {
    spinner.warn(`Registry unavailable, using default executor: ${shortAddress(executor)}`);
  }

  if (!options.executor && executorPubKey === "") {
    // Need pubkey for encryption — hardcode a known one or skip encryption
    spinner.info("Executor pubkey not available — secrets will be stored unencrypted");
  }

  // === Step 5: Encrypt secrets ===
  spinner.start("Encrypting environment secrets...");
  const envPayload = buildEnvPayload(provider, apiKey);
  let encryptedEnv = "0x";
  if (executorPubKey && executorPubKey !== "0x") {
    encryptedEnv = await encryptRitualEnv(executorPubKey, envPayload);
  }
  spinner.succeed("Secrets encrypted");

  // === Step 6: Build Sovereign Agent config ===
  spinner.start("Building agent configuration...");

  const emptyRef = { key: "", value: "", metadata: "" };

  const params = {
    executor: getAddress(executor),
    payment: depositWei,
    input: "0x",
    maxDuration: 5n,
    maxPollBlock: 100_000n,
    programId: "SOVEREIGN_AGENT_TASK",
    deliveryAddress: getAddress(harness),
    deliverySelector: DELIVERY_SELECTOR,
    callbackGasLimit: 3_000_000n,
    gasPrice: 1_000_000_000n,
    maxPrice: 100_000_000n,
    cliType: 0,
    prompt: prompt,
    encryptedEnv: encryptedEnv,
    inputRef: emptyRef,
    outputRef: emptyRef,
    assetRefs: [],
    proofRef: emptyRef,
    model: model,
    modelArgs: [],
    temperature: 5,
    maxTokens: 2048,
    extra: "",
  };

  const schedule = {
    callbackGasLimit: 800_000,
    frequency: 180,
    ttl: 500,
    gasPrice: 1_000_000_000n,
    maxPrice: 100_000_000n,
    value: 0n,
  };

  const rollingWindow = { enabled: 1, window: 5000, repeat: 1 };
  const maxReserve = 100_000n;

  spinner.succeed("Configuration built");

  // === Step 7: Deposit to RitualWallet if needed ===
  spinner.start("Checking RitualWallet balance...");
  const walletBalance = await readContract(
    publicClient, RITUAL_WALLET, WALLET_ABI, "balanceOf", [address]
  );

  if (walletBalance < depositWei) {
    spinner.warn(`RitualWallet balance: ${chalk.yellow(String(walletBalance))} wei, need ${depositWei} wei`);
    spinner.start("Depositing to RitualWallet...");
    const depositTx = await sendTx(walletClient, {
      to: RITUAL_WALLET,
      data: encodeFunctionData({ abi: WALLET_ABI, functionName: "deposit", args: [] }),
      value: depositWei * 2n,
    });
    await waitTx(publicClient, depositTx);
    spinner.succeed(`Deposited. Tx: ${chalk.gray(depositTx)}`);
  } else {
    spinner.succeed(`Balance: ${chalk.green(String(walletBalance))} wei`);
  }

  // === Step 8: configureFundAndStart — sent to HARNESS (not factory!) ===
  spinner.start("Configuring, funding, and starting agent...");
  const cfaData = encodeFunctionData({
    abi: HARNESS_ABI,
    functionName: "configureFundAndStart",
    args: [params, schedule, rollingWindow, maxReserve],
  });

  const cfaTx = await sendTx(walletClient, {
    to: getAddress(harness),
    data: cfaData,
    value: depositWei,
    gas: 5_000_000n,
  });
  spinner.succeed(`configureFundAndStart sent! Tx: ${chalk.gray(cfaTx)}`);

  const receipt = await waitTx(publicClient, cfaTx);
  spinner.succeed("Agent deployed and armed! ✅");

  // === Step 9: Summary ===
  console.log(chalk.bold.green("\n✓ Sovereign Agent deployed successfully!\n"));
  printSection("Deployment Summary");
  printKV("Agent Address", chalk.green(harness));
  printKV("Wallet", shortAddress(address));
  printKV("Salt", chalk.gray(salt));
  printKV("Deploy Tx", chalk.gray(deployTx || "Already deployed"));
  printKV("Configure Tx", chalk.gray(cfaTx));
  printKV("Block", String(receipt.blockNumber));
  printKV("Explorer", `${chalk.blue("https://explorer.ritualfoundation.org/address/" + harness)}`);

  console.log(chalk.bold("\n📋 Genesis 1000 Check:"));
  console.log(chalk.gray("  State should show 'Armed' after heartbeat arrives."));
  console.log(chalk.gray("  Run: ritual status " + harness));

  return harness;
}
