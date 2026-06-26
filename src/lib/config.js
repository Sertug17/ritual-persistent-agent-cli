// Persistent config storage

import Conf from "conf";

const config = new Conf({
  projectName: "ritual-persistent-agent",
  schema: {
    privateKey: {
      type: "string",
      default: "",
    },
    rpcUrl: {
      type: "string",
      default: "https://rpc.ritualfoundation.org",
    },
    defaultProvider: {
      type: "string",
      default: "ritual",
    },
    defaultDeposit: {
      type: "string",
      default: "10",
    },
    defaultLock: {
      type: "string",
      default: "1000",
    },
  },
});

export function getPrivateKey() {
  return config.get("privateKey");
}

export function setPrivateKey(key) {
  config.set("privateKey", key);
}

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function clearConfig() {
  config.clear();
}

export function getAllConfig() {
  return config.store;
}

export default config;
