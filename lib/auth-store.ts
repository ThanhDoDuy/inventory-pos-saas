import { create } from 'zustand';
import {
  apiClient,
  apiGet,
  apiPost,
  clearStoredTokens,
  extractErrorMessage,
  setStoredTokens,
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
  refreshToken: string | null;
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
  refresh_token: string;
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
  setStoredTokens(payload.access_token, payload.refresh_token);
  apiClient.defaults.headers.common.Authorization = `Bearer ${payload.access_token}`;
  set({
    user,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
}

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
    const { accessToken, refreshToken } = get();
    const storedAccess = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
    const storedRefresh = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);

    if (!storedAccess && !storedRefresh) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    if (storedAccess && storedRefresh) {
      setStoredTokens(storedAccess, storedRefresh);
      apiClient.defaults.headers.common.Authorization = `Bearer ${storedAccess}`;
    }

    try {
      const profile = await apiGet<AuthUser>('/auth/profile');
      let user = mapUser(profile);

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
          // profile should include role after BE fix; ignore fallback errors
        }
      }

      set({
        user,
        accessToken: storedAccess,
        refreshToken: storedRefresh,
        isAuthenticated: true,
      });
    } catch {
      clearStoredTokens();
      delete apiClient.defaults.headers.common.Authorization;
      set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
    }
  },
}));

export default apiClient;
