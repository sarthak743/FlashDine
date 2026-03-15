import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  GoogleOAuthProvider,
  useGoogleLogin,
  googleLogout,
} from '@react-oauth/google';

// Replace with your actual Google OAuth Client ID from https://console.cloud.google.com/
// Set VITE_GOOGLE_CLIENT_ID in your .env file, or replace the fallback string below.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!GOOGLE_CLIENT_ID) {
  console.warn(
    '[FlashDine] Google OAuth Client ID is not configured.\n' +
    'Set VITE_GOOGLE_CLIENT_ID in your .env file to enable Google sign-in.\n' +
    'See .env.example for instructions.'
  );
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface AuthContextValue {
  user: GoogleUser | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Inner provider that has access to GoogleOAuthProvider
function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch user profile from Google
        const res = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch user info');
        const profile = await res.json();
        setUser({
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
        });
      } catch (_err) {
        setError('Google sign-in failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed.');
      setIsLoading(false);
    },
  });

  const logout = useCallback(() => {
    googleLogout();
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </GoogleOAuthProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
