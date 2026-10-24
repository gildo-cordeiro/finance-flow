/// <reference types="vite/client" />

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: string): string;
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
}

declare const process: {
  cwd(): string;
};

interface ImportMetaEnv {
  readonly VITE_PRIVACY_VERSION?: string;
}
