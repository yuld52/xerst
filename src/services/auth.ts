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

export async function checkSetupStatus(): Promise<SetupStatus> {
  return apiRequest<SetupStatus>("/setup/status");
}

export async function createAdmin(data: SetupData): Promise<{ message: string }> {
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
  try {
    return await apiRequest<{ message: string }>("/forgot-password", {
      method: "POST",
      body: { email },
    });
  } catch (error) {
    // Se o backend não tiver endpoint configurado, simula sucesso para segurança
    return {
      message: "Se o e-mail estiver cadastrado, as instruções foram enviadas.",
    };
  }
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
