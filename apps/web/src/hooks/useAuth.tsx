import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authClient, UsersApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

export interface User {
  id: string;
  email: string;
  emailConfirmed: boolean;
  role?: 'user' | 'admin';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const queryClient = useQueryClient();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  // ========== TOKEN REFRESH DEBOUNCE ==========
  // Store the in-flight refresh promise so concurrent callers can await the same operation
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  // Helper functions for cookie management
  const getCookie = useCallback((name: string): string | null => {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts[1];
      if (cookieValue !== undefined) {
        return cookieValue.split(';')[0] ?? null;
      }
    }
    return null;
  }, []);

  const setCookie = useCallback((name: string, value: string): void => {
    if (typeof document === 'undefined') return;

    document.cookie = `${name}=${value}; path=/; Secure; SameSite=Strict`;
  }, []);

  const deleteCookie = useCallback((name: string): void => {
    if (typeof document === 'undefined') return;

    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  }, []);

  // Decode JWT payload
  const decodeJWT = useCallback(
    (token: string): { exp?: number;[key: string]: unknown } | null => {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const base64Url = parts[1];
        if (base64Url === undefined) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
            .join('')
        );

        return JSON.parse(jsonPayload) as { exp?: number;[key: string]: unknown };
      } catch {
        return null;
      }
    },
    []
  );

  // Define logout early so it can be used in effects
  const logout = useCallback((): void => {
    deleteCookie('accessToken');
    deleteCookie('refreshToken');

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user');
    }

    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
    }

    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
    });

    void queryClient.clear();
  }, [deleteCookie, queryClient]);

  // Initialize auth state from storage on mount
  useEffect(() => {
    const accessToken = getCookie('accessToken');
    const refreshToken = getCookie('refreshToken');

    if (accessToken !== null && refreshToken !== null) {
      // Optimistically set user from local storage to avoid flash
      const userStr = localStorage.getItem('user');
      const localUser = userStr !== null ? (JSON.parse(userStr) as User) : null;

      if (localUser !== null) {
        setState({
          user: localUser,
          accessToken,
          refreshToken,
          isLoading: false, // Set loading false initially to show UI
          isAuthenticated: true,
        });
      }

      // Verify token and get fresh user data from backend
      void (async (): Promise<void> => {
        try {
          const payload = decodeJWT(accessToken);

          if (payload !== null && typeof payload === 'object' && 'sub' in payload) {
            // Fetch fresh user profile
            const usersApi = new UsersApi(apiConfig);
            const profile = await usersApi.usersControllerGetProfile();

            const user: User = {
              id: profile.id,
              email: profile.email,
              emailConfirmed: profile.emailConfirmed,
              role: profile.role === 'admin' ? 'admin' : 'user',
              createdAt: profile.createdAt.toString(),
            };

            // Update state with fresh data
            setState({
              user,
              accessToken,
              refreshToken,
              isLoading: false,
              isAuthenticated: true,
            });

            // Update local storage
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(user));
            }
          } else {
            // Invalid token structure
            logout();
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          // If we have a local user, we keep it (optimistic), otherwise stop loading
          if (localUser === null) {
            setState((prev) => ({ ...prev, isLoading: false }));
          }
          // If error is 401, we should probably logout, but for now let's be safe
        }
      })();
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [getCookie, decodeJWT, logout]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (state.refreshToken === null || !state.isAuthenticated) return;

    const scheduleRefresh = (): void => {
      const payload = decodeJWT(state.accessToken ?? '');
      if (payload === null || typeof payload !== 'object' || !('exp' in payload)) return;

      const expTime = typeof payload.exp === 'number' ? payload.exp * 1000 : null;
      if (expTime === null) return;

      const now = Date.now();
      const timeUntilExpiry = expTime - now;

      // Refresh 1 minute before expiry, but minimum 5 seconds to prevent rapid loops
      const refreshTime = Math.max(timeUntilExpiry - 60 * 1000, 5000);

      // If token is already expired or about to expire in less than 5 seconds, 
      // don't schedule - let the API call fail and trigger a logout
      if (timeUntilExpiry < 5000) {
        return;
      }

      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        void (async () => {
          // ========== TOKEN REFRESH DEBOUNCE ==========
          // If a refresh is already in progress, skip - the other caller will handle it
          if (isRefreshingRef.current) {
            console.debug('🔄 Scheduled refresh skipped - already in progress');
            return;
          }
          isRefreshingRef.current = true;

          // Create and store the promise for concurrent callers
          const refreshPromise = (async (): Promise<void> => {
            try {
              // Use SDK to refresh token
              const result = await authClient.refreshToken(state.refreshToken ?? '');

              setCookie('accessToken', result.accessToken);
              setCookie('refreshToken', result.refreshToken);

              setState((prev) => ({
                ...prev,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
              }));
              
              console.debug('✅ Scheduled token refresh completed');
              // Note: Don't call scheduleRefresh() here - the effect will re-run
              // due to state change and reschedule automatically
            } catch (error) {
              console.error('Token refresh failed:', error);
              // Logout on refresh failure
              logout();
            } finally {
              isRefreshingRef.current = false;
              refreshPromiseRef.current = null;
            }
          })();
          
          refreshPromiseRef.current = refreshPromise;
        })();
      }, refreshTime);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [
    state.refreshToken,
    state.accessToken,
    state.isAuthenticated,
    decodeJWT,
    setCookie,
    logout,
  ]);

  const login = useCallback(
    (accessToken: string, refreshToken: string, user: User): void => {
      setCookie('accessToken', accessToken);
      setCookie('refreshToken', refreshToken);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }

      setState({
        user,
        accessToken,
        refreshToken,
        isLoading: false,
        isAuthenticated: true,
      });

      void queryClient.invalidateQueries();
    },
    [setCookie, queryClient]
  );

  const refreshAccessToken = useCallback(async (): Promise<void> => {
    if (state.refreshToken === null) {
      throw new Error('No refresh token available');
    }

    // ========== TOKEN REFRESH DEBOUNCE ==========
    // If a refresh is already in progress, return the existing promise
    // This prevents duplicate API calls when multiple components request refresh simultaneously
    if (isRefreshingRef.current && refreshPromiseRef.current !== null) {
      console.debug('🔄 Token refresh already in progress, awaiting existing promise');
      return refreshPromiseRef.current;
    }
    
    isRefreshingRef.current = true;

    // Create the refresh promise and store it for concurrent callers
    const refreshPromise = (async (): Promise<void> => {
      try {
        // Use SDK to refresh token
        const result = await authClient.refreshToken(state.refreshToken ?? '');

        setCookie('accessToken', result.accessToken);
        setCookie('refreshToken', result.refreshToken);

        setState((prev) => ({
          ...prev,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }));
        
        console.debug('✅ Token refreshed successfully');
      } catch (error) {
        console.error('Token refresh error:', error);
        logout();
        throw error;
      } finally {
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();
    
    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [state.refreshToken, setCookie, logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
