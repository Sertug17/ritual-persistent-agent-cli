// Ritual Contract Addresses & ABIs — Sovereign Agent Factory (matching UfukNode/zunmax)

export const RITUAL_CHAIN = {
  id: 1979,
  hex: "0x7bb",
  name: "Ritual Testnet",
  rpcUrl: "https://rpc.ritualfoundation.org",
  explorerUrl: "https://explorer.ritualfoundation.org",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
};

// Sovereign Agent Factory (what everyone uses for Genesis 1000)
export const FACTORY_ADDRESS = "0x9dC4C054e53bCc4Ce0A0Ff09E890A7a8e817f304";
export const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
export const REGISTRY = "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";
export const HEARTBEAT = "0xEF50b5E63808Ab7Ad7D978DD842c4A197a5B3aCa";

const STRING_TRIPLE = [
  { name: "key", type: "string" },
  { name: "value", type: "string" },
  { name: "metadata", type: "string" },
];

export const FACTORY_ABI = [
  // predictHarness
  {
    type: "function",
    name: "predictHarness",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [
      { name: "harness", type: "address" },
      { name: "actualSalt", type: "bytes32" },
    ],
  },
  // deployHarness
  {
    type: "function",
    name: "deployHarness",
    stateMutability: "nonpayable",
    inputs: [{ name: "salt", type: "bytes32" }],
    outputs: [],
  },
  // configureFundAndStart — what UfukNode and zunmax use
  {
    type: "function",
    name: "configureFundAndStart",
    stateMutability: "payable",
    inputs: [
      { name: "harness", type: "address" },
      {
        name: "params", type: "tuple",
        components: [
          { name: "executor", type: "address" },
          { name: "payment", type: "uint256" },
          { name: "input", type: "bytes" },
          { name: "maxDuration", type: "uint64" },
          { name: "maxPollBlock", type: "uint64" },
          { name: "programId", type: "string" },
          { name: "deliveryAddress", type: "address" },
          { name: "deliverySelector", type: "bytes4" },
          { name: "callbackGasLimit", type: "uint256" },
          { name: "gasPrice", type: "uint256" },
          { name: "maxPrice", type: "uint256" },
          { name: "cliType", type: "uint16" },
          { name: "prompt", type: "string" },
          { name: "encryptedEnv", type: "bytes" },
          { name: "inputRef", type: "tuple", components: STRING_TRIPLE },
          { name: "outputRef", type: "tuple", components: STRING_TRIPLE },
          { name: "assetRefs", type: "tuple[]", components: STRING_TRIPLE },
          { name: "proofRef", type: "tuple", components: STRING_TRIPLE },
          { name: "model", type: "string" },
          { name: "modelArgs", type: "string[]" },
          { name: "temperature", type: "uint16" },
          { name: "maxTokens", type: "uint32" },
          { name: "extra", type: "string" },
        ],
      },
      {
        name: "schedule", type: "tuple",
        components: [
          { name: "callbackGasLimit", type: "uint32" },
          { name: "frequency", type: "uint32" },
          { name: "ttl", type: "uint32" },
          { name: "gasPrice", type: "uint256" },
          { name: "maxPrice", type: "uint256" },
          { name: "value", type: "uint256" },
        ],
      },
      { name: "rollingWindowSize", type: "uint16" },
      { name: "maxReserve", type: "uint256" },
    ],
    outputs: [],
  },
];

// Harness ABI (for managing deployed agents)
export const HARNESS_ABI = [
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
        name: "services", type: "tuple[]",
        components: [
          { name: "teeAddress", type: "address" },
          { name: "pubKey", type: "bytes" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
];

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
];
