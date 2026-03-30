import { CONFIG } from "@/config";

export async function getMe() {
  const res = await fetch(`${CONFIG.API_BASE_URL}/user/me`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Not authenticated");
  const data = await res.json();
  return data.data.user;
}

export async function updateGoogleUser(payload: {
  publicKey: string;
  KeyBackup: { ciphertext: string; salt: string; iv: string };
}) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/user/updateGoogleUser`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update Google user");
  return res.json();
}

// TODO: [GET USER BY ID]
// Expected input: userId (string)
// Expected output: { id, name, email, publicKey, about, avatar }
// Implement when GET /user/:id endpoint is ready
export async function getUserById(userId: string) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/user/${userId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  const data = await res.json();
  return data.data.user;
}

export async function searchForUser(NameOrEmail:string) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/user/userByNameOrEmail?q=${encodeURIComponent(NameOrEmail)}`, {
    method: "GET",
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  const data = await res.json();
  return data.data.user;
}