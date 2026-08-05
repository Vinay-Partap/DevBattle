import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Role, User, UserStatus } from '../types';
import { generateAvatar } from '../utils/avatar';
import { TOKEN_STORAGE_KEY, setAuthToken } from '../utils/api';
import { useToast } from './ToastContext';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, 'admin'>;
  collegeId: string;
  branchName?: string;
  batchName?: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: User;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  token: string | null;
  role: Role;
  users: User[];
  pendingUsers: User[];
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  register: (input: RegisterInput) => Promise<AuthResult>;
  approveUser: (userId: string, assignedRole: Role) => Promise<AuthResult>;
  rejectUser: (userId: string) => Promise<AuthResult>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<AuthResult>;
  updateUserRole: (userId: string, role: Role) => Promise<AuthResult>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  refreshUsersList: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapBackendUserToFrontendUser = (bu: any): User => {
  const name = `${bu.firstName || ''} ${bu.lastName || ''}`.trim() || bu.email.split('@')[0];
  return {
    id: bu.id,
    name,
    email: bu.email,
    avatar: bu.avatarUrl || generateAvatar(name),
    role: bu.role || 'student',
    status: bu.isActive ? 'active' : 'suspended',
    collegeId: bu.collegeId || undefined,
    collegeName: bu.collegeId ? 'KR Mangalam University' : undefined,
    branchName: bu.branchId || undefined,
    batchName: bu.batchId || undefined,
    joinedAt: bu.createdAt ? new Date(bu.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    xp: bu.xp ?? 0,
    rank: bu.rank ?? 0,
    streak: bu.streak ?? 0,
    problemsSolved: bu.problemsSolved ?? 0,
    githubUrl: bu.socialLinks?.github || undefined,
    bio: bu.bio || undefined,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [authLoading, setAuthLoading] = useState<boolean>(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);

  const setToken = useCallback((nextToken: string | null) => {
    setTokenState(nextToken);
    setAuthToken(nextToken);
  }, []);

  // Load profile when token is present
  const fetchProfile = useCallback(async (authToken: string): Promise<User> => {
    const res = await fetch('/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success || !json.data) {
      throw new Error(json?.message || 'Failed to fetch profile');
    }

    const fUser = mapBackendUserToFrontendUser(json.data);
    setCurrentUser(fUser);
    return fUser;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (!token) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      try {
        await fetchProfile(token);
      } catch (err) {
        console.error('Error fetching current user profile:', err);
        if (!cancelled) {
          setCurrentUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [token, fetchProfile, setToken]);

  // Load all users list if admin/mentor
  const refreshUsersList = useCallback(async () => {
    if (!token || !currentUser || currentUser.role === 'student') return;

    try {
      const res = await fetch('/api/v1/users?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && Array.isArray(json.data.items)) {
          const mapped = json.data.items.map(mapBackendUserToFrontendUser);
          setUsers(mapped.filter((u: User) => u.status === 'active'));
          // In real backend, unverified or inactive users from user-service are "pending"
          setPendingUsers(mapped.filter((u: User) => u.status === 'suspended'));
        }
      }
    } catch (err) {
      console.error('Error listing users:', err);
    }
  }, [token, currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'student') {
      refreshUsersList();
    }
  }, [currentUser, refreshUsersList]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { ok: false, error: json.message || 'Incorrect credentials.' };
      }

      const { accessToken } = json.data;
      setToken(accessToken);

      try {
        const fUser = await fetchProfile(accessToken);
        return { ok: true, user: fUser };
      } catch (profileError: any) {
        setToken(null);
        setCurrentUser(null);
        return {
          ok: false,
          error: profileError?.message || 'Authentication succeeded, but this account profile is not active.',
        };
      }
    } catch (err: any) {
      return { ok: false, error: err.message || 'An error occurred during login.' };
    }
  }, [fetchProfile, setToken]);

  const logout = useCallback(() => {
    if (token) {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => undefined);
    }
    setToken(null);
    setCurrentUser(null);
    setUsers([]);
    setPendingUsers([]);
  }, [token]);

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { ok: false, error: json.message || 'Registration failed.' };
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'An error occurred during registration.' };
    }
  }, []);

  const approveUser = useCallback(async (userId: string, assignedRole: Role): Promise<AuthResult> => {
    if (!token) return { ok: false, error: 'Unauthorized' };

    try {
      // First update status to active
      const statusRes = await fetch(`/api/v1/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: true }),
      });

      if (!statusRes.ok) {
        const statusJson = await statusRes.json();
        return { ok: false, error: statusJson.message || 'Failed to update user status.' };
      }

      // Then update role if specified
      const roleRes = await fetch(`/api/v1/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: assignedRole }),
      });

      if (!roleRes.ok) {
        const roleJson = await roleRes.json();
        return { ok: false, error: roleJson.message || 'Failed to update user role.' };
      }

      const finalRes = await roleRes.json();
      const approvedUser = mapBackendUserToFrontendUser(finalRes.data);

      await refreshUsersList();
      return { ok: true, user: approvedUser };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to approve user.' };
    }
  }, [token, refreshUsersList]);

  const rejectUser = useCallback(async (userId: string): Promise<AuthResult> => {
    if (!token) return { ok: false, error: 'Unauthorized' };

    try {
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const json = await res.json();
        return { ok: false, error: json.message || 'Failed to decline application.' };
      }

      await refreshUsersList();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to decline user.' };
    }
  }, [token, refreshUsersList]);

  const updateUserStatus = useCallback(async (userId: string, status: UserStatus): Promise<AuthResult> => {
    if (!token) return { ok: false, error: 'Unauthorized' };

    try {
      const res = await fetch(`/api/v1/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: status === 'active' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { ok: false, error: json.message || 'Failed to update status.' };
      }

      await refreshUsersList();
      return { ok: true, user: mapBackendUserToFrontendUser(json.data) };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update status.' };
    }
  }, [token, refreshUsersList]);

  const updateUserRole = useCallback(async (userId: string, role: Role): Promise<AuthResult> => {
    if (!token) return { ok: false, error: 'Unauthorized' };

    try {
      const res = await fetch(`/api/v1/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { ok: false, error: json.message || 'Failed to update role.' };
      }

      await refreshUsersList();
      return { ok: true, user: mapBackendUserToFrontendUser(json.data) };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update role.' };
    }
  }, [token, refreshUsersList]);

  const updateProfile = useCallback(async (patch: Partial<User>) => {
    if (!token) return;

    try {
      const firstName = patch.name ? patch.name.trim().split(/\s+/)[0] : undefined;
      const lastName = patch.name ? patch.name.trim().split(/\s+/).slice(1).join(' ') : undefined;

      const payload: Record<string, unknown> = {};
      if (firstName !== undefined) payload.firstName = firstName;
      if (lastName !== undefined) payload.lastName = lastName;
      if (patch.bio !== undefined) payload.bio = patch.bio;

      const res = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const fUser = mapBackendUserToFrontendUser(json.data);
          setCurrentUser(fUser);
          addToast('success', 'Profile Updated', 'Your profile details have been saved successfully.');
        }
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      addToast('error', 'Update Failed', 'An error occurred while saving your profile.');
    }
  }, [token, addToast]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        authLoading,
        token,
        role: currentUser?.role ?? 'student',
        users,
        pendingUsers,
        login,
        logout,
        register,
        approveUser,
        rejectUser,
        updateUserStatus,
        updateUserRole,
        updateProfile,
        refreshUsersList,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
