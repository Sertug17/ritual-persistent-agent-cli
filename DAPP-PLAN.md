# Ritual Persistent Agent dApp — Plan

## Why dApp?

CLI güzel ama herkes terminal kullanmıyor. dApp ile:
- Web'den cüzdan bağla, 2 tıklamayla persistent agent deploy et
- Genesis 1000 yarışında **ilk 1000'e girenlere** görsel bir araç
- Ritual topluluğuna hitap eder (UfukNode'un sovereign dApp'ine persistent alternatif)
- CLI + dApp = toolkit

## Stack

| Layer | Seçim | Sebep |
|-------|-------|-------|
| Framework | Vite + vanilla JS | UfukNode'la aynı, bağımlılık az, hızlı |
| Web3 | viem (CDN) | CLI'da zaten var, ABI'lar aynı |
| Wallet | ethers-providers / EIP-1193 | MetaMask, Rabby, OKX Wallet |
| ECIES | Web Crypto API | Browser native, import yok |
| State | localStorage | Basit, backend yok |
| UI | Ritual tarzı dark tema | Ritual'ün kendi sitesi gibi terminal estetiği |
| Deploy | GitHub Pages | CLI ile aynı repo, /dapp klasörü |

## Pages / Views

### 1. Deploy Page (ana sayfa)

Kullanıcı: prompt + model + salt + deposit + lock girer → Preview → Deploy + Arm

```
┌─────────────────────────────────────┐
│  🎯 Ritual Persistent Agent        │
│  Deploy - Manage - Scan             │
├─────────────────────────────────────┤
│  Wallet: 0x1234...5678 [Chain OK]  │
├─────────────────────────────────────┤
│  Prompt  [________________________] │
│  Model   [claude-sonnet-4    ▼    ] │
│  Provider[ritual             ▼    ] │
│  API Key [________________________] │
│  Salt    [my-agent-1               ] │
│  Deposit [10] RITUAL   Lock [1000]  │
│                                     │
│  [Preview → 0xabcd...ef01]        │
│  [🚀 Deploy + Arm]                  │
│                                     │
│  Agent: 0xabcd...ef01              │
│  State: Armed ✅                    │
│  Balance: 10 RITUAL                │
│  Configured: true                   │
│  Wake Mode: 1                       │
│  [Restart] [Stop] [Top Up]          │
└─────────────────────────────────────┘
```

### 2. Manage Page

Agent address gir → durumunu gör → restart/stop/topup yap

```
┌─────────────────────────────────────┐
│  Agent: 0xabcd...ef01              │
│  State: ████████████  Armed        │
│  Balance: 8.5 RITUAL               │
│  Locked: 10 RITUAL                 │
│  Configured: true                   │
│  Wake Mode: 1 (Armed)              │
│                                     │
│  [🔄 Restart] [⏹ Stop] [💰 Top Up]│
│                                     │
│  📊 Genesis 1000: ✅ ELIGIBLE      │
│  Deploy rank: #342                 │
└─────────────────────────────────────┘
```

### 3. Scan Page

Bağlı cüzdanın tüm agent'larını tara

```
┌─────────────────────────────────────┐
│  Wallet: 0x1234...5678             │
│  ─────────────────────────────     │
│  ✓ 0xabcd...ef01  Armed   10 RTL  │
│  ✓ 0x9876...dcba  Stopped  2 RTL  │
│  ✓ 0x4567...89ab  Armed    5 RTL  │
│                                     │
│  Found: 3 agents, 2 Armed          │
│  🎯 Genesis 1000: 2 eligible       │
└─────────────────────────────────────┘
```

### 4. Activity Log

Her transaction'ın log'u aşağıda akar (UfukNode'daki gibi).

## File Structure

```
ritual-persistent-agent-cli/
├── src/                    # CLI (existing)
│   └── commands/
│   └── lib/
├── dapp/                   # dApp (new)
│   ├── index.html          # Ana HTML
│   ├── main.js             # Tüm JS logic
│   ├── styles.css          # Dark tema
│   ├── abis.js             # Copy from CLI contracts
│   └── crypto.js           # ECIES (Web Crypto ile)
├── package.json
└── README.md
```

## Deployment

GitHub Actions workflow'u:
- `npm run build` CLI için
- dApp otomatik GitHub Pages'e deploy olur
- `https://sertug17.github.io/ritual-persistent-agent-cli/` adresinde yayın

## CLI'dan Farkı

| Özellik | CLI | dApp |
|---------|-----|------|
| Private key | Diske kaydedilir/env | Cüzdan imzalar, key girilmez |
| Transaction | Otomatik imzalanır | MetaMask onayı gerekir |
| Kullanım | Script/otomasyon | Web UI |
| Hedef | Developer | Herkes |
| Ritual provider | API key gerekmez | Aynı |

## Yapılacaklar

1. `dapp/` klasörü oluştur
2. `index.html` — layout, formlar, butonlar
3. `styles.css` — Ritual tarzı dark tema
4. `abis.js` — CLI'daki contract'lar
5. `crypto.js` — Web Crypto API ile ECIES
6. `main.js` — deploy, manage, scan logic
7. Deploy test
8. GitHub Actions Pages workflow'u ekle
