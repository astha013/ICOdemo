/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ICO_TOKEN_ADDRESS: string;
  readonly VITE_ICO_STORAGE_ADDRESS: string;
  readonly VITE_SEPOLIA_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
