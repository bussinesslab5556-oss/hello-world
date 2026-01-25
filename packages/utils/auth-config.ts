
import { getSiteUrl } from './env-config.ts';

/**
 * Auth Configuration & Redirect Logic
 * Shared across Web and Mobile environments.
 */

export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  AZURE: 'azure', // Microsoft
  APPLE: 'apple',
} as const;

export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];

/**
 * Generates the correct redirect URL based on the environment.
 * Web uses the current origin, Mobile uses a deep link schema.
 */
export const getRedirectUrl = (): string => {
  // Check if we are in a browser environment
  const isWeb = typeof window !== 'undefined';
  
  if (isWeb) {
    // Standardized production callback path
    const siteUrl = getSiteUrl();
    return `${siteUrl}/auth/callback`;
  }

  // For React Native/Mobile: Redirect to the app's deep link
  return 'com.messaging.app://auth-callback';
};

export const AUTH_CONFIG = {
  providers: [
    { id: AUTH_PROVIDERS.GOOGLE, name: 'Google', icon: 'google' },
    { id: AUTH_PROVIDERS.FACEBOOK, name: 'Facebook', icon: 'facebook' },
    { id: AUTH_PROVIDERS.AZURE, name: 'Microsoft', icon: 'microsoft' },
    { id: AUTH_PROVIDERS.APPLE, name: 'Apple', icon: 'apple' },
  ],
  otpConfig: {
    expirySeconds: 60,
    length: 6,
  }
};
