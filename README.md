# ⚡ Ritual Sovereign Agent

**Deploy, manage, and monitor AI agents on [Ritual Chain](https://ritual.net) — from your terminal or browser.**

[![Built on Ritual](https://img.shields.io/badge/Built%20on-Ritual%20Chain-8A2BE2)](https://ritual.net)
[![Genesis 1000](https://img.shields.io/badge/Genesis%201000-Eligible-00FF00)](https://x.com/ritualfnd/status/2069820943011303735)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 🏆 **Genesis 1000 Ready** — Deploy your Sovereign Agent and secure your on-chain rank among the first 1,000 wallets.

![Agent Deployed](https://img.shields.io/badge/status-deployed%20%7C%20armed-success)

---

## ✨ Features

| | Feature | Details |
|---|---------|---------|
| 🖥️ | **CLI** | Full-featured terminal client |
| 🌐 | **Web dApp** | No-install browser interface — [try it now](https://sertug17.github.io/ritual-persistent-agent-cli/) |
| 🤖 | **Sovereign Agent deploy** | One-shot agent with configurable prompt, model, schedule |
| 🔍 | **Agent status** | Check state (Armed/Stopped), configuration, wake mode |
| 🎯 | **Genesis 1000 check** | Eligibility status at a glance |
| 🔄 | **Restart / Stop** | Manage running agents |
| 🔐 | **Encrypted secrets** | ECIES encryption with secp256k1 + AES-256-GCM |
| 🏗️ | **Deterministic addresses** | Predictable agent addresses from salt |
| 📋 | **Wallet scan** | Find all agents deployed from your wallet |

---

## 🚀 Quick Start

### Web dApp (no install)

Open **[https://sertug17.github.io/ritual-persistent-agent-cli/](https://sertug17.github.io/ritual-persistent-agent-cli/)**

1. Connect your wallet (MetaMask / WalletConnect)
2. Enter your agent prompt (e.g. *"You are a price monitor. Fetch ETH/USD every 10 minutes and alert on 5% drops."*)
3. Pick a model and salt
4. Click **Deploy + Arm**

Your agent will be live on Ritual testnet in ~30 seconds.

### CLI

```bash
# Install
npm install -g ritual-persistent-agent-cli

# Or run directly
git clone https://github.com/Sertug17/ritual-persistent-agent-cli.git
cd ritual-persistent-agent-cli
npm install

# Configure
export RITUAL_PRIVATE_KEY=0xYourPrivateKey

# Deploy your first Sovereign Agent
ritual deploy --prompt "You are a helpful AI assistant." \
  --model claude-sonnet-4 \
  --salt my-agent

# Check status
ritual status 0xYourAgentAddress

# Manage
ritual restart 0xYourAgentAddress
ritual stop 0xYourAgentAddress
```

---

## 📸 Screenshots

```
┌─────────────────────────────────────────────┐
│  ⚡ Sovereign Agent           Ritual Testnet │
│  ┌─────────────────────────────────────────┐│
│  │ ✅ Deployed!                            ││
│  │                                         ││
│  │  Harness      0x6ba5...7246             ││
│  │  Deployed     Yes                       ││
│  │  Configured   true                      ││
│  │  Wake Mode    Armed                     ││
│  │  Genesis      ✅ Eligible               ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## 🧠 What Can You Build?

Sovereign Agents on Ritual Chain can run any AI task with on-chain verification:

| Use Case | Prompt Suggestion | Precompiles Used |
|----------|------------------|------------------|
| 💰 **Price Monitor** | *"Fetch ETH/USD price every 10 minutes, store on-chain, alert on 5% drops"* | HTTP + Scheduler |
| 🤖 **AI Chatbot** | *"Respond to user messages with streaming LLM responses"* | LLM |
| 📊 **Data Aggregator** | *"Collect data from multiple APIs, summarize with LLM, store result"* | HTTP + LLM + Scheduler |
| 🖼️ **NFT Generator** | *"Generate images from text prompts and mint as NFTs"* | Image Precompile |
| 🔔 **Alert Bot** | *"Monitor blockchain events and send notifications"* | HTTP + Scheduler |

---

## 🏗️ Architecture

```
ritual deploy
  ├── 1. predictHarness          → deterministic agent address
  ├── 2. deployHarness            → deploy harness contract
  ├── 3. TEEServiceRegistry       → discover executor + pubkey
  ├── 4. ECIES encrypt secrets    → encrypt LLM API key
  ├── 5. RitualWallet deposit     → fund agent
  └── 6. configureFundAndStart    → configure + fund + arm (sent to harness)
```

### Contract Addresses (Ritual Testnet)

| Contract | Address |
|----------|---------|
| SovereignAgentFactory | `0x9dC4C054e53bCc4Ce0A0Ff09E890A7a8e817f304` |
| RitualWallet | `0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948` |
| TEEServiceRegistry | `0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F` |
| AgentHeartbeat | `0xEF50b5E63808Ab7Ad7D978DD842c4A197a5B3aCa` |

---

## 🌐 Network

| Parameter | Value |
|-----------|-------|
| Chain ID | `1979` |
| RPC | `https://rpc.ritualfoundation.org` |
| Explorer | `https://explorer.ritualfoundation.org` |
| Currency | RITUAL (18 decimals) |
| Faucet | `https://faucet.ritualfoundation.org` |

---

## 🏅 Genesis 1000

This tool is built for the [Genesis 1000](https://x.com/ritualfnd/status/2069820943011303735) campaign.

| Requirement | Status |
|------------|--------|
| Agent state = **Armed** | ✅ |
| Configured = **true** | ✅ |
| Wake mode = **1** | ✅ |
| Agent balance > **0** | ✅ |

Claim your rank with `/genesis_claim` in [Ritual Discord](https://discord.gg/ritual-net).

---

## 🔒 Security

- Private keys stay local — never sent to any server
- All transactions signed locally in your browser or terminal
- Secrets encrypted with ECIES before submission
- Pure client-side — no third-party backend

---

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `ritual deploy` | Deploy a new Sovereign Agent |
| `ritual status <address>` | Check agent state and Genesis eligibility |
| `ritual scan` | Find agents deployed from your wallet |
| `ritual restart <address>` | Restart a stopped agent |
| `ritual stop <address>` | Stop an armed agent |
| `ritual topup <address>` | Top up agent balance |
| `ritual faucet` | Show faucet info |
| `ritual config` | Manage CLI configuration |

### Deploy Options

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --prompt` | `You are a helpful AI assistant.` | Agent prompt / soul |
| `-m, --model` | `claude-sonnet-4` | LLM model |
| `-s, --salt` | random | Unique salt for deterministic address |
| `-d, --deposit` | `10` | Deposit in RITUAL |
| `-l, --lock` | `1000` | Lock blocks |
| `--provider` | `ritual` | LLM provider |
| `--api-key` | env | LLM API key |
| `--executor` | auto | Specific executor address |

---

## 📄 License

MIT — use it, fork it, ship it.

---

*Built on [Ritual Chain](https://ritual.net) — the sovereign chain for autonomous AI agents.*
