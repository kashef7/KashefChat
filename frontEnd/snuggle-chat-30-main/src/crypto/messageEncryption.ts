const base64ToArrayBuffer = (b64: string): ArrayBuffer =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;

const arrayBufferToBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

export async function importRsaPublicKey(
  publicKeyBase64: string
): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(publicKeyBase64);
  return window.crypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
}

async function importRsaPrivateKey(
  privateKeyBase64: string
): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(privateKeyBase64);
  return window.crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
}

export async function encryptMessage(
  plaintext: string,
  members: { userId: string; publicKeyPem: string }[]
): Promise<{
  content: string;
  iv: string;
  keys: { userId: string; encryptedKey: string }[];
}> {
  // Generate AES-GCM key
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the message content
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(plaintext)
  );

  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

  // Wrap AES key with each member's RSA public key
  const keys = await Promise.all(
    members.map(async ({ userId, publicKeyPem }) => {
      const rsaKey = await importRsaPublicKey(publicKeyPem);
      const encryptedKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        rsaKey,
        rawAesKey
      );
      return { userId, encryptedKey: arrayBufferToBase64(encryptedKey) };
    })
  );

  return {
    content: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    keys,
  };
}

export async function decryptMessage(
  contentBase64: string,
  ivBase64: string,
  encryptedKeyBase64: string,
  privateKeyBase64: string
): Promise<string> {
  const privateKey = await importRsaPrivateKey(privateKeyBase64);

  // Decrypt the AES key using RSA private key
  const rawAesKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64ToArrayBuffer(encryptedKeyBase64)
  );

  // Import AES key
  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Decrypt the message
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(ivBase64) },
    aesKey,
    base64ToArrayBuffer(contentBase64)
  );

  return new TextDecoder().decode(decryptedBuffer);
}
