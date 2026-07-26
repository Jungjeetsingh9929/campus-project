import { api } from './client';
import { AuthResponse, UserDto } from './contracts';

export type LoginPayload = {
  email: string;
  password: string;
};

export async function login(payload: LoginPayload) {
  const response = await api.post<AuthResponse>('/auth/login', payload);
  return response.data;
}

export async function refreshSession(refreshToken?: string) {
  const response = await api.post<AuthResponse>('/auth/refresh', refreshToken ? { RefreshToken: refreshToken } : {});
  return response.data;
}

export async function registerStudent(payload: { name: string; email: string; password: string; rollNumber: string; phone: string }) {
  const response = await api.post<UserDto>('/auth/register', {
    Name: payload.name,
    Email: payload.email,
    Password: payload.password,
    RollNumber: payload.rollNumber,
    Phone: payload.phone,
  });
  return response.data;
}

export async function forgotPassword(email: string) {
  await api.post('/auth/forgot-password', { Email: email });
}

export async function resetPassword(payload: { token: string; newPassword: string; confirmPassword: string }) {
  await api.post('/auth/reset-password', {
    Token: payload.token,
    NewPassword: payload.newPassword,
    ConfirmPassword: payload.confirmPassword,
  });
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  await api.post('/auth/change-password', {
    CurrentPassword: payload.currentPassword,
    NewPassword: payload.newPassword,
  });
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function fetchMe() {
  const response = await api.get<UserDto>('/auth/me');
  return response.data;
}

export async function fetchUsers() {
  const response = await api.get<UserDto[]>('/admin/users');
  return response.data;
}

export async function updateUser(id: string, changes: UserDto) {
  const response = await api.put<UserDto>(`/admin/users/${id}`, {
    DisplayName: changes.Name,
    Role: changes.Role,
    Department: changes.Department,
    RollNumber: changes.RollNumber,
    Phone: changes.Phone,
    IsActive: changes.IsActive,
  });
  return response.data;
}
