import { create } from 'zustand';
import {
  apiClient,
  apiGet,
  apiPost,
  clearStoredTokens,
  extractErrorMessage,
  getStoredAccessToken,
  setStoredAccessToken,
} from './api-client';
import { tMessage } from '@/lib/i18n/get-message';

export interface AuthUser {
  id: string;
  tenant_id: string;
  username: string;
  email: string;
  role_id?: string;
  role?: {
    id: string;
    code: 'ADMIN' | 'MANAGER' | 'STAFF' | string;
    name: string;
  };
  status?: string;
  tenantName?: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  // refresh_token is now an HttpOnly cookie — not held in client state.
  // Field kept for type compatibility; always null at runtime.
  refreshToken: null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (params: {
    tenantName: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

interface AuthPayload {
  access_token: string;
  // refresh_token is stripped by the controller and sent as an HttpOnly cookie.
  // It may be absent in the response body.
  refresh_token?: string;
  user: AuthUser;
  tenant?: { id: string; name: string; slug?: string };
}

function extractRole(raw: AuthUser): AuthUser['role'] | undefined {
  if (raw.role?.code) {
    return {
      id: String(raw.role.id ?? (raw.role as { _id?: string })._id ?? ''),
      code: String(raw.role.code).toUpperCase(),
      name: raw.role.name,
    };
  }

  const roleRef = raw.role_id as unknown;
  if (roleRef && typeof roleRef === 'object' && 'code' in roleRef) {
    const roleObj = roleRef as { _id?: string; id?: string; code: string; name: string };
    return {
      id: String(roleObj.id ?? roleObj._id ?? ''),
      code: String(roleObj.code).toUpperCase(),
      name: roleObj.name,
    };
  }

  return undefined;
}

function mapUser(raw: AuthUser, tenant?: AuthPayload['tenant']): AuthUser {
  const id = String(raw.id ?? (raw as { _id?: string })._id ?? '');
  const role = extractRole(raw);
  return {
    ...raw,
    id,
    tenant_id: String(raw.tenant_id ?? tenant?.id ?? ''),
    tenantName: tenant?.name,
    role,
    role_id: role?.id ?? (raw.role_id ? String(raw.role_id) : undefined),
  };
}

function applySession(
  set: (partial: Partial<AuthState>) => void,
  payload: AuthPayload,
) {
  const user = mapUser(payload.user, payload.tenant);
  setStoredAccessToken(payload.access_token);
  // If the backend still sends refresh_token in the response body (pre-HttpOnly-cookie
  // deployment), persist it in localStorage so the refresh interceptor can use it.
  // Once the backend deploys cookie support the token will come via Set-Cookie instead
  // and this branch will be a no-op.
  if (payload.refresh_token && typeof window !== 'undefined') {
    localStorage.setItem('refresh_token', payload.refresh_token);
  }
  apiClient.defaults.headers.common.Authorization = `Bearer ${payload.access_token}`;
  set({
    user,
    accessToken: payload.access_token,
    refreshToken: null,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
}

// Module-level flag so checkAuth is a no-op after the first successful hydration.
// Reset on logout so a fresh login re-hydrates correctly.
let sessionHydrated = false;

// Mutex: ensures only one checkAuth network round-trip happens at a time.
// AuthProvider (root layout) and AuthGuard (dashboard layout) both call checkAuth
// on mount — without this they fire two parallel /auth/profile requests.
let checkAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiPost<AuthPayload>('/auth/login', { email, password });
      applySession(set, data);
    } catch (error) {
      const errorMessage = extractErrorMessage(error, tMessage('auth.loginFailed'));
      set({ error: errorMessage, isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  signup: async ({ tenantName, username, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiPost<AuthPayload>('/auth/register', {
        tenantName,
        username,
        email,
        password,
      });
      applySession(set, data);
    } catch (error) {
      const errorMessage = extractErrorMessage(error, tMessage('auth.signupFailed'));
      set({ error: errorMessage, isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  logout: async () => {
    sessionHydrated = false;
    try {
      await apiPost('/auth/logout');
    } catch {
      // ignore — clear local session anyway
    } finally {
      delete apiClient.defaults.headers.common.Authorization;
      clearStoredTokens();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: user !== null });
  },

  clearError: () => {
    set({ error: null });
  },

  checkAuth: async () => {
    // Skip the network round-trip if this session is already verified.
    if (sessionHydrated && get().isAuthenticated) return;

    // Deduplicate concurrent calls (AuthProvider + AuthGuard both mount on initial load).
    if (checkAuthPromise) return checkAuthPromise;

    checkAuthPromise = (async () => {
      const storedAccess =
        get().accessToken ??
        getStoredAccessToken() ??
        // Graceful migration: read legacy localStorage token one last time.
        (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

      if (!storedAccess) {
        // No access token and no cookie — can't hydrate without a network call.
        // The response interceptor will attempt a cookie-based refresh on the first 401.
        set({ isAuthenticated: false, user: null });
        return;
      }

      setStoredAccessToken(storedAccess);
      apiClient.defaults.headers.common.Authorization = `Bearer ${storedAccess}`;

      try {
        const profile = await apiGet<AuthUser>('/auth/profile');
        let user = mapUser(profile);

        // Fallback: if profile doesn't include a populated role object, fetch it separately.
        if (!user.role?.code && user.role_id) {
          try {
            const role = await apiGet<{ id: string; code: string; name: string }>(
              `/rbac/roles/${user.role_id}`,
            );
            user = {
              ...user,
              role: {
                id: String(role.id ?? user.role_id),
                code: String(role.code).toUpperCase(),
                name: role.name,
              },
            };
          } catch {
            // ignore — role will be missing but user is still authenticated
          }
        }

        sessionHydrated = true;
        set({
          user,
          accessToken: storedAccess,
          refreshToken: null,
          isAuthenticated: true,
        });
      } catch {
        clearStoredTokens();
        delete apiClient.defaults.headers.common.Authorization;
        set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
      }
    })().finally(() => {
      checkAuthPromise = null;
    });

    return checkAuthPromise;
  },
}));

export default apiClient;
