import { apiPost } from './api-client';

export async function requestPasswordReset(email: string) {
  return apiPost<{ message: string }>('/auth/forgot-password', { email });
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  return apiPost<{ message: string }>('/auth/reset-password', {
    token,
    new_password: newPassword,
  });
}
