// Ritual Contract Addresses & ABIs — dApp version (ES module)

export const RITUAL_CHAIN = {
  id: 1979,
  hex: "0x7bb",
  name: "Ritual Testnet",
  rpcUrl: "https://rpc.ritualfoundation.org",
  explorerUrl: "https://explorer.ritualfoundation.org",
};

export const FACTORY_ADDRESS = "0xD4AA9D55215dc8149Af57605e70921Ea16b73591";
export const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
export const REGISTRY = "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";
export const HEARTBEAT = "0xEF50b5E63808Ab7Ad7D978DD842c4A197a5B3aCa";

export const FACTORY_ABI = [
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
  {
    type: "function",
    name: "deployLauncherCompressed",
    stateMutability: "nonpayable",
    inputs: [{ name: "userSalt", type: "bytes32" }],
    outputs: [{ name: "launcher", type: "address" }],
  },
  {
    type: "function",
    name: "configureFundAndArm",
    stateMutability: "nonpayable",
    inputs: [
      { name: "launcher", type: "address" },
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
          { name: "inputRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "outputRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "assetRefs", type: "tuple[]", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
          { name: "proofRef", type: "tuple", components: [
            { name: "key", type: "string" },
            { name: "value", type: "string" },
            { name: "metadata", type: "string" },
          ]},
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
          { name: "period", type: "uint32" },
          { name: "payment", type: "uint32" },
          { name: "gasPrice", type: "uint256" },
          { name: "maxPrice", type: "uint256" },
          { name: "startBlock", type: "uint256" },
        ],
      },
      {
        name: "rolling", type: "tuple",
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
          { name: "url", type: "string" },
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
