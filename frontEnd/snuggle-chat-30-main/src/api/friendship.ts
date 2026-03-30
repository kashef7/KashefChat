import { CONFIG } from "@/config";

export async function getFriends() {
  const res = await fetch(`${CONFIG.API_BASE_URL}/friendship/`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch friends");
  const data = await res.json();
  return data.data.friends;
}

export async function getPendingRequestsReceived() {
  const res = await fetch(`${CONFIG.API_BASE_URL}/friendship/PendingRequestsReceived`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch pending requests");
  const data = await res.json();
  return data.data.requests;
}

export async function sendFriendRequest(receiverEmail: string) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/friendship/sendFriendRequest`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiverEmail }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to send friend request");
  return data;
}

export async function respondToRequest(senderId: string, respond: "Accepted" | "Rejected") {
  const res = await fetch(`${CONFIG.API_BASE_URL}/friendship/respondToRequest`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId, respond }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to respond to request");
  return data;
}

