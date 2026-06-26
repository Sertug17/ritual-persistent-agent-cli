// Ritual Persistent Agent dApp — Main Application Logic

import {
  encodeFunctionData,
  decodeFunctionResult,
  formatEther,
  parseEther,
  getAddress,
  keccak256,
  toHex,
} from "viem";

import {
  RITUAL_CHAIN,
  FACTORY_ADDRESS,
  FACTORY_ABI,
  HARNESS_ABI,
  REGISTRY,
  REGISTRY_ABI,
  RITUAL_WALLET,
  WALLET_ABI,
} from "./abis.js";
import { encryptRitualEnv, buildEnvPayload } from "./crypto.js";

// ─── Constants ────────────────────────────────────
// keccak256("onSovereignAgentResult(bytes32,bytes)")[0:4]
const DELIVERY_SELECTOR = "0x8ca12055";
// ─── State ────────────────────────────────────────
const state = {
  account: "",
  chainId: "",
  provider: null,
  activeTab: "deploy",
  executor: "",
  executorPubKey: "",
  predictedLauncher: "",
  busy: false,
};

// ─── Wallet ───────────────────────────────────────
function hasWallet() {
  return typeof window !== "undefined" && window.ethereum;
}

async function walletRequest(method, params) {
  return window.ethereum.request({ method, params });
}

