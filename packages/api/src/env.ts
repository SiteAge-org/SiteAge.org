export interface Env {
  DB: D1Database;
  API_CACHE: KVNamespace;
  BADGE_CACHE: KVNamespace;
  ADMIN_KEY: string;
  RESEND_API_KEY: string;
  ENVIRONMENT: string;
  CDX_API_BASE?: string;
}
