import { apiRequest } from "./api";
import { setCookie, getCookie, removeCookie } from "@/lib/cookies";
import { demoUser, isImportDemo } from "@/lib/import-demo";

interface SetupStatus {
  is_configured: boolean;
}

interface SetupData {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface LoginData {
  email: string;
  password: string;
  two_factor_code?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: "owner" | "admin" | "viewer" | "superadmin";
  };
}

interface VerifyCodeData {
  email: string;
  code: string;
}

interface VerifyCodeResponse {
  message: string;
  access_token?: string;
  token_type?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: "owner" | "admin" | "viewer" | "superadmin";
  };
}

interface ResendCodeData {
  email: string;
}

export async function checkSetupStatus(): Promise<SetupStatus> {
  return apiRequest<SetupStatus>("/setup/status");
}

export async function createAdmin(data: SetupData): Promise<{ message: string; requires_verification?: boolean }> {
  return apiRequest("/setup", { method: "POST", body: data });
}

export async function loginUser(data: LoginData): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/login", {
    method: "POST",
    body: data,
  });

  setCookie("access_token", response.access_token, 30);
  localStorage.setItem("user", JSON.stringify(response.user));

  return response;
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  if (isImportDemo()) {
    return { message: "Instruções de recuperação enviadas para seu e-mail." };
  }
  return await apiRequest<{ message: string }>("/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function verifySignupCode(data: VerifyCodeData): Promise<VerifyCodeResponse> {
  return apiRequest<VerifyCodeResponse>("/setup/verify-code", {
    method: "POST",
    body: data,
  });
}

export async function resendVerificationCode(data: ResendCodeData): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/setup/resend-code", {
    method: "POST",
    body: data,
  });
}

export async function resetPassword(token: string, password: string, confirm_password: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/reset-password", {
    method: "POST",
    body: { token, password, confirm_password },
  });
}

export async function sendAdminEmail(data: {
  email: string;
  subject: string;
  message: string;
  cta_text?: string;
  cta_url?: string;
}): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/superadmin/settings/send-email", {
    method: "POST",
    body: data,
  });
}

export function logout() {
  sessionStorage.removeItem("mock_mode");
  removeCookie("access_token");
  localStorage.removeItem("user");
}

export function getStoredUser() {
  if (isImportDemo()) return demoUser;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated(): boolean {
  if (isImportDemo()) return true;
  return !!getCookie("access_token");
}
