// Cloudflare env types for OpenNext
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: {
    last_row_id?: number;
    changes?: number;
    served_by?: string;
    duration?: number;
    rows_read?: number;
    rows_written?: number;
  };
}
