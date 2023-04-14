import { ARBITRUM, ARBITRUM_TESTNET, AVALANCHE, MAINNET, CHAIN_ID, DEFAULT_CHAIN_ID } from "./chains";

export const UNIP_STATS_API_URL = {
  [ARBITRUM_TESTNET]: "https://arbgoerli.api.uniperp.io",
  [ARBITRUM]: "https://api.uniperp.io",
}

const BACKEND_URLS = {
  default: "https://gmx-server-mainnet.uw.r.appspot.com",
  [MAINNET]: "https://gambit-server-staging.uc.r.appspot.com",
  [ARBITRUM_TESTNET]: "https://gambit-server-devnet.uc.r.appspot.com",
  [ARBITRUM]: "https://gmx-server-mainnet.uw.r.appspot.com",
  [AVALANCHE]: "https://gmx-avax-server.uc.r.appspot.com",
};

export function getServerBaseUrl(chainId: number) {
  if (!chainId) {
    throw new Error("chainId is not provided");
  }

  if (document.location.hostname.includes("deploy-preview")) {
    const fromLocalStorage = localStorage.getItem("SERVER_BASE_URL");
    if (fromLocalStorage) {
      return fromLocalStorage;
    }
  }

  return BACKEND_URLS[chainId] || BACKEND_URLS.default;
}

export function getServerUrl(chainId: number, path: string) {
  return `${getServerBaseUrl(chainId)}${path}`;
}

export function getServerUrlNew(chainId: number, path: string) {
  if (chainId && UNIP_STATS_API_URL.hasOwnProperty(chainId)){
    return `${UNIP_STATS_API_URL[chainId]}${path}`;
  }
  return `${UNIP_STATS_API_URL[DEFAULT_CHAIN_ID]}${path}`;
}
