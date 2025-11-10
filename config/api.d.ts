// Type declarations for config/api.js so TypeScript can type-check imports
export interface ApiConfig {
  BASE_URL: string;
  TIMEOUT: number;
  HEADERS?: Record<string, string>;
}

export const API_CONFIG: ApiConfig;