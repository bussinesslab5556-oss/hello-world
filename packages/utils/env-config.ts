
/**
 * Neural Integrity Environment Bridge
 * Production-grade sanitization for Supabase/Azure keys.
 */

export const getEnv = (key: string): string => {
  const searchKeys = [
    key,
    `VITE_${key}`,
    `NEXT_PUBLIC_${key}`,
    `REACT_APP_${key}`
  ];

  let rawValue = '';

  // 1. PRIORITY 1: Explicit Window Injection (index.html)
  if (typeof window !== 'undefined') {
    const win = window as any;
    for (const k of searchKeys) {
      if (win[k] && typeof win[k] === 'string' && win[k].length > 0) {
        rawValue = win[k];
        break;
      }
    }
  }

  // 2. PRIORITY 2: Process Environment (Node/Build-time)
  if (!rawValue && typeof process !== 'undefined' && (process as any).env) {
    const env = (process as any).env;
    for (const k of searchKeys) {
      if (env[k]) {
        rawValue = env[k];
        break;
      }
    }
  }

  // 3. PRIORITY 3: ESM Meta Env (Vite)
  if (!rawValue) {
    try {
      const metaEnv = (import.meta as any).env;
      if (metaEnv) {
        for (const k of searchKeys) {
          if (metaEnv[k]) {
            rawValue = metaEnv[k];
            break;
          }
        }
      }
    } catch (e) {}
  }

  if (!rawValue) return '';

  /**
   * PRODUCTION-GRADE PURGE
   * Strips all single/double quotes, backticks, spaces, and newlines.
   */
  return rawValue
    .toString()
    .replace(/['"`\s\n\r]+/g, '') 
    .trim();
};

/**
 * Returns the base site URL for auth redirects.
 */
export const getSiteUrl = (): string => {
  const siteUrl = getEnv('SITE_URL');
  if (siteUrl) return siteUrl;
  
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return 'http://localhost:3000';
};

export const debugEnv = () => {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_ANON_KEY');
  
  console.group('Integrity Audit: Neural Discovery');
  console.log('SUPABASE_URL:', url || 'MISSING');
  console.log('SITE_URL:', getSiteUrl());
  console.log('SUPABASE_ANON_KEY JWT Prefix (ey):', key ? key.startsWith('ey') : false);
  console.groupEnd();
  
  return { url, key };
};
