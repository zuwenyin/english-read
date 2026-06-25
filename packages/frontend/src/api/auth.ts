import apiClient from "./apiClient";

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface UpdateProfileParams {
  email?: string;
  password?: string;
}

export function register(
  params: RegisterParams,
): Promise<{ id: number; username: string; email: string }> {
  return apiClient.post("/api/auth/register", params);
}

export function login(params: LoginParams): Promise<LoginResult> {
  return apiClient.post("/api/auth/login", params);
}

export function getProfile(): Promise<UserProfile> {
  return apiClient.get("/api/auth/profile");
}

export function updateProfile(
  params: UpdateProfileParams,
): Promise<{ id: number; username: string; email: string }> {
  return apiClient.put("/api/auth/profile", params);
}