function shortAddr(addr) {
  if (!addr) return "-";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function formatRitual(wei, precision = 4) {
  const val = parseFloat(formatEther(BigInt(wei)));
  return val.toFixed(precision) + " RITUAL";
}

// ─── RPC ──────────────────────────────────────────
let rpcId = 1;
async function rpcRequest(method, params) {
  try {
    const res = await fetch(RITUAL_CHAIN.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
  } catch (e) {
    if (state.account && state.provider) {
      return walletRequest(method, params);
    }
    throw e;
  }
}

async function readContract(address, abi, fnName, args = []) {
  const data = encodeFunctionData({ abi, functionName: fnName, args });
  const result = await rpcRequest("eth_call", [
    { to: getAddress(address), data },
    "latest",
  ]);
  return decodeFunctionResult({ abi, functionName: fnName, data: result });
}

async function getCode(address) {
  return rpcRequest("eth_getCode", [address, "latest"]);
}

// ─── DOM ──────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const els = {};

function initElements() {
  els.connectButton = $("connectButton");
  els.chainStatus = $("chainStatus");
  els.tabBar = $("tabBar");
  els.activityLog = $("activityLog");

  // Deploy
  els.deployPrompt = $("deployPrompt");
  els.deployModel = $("deployModel");
  els.deployProvider = $("deployProvider");
  els.deployApiKey = $("deployApiKey");
  els.apiKeyGroup = $("apiKeyGroup");
  els.deploySalt = $("deploySalt");
  els.deployExecutor = $("deployExecutor");
  els.deployDeposit = $("deployDeposit");
  els.deployLock = $("deployLock");
  els.previewButton = $("previewButton");
  els.deployButton = $("deployButton");
  els.deployStatus = $("deployStatus");
  els.previewResult = $("previewResult");

  // Manage
  els.manageAddress = $("manageAddress");
  els.manageFetch = $("manageFetch");
  els.manageResult = $("manageResult");
  els.mAddr = $("mAddr");
  els.mConfigured = $("mConfigured");
  els.mWakeMode = $("mWakeMode");
  els.mBalance = $("mBalance");
  els.mLock = $("mLock");
  els.mGenesis = $("mGenesis");
  els.manageRestart = $("manageRestart");
  els.manageStop = $("manageStop");
  els.manageTopup = $("manageTopup");

  // Scan
  els.scanButton = $("scanButton");
  els.scanCount = $("scanCount");
  els.scanResults = $("scanResults");

  // Panels
  els.panels = {
    deploy: $("panel-deploy"),
    manage: $("panel-manage"),
    scan: $("panel-scan"),
    activity: $("panel-activity"),
  };
}

// ─── Activity Log ─────────────────────────────────
function log(type, msg, tx) {
  const colors = { ok: "ok", err: "err", info: "info", tx: "info" };
  const time = new Date().toLocaleTimeString();
  let html = `<div class="entry"><span class="time">[${time}]</span> <span class="${colors[type] || "info"}">${msg}</span>`;
  if (tx) {
    const short = shortAddr(tx);
    html += ` <a href="${RITUAL_CHAIN.explorerUrl}/tx/${tx}" target="_blank" style="color:var(--accent)">${short}</a>`;
  }
  html += "</div>";
  els.activityLog.insertAdjacentHTML("beforeend", html);
  els.activityLog.scrollTop = els.activityLog.scrollHeight;
}

// ─── Wallet Management ────────────────────────────
async function connectWallet() {
  if (!hasWallet()) {
    log("err", "No wallet detected. Install MetaMask or Rabby.");
    return;
  }
  try {
    const accounts = await walletRequest("eth_requestAccounts");
    state.account = accounts[0];
    state.provider = window.ethereum;
    await switchToRitual();
    bindWalletEvents();
    await refreshWallet();
    log("ok", "Wallet connected: " + shortAddr(state.account));
  } catch (e) {
    log("err", "Connect failed: " + e.message);
  }
}

async function switchToRitual() {
  try {
    await walletRequest("wallet_switchEthereumChain", [{ chainId: RITUAL_CHAIN.hex }]);
  } catch (e) {
    if (e.code === 4902) {
      await walletRequest("wallet_addEthereumChain", [
        {
          chainId: RITUAL_CHAIN.hex,
          chainName: RITUAL_CHAIN.name,
          nativeCurrency: RITUAL_CHAIN.nativeCurrency,
          rpcUrls: [RITUAL_CHAIN.rpcUrl],
          blockExplorerUrls: [RITUAL_CHAIN.explorerUrl],
        },
      ]);
    } else {
      throw e;
    }
  }
  state.chainId = await walletRequest("eth_chainId");
}

function bindWalletEvents() {
  window.ethereum.on("accountsChanged", async (accounts) => {
    state.account = accounts[0] || "";
    await refreshWallet();
  });
  window.ethereum.on("chainChanged", async (chainId) => {
    state.chainId = chainId;
    await refreshWallet();
  });
}

async function refreshWallet() {
  if (state.account) {
    els.connectButton.textContent = shortAddr(state.account);
    els.connectButton.className = "wallet-button is-connected";
    const isRitual = state.chainId === RITUAL_CHAIN.hex;
    els.chainStatus.textContent = isRitual ? "✅ Ritual" : "⚠ Wrong Chain";
    els.chainStatus.className = "status-pill" + (isRitual ? " is-ready" : "");
  } else {
    els.connectButton.textContent = "Connect Wallet";
    els.connectButton.className = "wallet-button";
    els.chainStatus.textContent = "⏳ Disconnected";
    els.chainStatus.className = "status-pill";
  }
}

// ─── Tabs ─────────────────────────────────────────
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  Object.entries(els.panels).forEach(([key, panel]) => {
    panel.classList.toggle("active", key === tab);
  });
}

// ─── Executor Discovery ───────────────────────────
async function discoverExecutor() {
  try {
    const services = await readContract(REGISTRY, REGISTRY_ABI, "getServicesByCapability", [0, true]);
    if (!services || services.length === 0) throw new Error("No active executors");
    const svc = services[0];
    state.executor = svc.teeAddress;
    state.executorPubKey = svc.pubKey;
    els.deployExecutor.value = shortAddr(state.executor);
    log("info", `Executor: ${shortAddr(svc.teeAddress)}`);
    return svc;
  } catch (e) {
    log("err", "Executor discovery: " + e.message);
    throw e;
  }
}

// ─── Preview ──────────────────────────────────────
async function previewAgent() {
  const saltRaw = els.deploySalt.value || "agent-" + Date.now();
  const salt = keccak256(toHex(saltRaw));

  if (!state.account) {
    log("err", "Connect wallet first");
    return;
  }

  try {
    const [harness, actualSalt] = await readContract(
      FACTORY_ADDRESS, FACTORY_ABI, "predictHarness",
      [getAddress(state.account), salt]
    );
    state.predictedLauncher = harness;
    state._salt = salt;
    state._saltRaw = saltRaw;

    // Check if deployed
    const code = await getCode(harness);
    const exists = code !== "0x";

    // Fetch state if deployed
    let configured = false;
    let wakeMode = 0;
    if (exists) {
      try {
        configured = await readContract(harness, HARNESS_ABI, "configured", []);
        wakeMode = await readContract(harness, HARNESS_ABI, "wakeMode", []);
      } catch (_) {}
    }

    const labels = { 0: "Stopped", 1: "Armed", 2: "Sleeping" };
    els.previewResult.style.display = "block";
    els.previewResult.innerHTML = `
      <div class="row"><span class="label">Harness</span><span class="value" style="font-size:13px;color:var(--accent)">${harness}</span></div>
      <div class="row"><span class="label">Salt</span><span class="value" style="font-size:11px;color:var(--muted)">${saltRaw}</span></div>
      <div class="row"><span class="label">Deployed</span><span class="value ${exists ? 'state-armed' : ''}">${exists ? 'Yes' : 'No'}</span></div>
      ${exists ? `<div class="row"><span class="label">Configured</span><span class="value ${configured ? 'state-armed' : 'state-stopped'}">${configured}</span></div>
      <div class="row"><span class="label">Wake Mode</span><span class="value">${labels[wakeMode] || wakeMode}</span></div>
      <div class="row"><span class="label">Genesis</span><span class="value ${wakeMode === 1 ? 'state-armed' : 'state-stopped'}">${wakeMode === 1 ? '✅ Eligible' : 'Not armed'}</span></div>` : ''}
      <div class="row"><span class="label">Explorer</span><span class="value"><a href="${RITUAL_CHAIN.explorerUrl}/address/${harness}" target="_blank" style="color:var(--accent)">open ↗</a></span></div>
    `;

    log("info", `Predicted harness: ${shortAddr(harness)} (${exists ? "deployed" : "new"})`);
  } catch (e) {
    log("err", "Preview failed: " + e.message);
  }
}

// ─── Deploy ───────────────────────────────────────
async function deployAgent() {
  if (state.busy) return;
  if (!state.account) { log("err", "Connect wallet first"); return; }

  const saltRaw = els.deploySalt.value || "agent-" + Date.now();
  const salt = state._salt || keccak256(toHex(saltRaw));
  const prompt = els.deployPrompt.value || "You are a helpful AI assistant.";
  const model = els.deployModel.value;
  const provider = els.deployProvider.value;
  const apiKey = els.deployApiKey.value;
  const deposit = els.deployDeposit.value || "10";
  const lockBlocks = els.deployLock.value || "1000";
  const depositWei = parseEther(String(deposit));

  state.busy = true;
  els.deployButton.disabled = true;
  els.deployStatus.innerHTML = '<span class="spinner"></span> Deploying...';

  try {
    // 1. Discover executor
    log("info", "Discovering executor...");
    await discoverExecutor();

    // 2. Predict launcher
    // 2. Predict harness
    log("info", "Predicting harness address...");
    const [harness] = await readContract(
      FACTORY_ADDRESS, FACTORY_ABI, "predictHarness",
      [getAddress(state.account), salt]
    );
    state.predictedLauncher = harness;

    // 3. Deploy if needed
    const code = await getCode(harness);
    if (code === "0x") {
      log("info", "Deploying harness...");
      const deployData = encodeFunctionData({
        abi: FACTORY_ABI, functionName: "deployHarness", args: [salt],
      });
      const tx = await walletRequest("eth_sendTransaction", [{
        from: state.account,
        to: FACTORY_ADDRESS,
        data: deployData,
        gas: "0x3567e0", // 3,500,000
      }]);
      log("tx", "Harness deployed", tx);
      await waitForTx(tx);
    } else {
      log("ok", "Harness already deployed");
    }

    // 4. Encrypt secrets
    log("info", "Encrypting secrets...");
    let encryptedEnv = "0x";
    if (state.executorPubKey && state.executorPubKey !== "0x") {
      const envPayload = buildEnvPayload(provider, apiKey);
      encryptedEnv = await encryptRitualEnv(state.executorPubKey, envPayload);
    }

    // 5. Build sovereign agent params
    log("info", "Building configuration...");
    const emptyRef = { key: "", value: "", metadata: "" };

    const params = {
      executor: getAddress(state.executor),
      payment: depositWei,
      input: new TextEncoder().encode(prompt),
      maxDuration: 3600n,
      maxPollBlock: 100000n,
      programId: "ZeroClaw",
      deliveryAddress: getAddress(harness),
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

    const schedule = {
      callbackGasLimit: 500000,
      frequency: 2000,
      ttl: 500,
      gasPrice: 0n,
      maxPrice: parseEther("100"),
      value: 0n,
    };

    const rollingWindowSize = 5;
    const maxReserve = parseEther("0.5"); // extra reserve

    // 6. Deposit to RitualWallet if needed
    const walletBalData = encodeFunctionData({ abi: WALLET_ABI, functionName: "balanceOf", args: [state.account] });
    const walletBalHex = await rpcRequest("eth_call", [{ to: RITUAL_WALLET, data: walletBalData }, "latest"]);
    const walletBal = BigInt(walletBalHex || "0x0");

    if (walletBal < depositWei) {
      log("info", `Depositing ${deposit} RITUAL to RitualWallet...`);
      const depTx = await walletRequest("eth_sendTransaction", [{
        from: state.account,
        to: RITUAL_WALLET,
        data: encodeFunctionData({ abi: WALLET_ABI, functionName: "deposit", args: [] }),
        value: "0x" + (depositWei * 2n).toString(16),
      }]);
      log("tx", "Deposit sent", depTx);
      await waitForTx(depTx);
    }

    // 7. Send configureFundAndStart (payable, includes deposit+lock)
    log("info", "Sending configureFundAndStart...");
    const totalValue = depositWei + maxReserve; // deposit + reserve for gas
    const cfaData = encodeFunctionData({
      abi: FACTORY_ABI, functionName: "configureFundAndStart",
      args: [harness, params, schedule, rollingWindowSize, maxReserve],
    });
    const cfaTx = await walletRequest("eth_sendTransaction", [{
      from: state.account,
      to: FACTORY_ADDRESS,
      data: cfaData,
      value: "0x" + totalValue.toString(16),
      gas: "0x4c4b40", // 5,000,000
    }]);
    log("tx", "configureFundAndStart sent", cfaTx);
    await waitForTx(cfaTx);

    log("ok", "Agent deployed and armed! ✅");
    els.deployStatus.innerHTML = "✅ Deployed!";
    await previewAgent();

  } catch (e) {
    log("err", "Deploy failed: " + e.message);
    els.deployStatus.innerHTML = "❌ Failed: " + e.message;
  } finally {
    state.busy = false;
    els.deployButton.disabled = false;
  }
}

// ─── Wait for Transaction ─────────────────────────
async function waitForTx(hash) {
  for (let i = 0; i < 30; i++) {
    const receipt = await rpcRequest("eth_getTransactionReceipt", [hash]);
    if (receipt && receipt.blockNumber) {
      if (receipt.status === "0x1") {
        log("ok", "Tx confirmed in block " + BigInt(receipt.blockNumber).toString());
      } else {
        throw new Error("Tx reverted in block " + BigInt(receipt.blockNumber).toString());
      }
      return receipt;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Tx not confirmed after 60s");
}

// ─── Manage ───────────────────────────────────────
async function fetchAgent() {
  const addr = els.manageAddress.value.trim();
  if (!addr || !addr.startsWith("0x")) { log("err", "Invalid address"); return; }
  const agentAddr = getAddress(addr);
  els.manageResult.style.display = "block";
  els.mAddr.textContent = shortAddr(agentAddr);

  try {
    const code = await getCode(agentAddr);
    if (code === "0x") {
      els.mConfigured.textContent = "Not deployed";
      els.mConfigured.className = "value state-stopped";
      return;
    }

    const configured = await readContract(agentAddr, HARNESS_ABI, "configured", []);
    const wakeMode = await readContract(agentAddr, HARNESS_ABI, "wakeMode", []);

    els.mConfigured.textContent = String(configured);
    els.mConfigured.className = "value " + (configured ? "state-armed" : "state-stopped");

    const labels = { 0: "Stopped", 1: "Armed", 2: "Sleeping" };
    els.mWakeMode.textContent = labels[wakeMode] || wakeMode;
    els.mWakeMode.className = "value " + (wakeMode === 1 ? "state-armed" : "state-stopped");

    const balanceData = encodeFunctionData({ abi: WALLET_ABI, functionName: "balanceOf", args: [agentAddr] });
    const lockData = encodeFunctionData({ abi: WALLET_ABI, functionName: "lockOf", args: [agentAddr] });

    const balHex = await rpcRequest("eth_call", [{ to: RITUAL_WALLET, data: balanceData }, "latest"]);
    const lockHex = await rpcRequest("eth_call", [{ to: RITUAL_WALLET, data: lockData }, "latest"]);

    els.mBalance.textContent = formatRitual(BigInt(balHex || "0x0"));
    els.mLock.textContent = formatRitual(BigInt(lockHex || "0x0"));

    const genesisEligible = configured && wakeMode === 1;
    els.mGenesis.textContent = genesisEligible ? "✅ Eligible" : "❌ Not eligible";
    els.mGenesis.className = "value " + (genesisEligible ? "state-armed" : "state-stopped");

    log("ok", "Fetched agent: " + shortAddr(agentAddr));
  } catch (e) {
    log("err", "Fetch failed: " + e.message);
  }
}

async function manageAction(action) {
  const addr = els.manageAddress.value.trim();
  if (!addr) { log("err", "Enter agent address first"); return; }

  const { encodeFunctionData } = window.viem;
  const fnName = action;
  const gasLimit = action === "restart" ? "0x7a120" : "0x3567e0"; // 500k / 3.5M

  try {
    const data = encodeFunctionData({ abi: HARNESS_ABI, functionName: fnName, args: [] });
    const tx = await walletRequest("eth_sendTransaction", [{
      from: state.account,
      to: addr,
      data,
      gas: gasLimit,
    }]);
    log("tx", `${fnName} sent`, tx);
    await waitForTx(tx);
    log("ok", `${fnName} successful`);
    await fetchAgent();
  } catch (e) {
    log("err", `${fnName} failed: ` + e.message);
  }
}

// ─── Scan ─────────────────────────────────────────
async function scanAgents() {
  if (!state.account) { log("err", "Connect wallet first"); return; }

  els.scanResults.innerHTML = '<div class="entry"><span class="spinner"></span> Scanning...</div>';
  const owner = getAddress(state.account);
  const found = [];

  for (let i = 0; i < 30; i++) {
    const salt = keccak256(toHex("agent-" + i));
    try {
      const [launcher] = await readContract(
        FACTORY_ADDRESS, FACTORY_ABI, "predictHarness", [owner, salt]
      );
      const code = await getCode(launcher);
      if (code !== "0x") {
        let configured = false;
        let wakeMode = 0;
        let balance = "0";
        try {
          configured = await readContract(launcher, HARNESS_ABI, "configured", []);
          wakeMode = await readContract(launcher, HARNESS_ABI, "wakeMode", []);
          const b = await rpcRequest("eth_call", [{
            to: RITUAL_WALLET,
            data: encodeFunctionData({ abi: WALLET_ABI, functionName: "balanceOf", args: [launcher] }),
          }, "latest"]);
          balance = formatRitual(BigInt(b || "0x0"), 2);
        } catch (_) {}
        found.push({ addr: launcher, salt: "agent-" + i, configured, wakeMode, balance });
      }
    } catch (_) {}
  }

  if (found.length === 0) {
    els.scanResults.innerHTML = '<div style="color:var(--muted);padding:16px;">No agents found for this wallet.</div>';
  } else {
    const armed = found.filter((a) => a.wakeMode === 1).length;
    let html = "";
    for (const a of found) {
      const wl = { 0: "Stopped", 1: "Armed", 2: "Sleeping" };
      html += `<div class="scan-item">
        <span class="addr">${shortAddr(a.addr)}</span>
        <span>salt: ${a.salt}</span>
        <span class="badge ${a.wakeMode === 1 ? 'state-armed' : 'state-stopped'}" style="border:1px solid currentColor">${wl[a.wakeMode] || a.wakeMode}</span>
        <span>${a.balance}</span>
      </div>`;
    }
    els.scanResults.innerHTML = html;
    const badgeHtml = `<span style="margin-left:12px;font-size:12px;color:var(--muted)">${found.length} found · ${armed} armed ${armed > 0 ? '🎯' : ''}</span>`;
    els.scanCount.innerHTML = badgeHtml;
  }
  log("info", `Scan complete: ${found.length} agents`);
}

// ─── Event Listeners ──────────────────────────────
function init() {
  initElements();

  // Wallet
  els.connectButton.addEventListener("click", connectWallet);

  // Tabs
  els.tabBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-button");
    if (btn) switchTab(btn.dataset.tab);
  });

  // Provider toggle
  els.deployProvider.addEventListener("change", () => {
    const isRitual = els.deployProvider.value === "ritual";
    els.apiKeyGroup.style.display = isRitual ? "none" : "block";
  });

  // Deploy
  els.previewButton.addEventListener("click", previewAgent);
  els.deployButton.addEventListener("click", deployAgent);

  // Manage
  els.manageFetch.addEventListener("click", fetchAgent);
  els.manageRestart.addEventListener("click", () => manageAction("restart"));
  els.manageStop.addEventListener("click", () => manageAction("stop"));

  els.manageTopup.addEventListener("click", async () => {
    const addr = els.manageAddress.value.trim();
    if (!addr) return;
    try {
      const data = encodeFunctionData({ abi: WALLET_ABI, functionName: "deposit", args: [] });
      const tx = await walletRequest("eth_sendTransaction", [{
        from: state.account,
        to: RITUAL_WALLET,
        data,
        value: "0x" + parseEther("5").toString(16),
      }]);
      log("tx", "Top-up 5 RITUAL sent", tx);
      await waitForTx(tx);
      log("ok", "Top-up complete");
      await fetchAgent();
    } catch (e) {
      log("err", "Top-up failed: " + e.message);
    }
  });

  // Scan
  els.scanButton.addEventListener("click", scanAgents);

  // Auto-connect
  hydrateWallet();
}

async function hydrateWallet() {
  if (!hasWallet()) return;
  try {
    const accounts = await walletRequest("eth_accounts");
    if (accounts[0]) {
      state.account = accounts[0];
      state.provider = window.ethereum;
      state.chainId = await walletRequest("eth_chainId");
      bindWalletEvents();
      await refreshWallet();
    }
  } catch (_) {}
}

// ─── Start ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
