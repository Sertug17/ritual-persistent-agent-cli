// Deploy command - Deploy a persistent agent

import ora from "ora";
import chalk from "chalk";
import { encodeFunctionData, getAddress, parseEther, keccak256, toHex, pad } from "viem";
import { createWallet, toSalt, readContract, sendTx, waitTx } from "../lib/chain.js";
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
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
  console.log(chalk.bold.cyan("║   Ritual Persistent Agent Deploy    ║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════╝\n"));

  printSection("Wallet");
  printKV("Address", chalk.green(shortAddress(address)));

  // === Step 0: Resolve inputs ===
  const prompt = options.prompt || process.env.RITUAL_PROMPT || "You are a helpful AI assistant.";
  const model = options.model || process.env.RITUAL_MODEL || "claude-sonnet-4";
  const provider = options.provider || process.env.RITUAL_PROVIDER || "ritual";
  const apiKey = options.apiKey || process.env.RITUAL_API_KEY || "";
  const depositWei = parseEther(options.deposit);
  const lockBlocks = BigInt(options.lock);
  const salt = toSalt(options.salt);

  printSection("Configuration");
  printKV("Prompt", prompt.slice(0, 80) + (prompt.length > 80 ? "..." : ""));
  printKV("Model", model);
  printKV("Provider", provider);
  printKV("Deposit", `${options.deposit} RITUAL`);
  printKV("Lock", `${options.lock} blocks`);
  printKV("Salt", chalk.gray(salt));

  // === Step 1: Predict launcher address ===
  spinner.start("Predicting launcher address...");
  const [predictedLauncher, actualSalt] = await readContract(
    publicClient, FACTORY_ADDRESS, FACTORY_ABI, "predictCompressedLauncher",
    [address, salt]
  );
  spinner.succeed(`Launcher: ${chalk.green(predictedLauncher)}`);
  const predShort = shortAddress(predictedLauncher);

  // === Step 2: Check if already deployed ===
  spinner.start("Checking if already deployed...");
  const code = await publicClient.getCode({ address: getAddress(predictedLauncher) });
  const alreadyDeployed = code && code !== "0x";

  if (alreadyDeployed) {
    spinner.warn(`Agent at ${predShort} already deployed`);
  } else {
    spinner.succeed("Not deployed yet");
  }

  // === Step 3: Deploy launcher (if not deployed) ===
  if (!alreadyDeployed) {
    spinner.start("Deploying launcher contract...");
    const deployData = encodeFunctionData({
      abi: FACTORY_ABI,
      functionName: "deployLauncherCompressed",
      args: [salt],
    });
    const deployTx = await sendTx(walletClient, {
      to: FACTORY_ADDRESS,
      data: deployData,
      gas: 1_000_000n,
    });
    await waitTx(publicClient, deployTx);
    spinner.succeed(`Launcher deployed! Tx: ${chalk.gray(deployTx)}`);
  }

  // === Step 4: Discover executor ===
  spinner.start("Discovering executor...");
  let executor = options.executor;
  if (!executor) {
    const services = await readContract(
      publicClient, REGISTRY, REGISTRY_ABI, "getServicesByCapability", [0, true]
    );
    if (!services || services.length === 0) {
      spinner.fail("No active executors found");
      process.exit(1);
    }
    executor = services[0].teeAddress;
    const pubKey = services[0].pubKey;
    // Store executor pubkey for encryption
    process.env.RITUAL_EXECUTOR_PUBKEY = pubKey;
    process.env.RITUAL_EXECUTOR = executor;
    spinner.succeed(`Executor: ${chalk.green(executor)} (${shortAddress(pubKey)})`);
  } else {
    spinner.succeed(`Executor: ${chalk.green(executor)} (manual)`);
    // For manual executor, we need to find its pubkey
    const services = await readContract(
      publicClient, REGISTRY, REGISTRY_ABI, "getServicesByCapability", [0, true]
    );
    const svc = services.find(s => s.teeAddress === executor);
    if (svc) {
      process.env.RITUAL_EXECUTOR_PUBKEY = svc.pubKey;
    }
  }

  // === Step 5: Encrypt secrets ===
  spinner.start("Encrypting environment secrets...");
  const envPayload = buildEnvPayload(provider, apiKey);
  const pubKeyHex = process.env.RITUAL_EXECUTOR_PUBKEY;
  let encryptedEnv = "0x";
  if (pubKeyHex && pubKeyHex !== "0x") {
    encryptedEnv = await encryptRitualEnv(pubKeyHex, envPayload);
  }
  spinner.succeed("Secrets encrypted");

  // === Step 6: Build config params ===
  spinner.start("Building agent configuration...");

  const emptyRef = { key: "", value: "", metadata: "" };

  const configParams = {
    executor: getAddress(executor),
    payment: parseEther(options.deposit),
    input: new TextEncoder().encode(prompt),
    maxDuration: 3600n,
    maxPollBlock: 100000n,
    programId: "ZeroClaw",
    deliveryAddress: getAddress(predictedLauncher),
    deliverySelector: DELIVERY_SELECTOR,
    callbackGasLimit: 500000n,
    gasPrice: 0n,
    maxPrice: parseEther("100"),
    cliType: 0,
    prompt: prompt,
    encryptedEnv: encryptedEnv,
    inputRef: emptyRef,
    outputRef: emptyRef,
    assetRefs: [],
    proofRef: emptyRef,
    model: model,
    modelArgs: [],
    temperature: 700,
    maxTokens: 4096,
    extra: "",
  };

  const scheduleConfig = {
    callbackGasLimit: 500000,
    period: 2000,
    payment: 100,
    gasPrice: 0n,
    maxPrice: parseEther("100"),
    startBlock: 0n,
  };

  const rollingConfig = {
    enabled: 0,
    window: 5,
    repeat: 0,
  };

  spinner.succeed("Configuration built");

  // === Step 7: Configure, Fund and Arm ===
  spinner.start("Sending configureFundAndArm (this funds + arms the agent)...");
  console.log(chalk.gray(`  This requires ~${options.deposit} RITUAL deposit + lock`));

  // First ensure RitualWallet has enough balance
  const walletBalance = await readContract(
    publicClient, RITUAL_WALLET, WALLET_ABI, "balanceOf", [address]
  );

  if (walletBalance < depositWei) {
    spinner.warn(`RitualWallet balance: ${chalk.yellow(String(walletBalance))} wei, need ${depositWei} wei`);
    spinner.start("Depositing to RitualWallet...");
    const depositTx = await sendTx(walletClient, {
      to: RITUAL_WALLET,
      data: encodeFunctionData({ abi: WALLET_ABI, functionName: "deposit", args: [] }),
      value: depositWei * 2n, // deposit enough for both deposit + gas
    });
    await waitTx(publicClient, depositTx);
    spinner.succeed(`Deposited to RitualWallet. Tx: ${chalk.gray(depositTx)}`);
  }

  // Lock funds
  const lockData = encodeFunctionData({
    abi: WALLET_ABI, functionName: "lock", args: [depositWei],
  });
  spinner.start("Locking funds...");
  const lockTx = await sendTx(walletClient, {
    to: RITUAL_WALLET,
    data: lockData,
    gas: 200000n,
  });
  await waitTx(publicClient, lockTx);
  spinner.succeed(`Locked. Tx: ${chalk.gray(lockTx)}`);

  // ConfigureFundAndArm
  const cfaData = encodeFunctionData({
    abi: FACTORY_ABI,
    functionName: "configureFundAndArm",
    args: [predictedLauncher, configParams, scheduleConfig, rollingConfig, depositWei, lockBlocks],
  });

  const cfaTx = await sendTx(walletClient, {
    to: FACTORY_ADDRESS,
    data: cfaData,
    gas: 8_000_000n,
  });
  spinner.succeed(`configureFundAndArm sent! Tx: ${chalk.gray(cfaTx)}`);

  const receipt = await waitTx(publicClient, cfaTx);
  spinner.succeed("Agent configured, funded, and armed!");

  // === Step 8: Summary ===
  console.log(chalk.bold.green("\n✓ Agent deployed successfully!\n"));
  printSection("Deployment Summary");
  printKV("Agent Address", chalk.green(predictedLauncher));
  printKV("Wallet", shortAddress(address));
  printKV("Salt", chalk.gray(salt));
  printKV("Deploy Tx", chalk.gray(deployTx || "Already deployed"));
  printKV("Configure Tx", chalk.gray(cfaTx));
  printKV("Block", String(receipt.blockNumber));
  printKV("Explorer", `${chalk.blue("https://explorer.ritualfoundation.org/address/" + predictedLauncher)}`);

  console.log(chalk.bold("\n📋 Genesis 1000 Check:"));
  console.log(chalk.gray("  State should show 'Armed' after heartbeat arrives."));
  console.log(chalk.gray("  Run: ritual status " + predictedLauncher));

  return predictedLauncher;
}
