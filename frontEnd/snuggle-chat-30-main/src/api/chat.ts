import { CONFIG } from "@/config";

export async function startChat(friendId: string) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/chat/startChat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: friendId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to start chat");
  return data.data.chat;
}

export async function fetchMessages(chatId: string, cursor?: string, limit = 20) {
  const url = new URL(`${CONFIG.API_BASE_URL}/chat/${chatId}`);
  url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  const data = await res.json();
  return data.data.chat; // { members, messages, pagination }
}
