import { create } from 'zustand';
import {
  changePassword as changePasswordApi,
  fetchMe,
  fetchUsers,
  forgotPassword as forgotPasswordApi,
  login,
  logout as logoutApi,
  refreshSession,
  registerStudent as registerStudentApi,
  resetPassword as resetPasswordApi,
  updateUser as updateUserApi,
} from '../api/authApi';
import { setApiToken } from '../api/client';
import { UserDto } from '../api/contracts';
import { CampusUser, Role } from '../types';

const SESSION_KEY = 'campus-unified.session-marker';
const staticDemoAuthEnabled = import.meta.env.VITE_ENABLE_STATIC_DEMO_AUTH === 'true';

const staticDemoUsers: UserDto[] = [
  {
    Id: 'demo-admin',
    Name: 'Admin User',
    Email: 'admin@campus.edu',
    Role: 'Admin',
    Department: 'Administration',
    RollNumber: undefined,
    Phone: '+91 90000 10001',
    IsActive: true,
  },
  {
    Id: 'demo-student',
    Name: 'Student User',
    Email: 'student@campus.edu',
    Role: 'Student',
    Department: 'Computer Science',
    RollNumber: 'CS-2026-101',
    Phone: '+91 90000 10002',
    IsActive: true,
  },
  {
    Id: 'demo-faculty',
    Name: 'Faculty User',
    Email: 'faculty@campus.edu',
    Role: 'Faculty',
    Department: 'IT',
    RollNumber: undefined,
    Phone: '+91 90000 10003',
    IsActive: true,
  },
  {
    Id: 'demo-security',
    Name: 'Security User',
    Email: 'security@campus.edu',
    Role: 'Security',
    Department: 'Security',
    RollNumber: undefined,
    Phone: '+91 90000 10004',
    IsActive: true,
  },
];

type StoredSession = {
  refreshTokenExpiresAt: string;
};

