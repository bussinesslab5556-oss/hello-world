/**
 * Environment Bridge Utility
 * Handles cross-platform environment variable retrieval.
 * Optimized for both build-time replacement and runtime window injection.
 */

export const getEnv = (key: string): string => {
  // 1. Check Window Object first (for browser/dev environments where variables are injected via script)
  if (typeof window !== 'undefined') {
    const win = window as any;
    const val = win[key] || win[`VITE_${key}`] || win[`NEXT_PUBLIC_${key}`];
    if (val) return val.trim();
  }

  // 2. Build-time checks for SUPABASE_URL
  if (key === 'SUPABASE_URL') {
    const val = 
      (typeof process !== 'undefined' && (process as any).env ? (
        (process as any).env.SUPABASE_URL || 
        (process as any).env.VITE_SUPABASE_URL || 
        (process as any).env.NEXT_PUBLIC_SUPABASE_URL
      ) : '') ||
      (typeof (import.meta as any).env !== 'undefined' ? (
        (import.meta as any).env.VITE_SUPABASE_URL || 
        (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL
      ) : '');
    
    if (val) return val.trim();
  }

  // 3. Build-time checks for SUPABASE_ANON_KEY
  if (key === 'SUPABASE_ANON_KEY') {
    const val = 
      (typeof process !== 'undefined' && (process as any).env ? (
        (process as any).env.SUPABASE_ANON_KEY || 
        (process as any).env.VITE_SUPABASE_ANON_KEY || 
        (process as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) : '') ||
      (typeof (import.meta as any).env !== 'undefined' ? (
        (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 
        (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) : '');
    
    if (val) return val.trim();
  }

  return '';
};

export const debugEnv = () => {
  console.group('Environment Injection Debugger');
  
  if (typeof window !== 'undefined') {
    console.log('Window Config:', {
      SUPABASE_URL: (window as any).SUPABASE_URL ? 'PRESENT' : 'MISSING',
      VITE_SUPABASE_URL: (window as any).VITE_SUPABASE_URL ? 'PRESENT' : 'MISSING'
    });
  }

  if (typeof process !== 'undefined' && (process as any).env) {
    console.log('process.env keys found:', Object.keys((process as any).env).length);
  }

  console.groupEnd();
};
