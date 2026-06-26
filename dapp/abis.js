// Ritual Contract Addresses & ABIs — dApp version (corrected)

export const RITUAL_CHAIN = {
  id: 1979,
  hex: "0x7bb",
  name: "Ritual Testnet",
  rpcUrl: "https://rpc.ritualfoundation.org",
  explorerUrl: "https://explorer.ritualfoundation.org",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
};

export const FACTORY_ADDRESS = "0xD4AA9D55215dc8149Af57605e70921Ea16b73591";
export const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
export const REGISTRY = "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";
export const HEARTBEAT = "0xEF50b5E63808Ab7Ad7D978DD842c4A197a5B3aCa";

export const FACTORY_ABI = [
  // predictCompressedLauncher
  {
    type: "function",
    name: "predictCompressedLauncher",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "userSalt", type: "bytes32" },
    ],
    outputs: [
      { name: "launcher", type: "address" },
      { name: "actualSalt", type: "bytes32" },
    ],
  },
  // deployLauncherCompressed
  {
    type: "function",
    name: "deployLauncherCompressed",
    stateMutability: "nonpayable",
    inputs: [{ name: "userSalt", type: "bytes32" }],
    outputs: [{ name: "launcher", type: "address" }],
  },
  // configureFundAndArm — 26-field params struct for persistent agent
  {
    type: "function",
    name: "configureFundAndArm",
    stateMutability: "nonpayable",
    inputs: [
      { name: "launcher", type: "address" },
      // PersistentAgentParams (26 fields matching precompile 0x0820)
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "executor", type: "address" },
          { name: "encryptedSecrets", type: "bytes[]" },
          { name: "ttl", type: "uint256" },
          { name: "secretSignatures", type: "bytes[]" },
          { name: "userPublicKey", type: "bytes" },
          { name: "maxSpawnBlock", type: "uint64" },
          { name: "deliveryTarget", type: "address" },
          { name: "deliverySelector", type: "bytes4" },
          { name: "deliveryGasLimit", type: "uint256" },
          { name: "deliveryMaxFeePerGas", type: "uint256" },
          { name: "deliveryMaxPriorityFeePerGas", type: "uint256" },
          { name: "deliveryValue", type: "uint256" },
          { name: "provider", type: "uint8" },
          { name: "model", type: "string" },
          { name: "llmApiKeyRef", type: "string" },
          { name: "daConfig", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "soulRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "agentsRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "userRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "memoryRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "identityRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "toolsRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "openclawConfigRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "restoreFromCid", type: "string" },
          { name: "rpcUrls", type: "string" },
          { name: "agentRuntime", type: "uint16" },
        ],
      },
      // ScheduleConfig
      {
        name: "schedule",
        type: "tuple",
        components: [
          { name: "callbackGasLimit", type: "uint32" },
          { name: "period", type: "uint32" },
          { name: "payment", type: "uint32" },
          { name: "gasPrice", type: "uint256" },
          { name: "maxPrice", type: "uint256" },
          { name: "startBlock", type: "uint256" },
        ],
      },
      // RollingConfig
      {
        name: "rolling",
        type: "tuple",
        components: [
          { name: "enabled", type: "uint32" },
          { name: "window", type: "uint16" },
          { name: "repeat", type: "uint16" },
        ],
      },
      { name: "deposit", type: "uint256" },
      { name: "lockBlocks", type: "uint256" },
    ],
    outputs: [],
  },
];

// Launcher/Harness ABI
export const LAUNCHER_ABI = [
  {
    type: "function",
    name: "configured",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "wakeMode",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "restart",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "stop",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
];

// TEEServiceRegistry ABI
export const REGISTRY_ABI = [
  {
    type: "function",
    name: "getServicesByCapability",
    stateMutability: "view",
    inputs: [
      { name: "capability", type: "uint8" },
      { name: "onlyActive", type: "bool" },
    ],
    outputs: [
      {
        name: "services",
        type: "tuple[]",
        components: [
          { name: "teeAddress", type: "address" },
          { name: "pubKey", type: "bytes" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
];

// RitualWallet ABI
export const WALLET_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "lockOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "lock",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "depositFor",
    stateMutability: "payable",
    inputs: [{ name: "account", type: "address" }],
    outputs: [],
  },
];