type AuthState = {
  role: Role;
  token: string | null;
  refreshToken: string | null;
  name: string;
  email: string;
  userId: string | null;
  users: CampusUser[];
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setSession: (session: { role: Role; name: string; token: string; refreshToken: string; accessTokenExpiresAt?: string; refreshTokenExpiresAt?: string }) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  bootstrapSession: () => Promise<void>;
  registerStudent: (payload: { name: string; email: string; password: string; rollNumber: string; phone: string }) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  completePasswordReset: (token: string, newPassword: string, confirmPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (profile: Partial<Pick<CampusUser, 'name' | 'phone' | 'department' | 'rollNumber'>>) => void;
  updateUser: (id: string, changes: Partial<CampusUser>) => void;
  signOut: () => void;
};

function readSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(session: StoredSession) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

function clearSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

function mapUser(user: UserDto): CampusUser {
  return {
    id: user.Id,
    name: user.Name,
    email: user.Email,
    role: user.Role,
    department: user.Department,
    rollNumber: user.RollNumber,
    phone: user.Phone,
    active: user.IsActive,
  };
}

function findStaticDemoUser(email: string) {
  return staticDemoUsers.find((user) => user.Email.toLowerCase() === email.trim().toLowerCase());
}

async function loadUsersForRole(role: Role) {
  if (role !== 'Admin') {
    return [];
  }

  try {
    const users = await fetchUsers();
    return users.map(mapUser);
  } catch {
    return [];
  }
}

function applyAuthenticatedUser(set: (partial: Partial<AuthState>) => void, user: UserDto, session: StoredSession & { token: string; accessTokenExpiresAt: string; refreshToken?: string }, users: CampusUser[] = []) {
  setApiToken(session.token);
  writeSession({ refreshTokenExpiresAt: session.refreshTokenExpiresAt });
  set({
    userId: user.Id,
    role: user.Role,
    name: user.Name,
    email: user.Email,
    token: session.token,
    refreshToken: null,
    accessTokenExpiresAt: session.accessTokenExpiresAt,
    refreshTokenExpiresAt: session.refreshTokenExpiresAt,
    users: users.length ? users : [mapUser(user)],
    isAuthenticated: true,
    isBootstrapping: false,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  role: 'Student',
  token: null,
  refreshToken: null,
  name: 'Guest',
  email: '',
  userId: null,
  users: [],
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  isAuthenticated: false,
  isBootstrapping: true,
  setSession: (session) => {
    applyAuthenticatedUser(set, {
      Id: get().userId ?? 'external-user',
      Name: session.name,
      Email: get().email,
      Role: session.role,
      Department: '',
      IsActive: true,
    }, {
      token: session.token,
      refreshToken: '',
      accessTokenExpiresAt: session.accessTokenExpiresAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      refreshTokenExpiresAt: session.refreshTokenExpiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  },
  loginWithCredentials: async (email, password) => {
    if (staticDemoAuthEnabled) {
      const demoUser = findStaticDemoUser(email);
      if (!demoUser || !password.trim()) {
        throw new Error('Use one of the demo emails and enter any password to open the static demo.');
      }

      applyAuthenticatedUser(set, demoUser, {
        token: `static-demo-${demoUser.Id}`,
        refreshToken: '',
        accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        refreshTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }, staticDemoUsers.map(mapUser));
      return;
    }

    try {
      const session = await login({ email, password });
      const storedSession = {
        token: session.AccessToken,
        refreshToken: session.RefreshToken,
        accessTokenExpiresAt: session.AccessTokenExpiresAt,
        refreshTokenExpiresAt: session.RefreshTokenExpiresAt,
      };
      setApiToken(storedSession.token);
      const me = await fetchMe();
      applyAuthenticatedUser(set, me, storedSession, await loadUsersForRole(me.Role));
    } catch (error: any) {
      if (error?.response?.status === 401) {
        throw new Error('Incorrect email or password.');
      }
      if (error?.response?.status === 423) {
        throw new Error('This account is temporarily locked after repeated failed attempts.');
      }
      if (error?.code === 'ECONNABORTED') {
        throw new Error('Server took too long to respond.');
      }
      if (!error?.response) {
        throw new Error('Server unavailable. Start the backend API and try again.');
      }
      throw new Error('Login failed. Please try again.');
    }
  },
  bootstrapSession: async () => {
    try {
      const refreshed = await refreshSession();
      const nextSession = {
        token: refreshed.AccessToken,
        refreshToken: refreshed.RefreshToken,
        accessTokenExpiresAt: refreshed.AccessTokenExpiresAt,
        refreshTokenExpiresAt: refreshed.RefreshTokenExpiresAt,
      };
      setApiToken(nextSession.token);
      const me = await fetchMe();
      applyAuthenticatedUser(set, me, nextSession, await loadUsersForRole(me.Role));
    } catch {
      clearSession();
      setApiToken(null);
      set({ isBootstrapping: false, isAuthenticated: false });
    }
  },
  registerStudent: async (payload) => {
    if (staticDemoAuthEnabled) {
      void payload;
      throw new Error('Registration requires the backend API. GitHub Pages is a frontend-only demo.');
    }

    await registerStudentApi(payload);
  },
  resetPassword: async (email, newPassword) => {
    void newPassword;
    await forgotPasswordApi(email);
  },
  forgotPassword: async (email) => {
    if (staticDemoAuthEnabled) {
      void email;
      throw new Error('Password reset requires the backend API. GitHub Pages is a frontend-only demo.');
    }

    await forgotPasswordApi(email);
  },
  completePasswordReset: async (token, newPassword, confirmPassword) => {
    if (staticDemoAuthEnabled) {
      void token;
      void newPassword;
      void confirmPassword;
      throw new Error('Password reset requires the backend API. GitHub Pages is a frontend-only demo.');
    }

    await resetPasswordApi({ token, newPassword, confirmPassword });
  },
  changePassword: async (currentPassword, newPassword) => {
    if (staticDemoAuthEnabled) {
      void currentPassword;
      void newPassword;
      throw new Error('Password changes require the backend API. GitHub Pages is a frontend-only demo.');
    }

    await changePasswordApi({ currentPassword, newPassword });
    get().signOut();
  },
  updateProfile: (profile) => {
    const { userId } = get();
    if (!userId) {
      return;
    }

    set((state) => ({
      name: profile.name ?? state.name,
      users: state.users.map((user) => (user.id === userId ? { ...user, ...profile } : user)),
    }));
  },
  updateUser: async (id, changes) => {
    const user = get().users.find((item) => item.id === id);
    if (!user) {
      return;
    }

    const updated = await updateUserApi(id, {
      Id: user.id,
      Name: changes.name ?? user.name,
      Email: user.email,
      Role: changes.role ?? user.role,
      Department: changes.department ?? user.department,
      RollNumber: changes.rollNumber ?? user.rollNumber,
      Phone: changes.phone ?? user.phone,
      IsActive: changes.active ?? user.active,
    });
    set((state) => ({
      users: state.users.map((item) => (item.id === id ? mapUser(updated) : item)),
    }));
  },
  signOut: () => {
    void logoutApi().catch(() => undefined);
    clearSession();
    setApiToken(null);
    set({
      role: 'Student',
      token: null,
      refreshToken: null,
      name: 'Guest',
      email: '',
      userId: null,
      users: [],
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      isAuthenticated: false,
      isBootstrapping: false,
    });
  },
}));
