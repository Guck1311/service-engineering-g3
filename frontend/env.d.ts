/// <reference types="vite/client" />

// Typed environment variables (see .env).
interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
