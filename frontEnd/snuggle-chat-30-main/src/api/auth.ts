import { CONFIG } from "@/config";

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/auth/logIn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Login failed");
  return data;
}

export async function signupApi(payload: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  publicKey: string;
  encryptedPrivateKey: { ciphertext: string; salt: string; iv: string };
}) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/auth/signUp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || data.error || "Signup failed");
  return data;
}

export async function logoutApi() {
  const res = await fetch(`${CONFIG.API_BASE_URL}/auth/logOut`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to logout");
  return true;
}

export function getGoogleAuthUrl() {
  return CONFIG.GOOGLE_AUTH_URL;
}
