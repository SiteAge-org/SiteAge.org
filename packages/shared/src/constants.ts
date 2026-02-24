export const CDX_API_BASE = "https://web.archive.org/cdx/search/cdx";

export const BADGE_BASE_URL = "https://badge.siteage.org";
export const API_BASE_URL = "https://api.siteage.org";
export const WEB_BASE_URL = "https://siteage.org";

export const BADGE_CACHE_TTL = 3600; // 1 hour
export const DOMAIN_CACHE_TTL = 300; // 5 minutes
export const LOOKUP_CACHE_TTL = 86400; // 24 hours
export const LOOKUP_ERROR_CACHE_TTL = 300; // 5 minutes (for failed CDX queries)
export const REFRESH_COOLDOWN_TTL = 300; // 5 minutes (force refresh cooldown)
export const STATS_CACHE_TTL = 3600; // 1 hour
export const RATE_LIMIT_TTL = 60; // 60 seconds
export const RATE_LIMIT_MAX = 30; // 30 requests per minute

export const VERIFICATION_TOKEN_TTL = 86400; // 24 hours
export const TOMBSTONE_THRESHOLD = 5; // consecutive NXDOMAIN failures

export const DAILY_CHECK_MIN = 50;
export const DAILY_CHECK_MAX = 500;
export const DAILY_CHECK_PERCENT = 0.01; // 1% of total
export const PRIORITY_POOL_RATIO = 0.7; // 70% priority, 30% random

export const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds

export const BIRTH_DATE_TOLERANCE_DAYS = 365;

export const BADGE_STYLES = ["flat", "flat-square", "for-the-badge"] as const;
export const BADGE_COLORS = {
  active: "#007ec6",      // blue
  verified: "#d4a017",    // gold
  dead: "#9f9f9f",        // gray
  unknown: "#e05d44",     // orange
} as const;

export const BADGE_MESSAGE_TYPES = ["since", "established"] as const;
export const BADGE_TIME_FORMATS = ["year", "month", "date", "age", "days"] as const;
export const BADGE_VERIFIED_FORMATS = ["month", "date", "age", "days"] as const;
