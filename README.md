# Ritual Persistent Agent CLI

**Deploy and manage persistent agents on Ritual testnet — from your terminal.**

Part of the [Genesis 1000](https://x.com/ritualfnd/status/2069820943011303735) race: the first 1,000 wallets to spawn a persistent agent get etched into the on-chain registry forever.

## Features

- **Deploy** — Deploy a persistent agent with one command: prompt, model, salt, deposit
- **Status** — Check agent state (Armed/Stopped/Unconfigured), balance, lock
- **Scan** — Find all agents deployed from your wallet
- **Manage** — Restart, stop, top-up any agent
- **Encrypted secrets** — ECIES encryption with secp256k1 + AES-256-GCM (same as Ritual's official dApp)
- **Auto executor discovery** — Picks an available executor from TEEServiceRegistry
- **Config persistence** — Save private key, defaults, env overrides

## Installation

```bash
npm install -g ritual-persistent-agent-cli
```

Or run directly:

```bash
git clone https://github.com/your-username/ritual-persistent-agent-cli.git
cd ritual-persistent-agent-cli
npm install
node src/index.js --help
```

## Quick Start

### 1. Set up your private key

```bash
ritual config set-key 0xYourPrivateKey
```

Or use env var (don't save to shell history):

```bash
export RITUAL_PRIVATE_KEY=0xYourPrivateKey
```

### 2. Get test RITUAL tokens

```bash
ritual faucet
```

Opens the Ritual faucet page. Get an access code from [Ritual Discord](https://discord.gg/ritual-net) first.

### 3. Deploy your first persistent agent

```bash
ritual deploy --prompt "You are a helpful assistant" \
  --model claude-sonnet-4 \
  --salt myfirstagent \
  --deposit 10 \
  --lock 1000
```

### 4. Check your agent

```bash
ritual status 0xYourAgentAddress
```

### 5. Scan your wallet

```bash
ritual scan --limit 30
```

### 6. Manage your agent

```bash
ritual restart 0xYourAgentAddress
ritual stop 0xYourAgentAddress
ritual topup 0xYourAgentAddress --amount 5
```

## Commands

| Command | Description |
|---------|-------------|
| `deploy` | Deploy a new persistent agent |
| `status <address>` | Check agent state and balance |
| `scan` | Find all agents for your wallet |
| `restart <address>` | Restart a stopped agent |
| `stop <address>` | Stop an armed agent |
| `topup <address>` | Top up agent balance |
| `faucet` | Show faucet info |
| `config` | Manage CLI configuration |

### Deploy Options

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --prompt` | `You are a helpful AI assistant.` | Agent prompt / soul |
| `-m, --model` | `claude-sonnet-4` | LLM model |
| `-s, --salt` | random | Unique salt for deterministic address |
| `-d, --deposit` | `10` | Deposit in RITUAL |
| `-l, --lock` | `1000` | Lock blocks |
| `--provider` | `ritual` | LLM provider (ritual=free, or anthropic/openai/gemini/xai) |
| `--api-key` | env | LLM API key (not needed for ritual provider) |
| `--executor` | auto | Specific executor address |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `RITUAL_PRIVATE_KEY` | Wallet private key |
| `RITUAL_PROMPT` | Agent prompt |
| `RITUAL_MODEL` | LLM model |
| `RITUAL_PROVIDER` | LLM provider |
| `RITUAL_API_KEY` | LLM API key |

## Architecture

```
ritual deploy
  ├── 1. predictCompressedLauncher → deterministic agent address
  ├── 2. deployLauncherCompressed   → deploy launcher contract
  ├── 3. TEEServiceRegistry         → discover executor + pubkey
  ├── 4. ECIES encrypt secrets      → encrypt LLM API key
  ├── 5. RitualWallet deposit+lock  → fund agent
  └── 6. configureFundAndArm        → configure + fund + arm
```

## Network

| Parameter | Value |
|-----------|-------|
| Chain ID | `1979` |
| RPC | `https://rpc.ritualfoundation.org` |
| Explorer | `https://explorer.ritualfoundation.org` |
| Currency | RITUAL (18 decimals) |

### Contracts

| Contract | Address |
|----------|---------|
| PersistentAgentFactory | `0xD4AA9D55215dc8149Af57605e70921Ea16b73591` |
| RitualWallet | `0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948` |
| TEEServiceRegistry | `0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F` |
| AgentHeartbeat | `0xEF50b5E63808Ab7Ad7D978DD842c4A197a5B3aCa` |

## Genesis 1000

This CLI is built for the [Genesis 1000](https://x.com/ritualfnd/status/2069820943011303735) campaign.

- First 1,000 wallets to spawn a **persistent agent** get ranked
- Deploy time determines rarity of on-chain rank
- Claim with `/genesis_claim` in [Ritual Discord](https://discord.gg/ritual-net)

**Minimum requirements for Genesis eligibility:**
- Agent state = **Armed**
- Configured = **true**
- Wake mode = **1**
- Agent balance > **0**

## Security

- No private key is ever sent to any server
- All transactions are signed locally
- Secrets are ECIES-encrypted in the CLI before submission
- Uses only Ritual testnet RPC — no third-party backend

## License

MIT
