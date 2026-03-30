const arrayBufferToBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const base64ToArrayBuffer = (b64: string): ArrayBuffer =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;

export interface KeyGenerationResult {
  publicKey: string;
  privateKey: string;
  encryptedPrivateKey: {
    ciphertext: string;
    salt: string;
    iv: string;
  };
}

export async function KeyGenerationService(
  password: string
): Promise<KeyGenerationResult> {
  // Generate RSA-OAEP key pair
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Export keys
  const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const publicKey = arrayBufferToBase64(publicKeyBuffer);
  const privateKey = arrayBufferToBase64(privateKeyBuffer);

  // Encrypt private key with password using PBKDF2 + AES-GCM
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    privateKeyBuffer
  );

  return {
    publicKey,
    privateKey,
    encryptedPrivateKey: {
      ciphertext: arrayBufferToBase64(ciphertext),
      salt: arrayBufferToBase64(salt.buffer),
      iv: arrayBufferToBase64(iv.buffer),
    },
  };
}

export async function decryptPrivateKeyFromBackup(
  keyBackup: { ciphertext: string; salt: string; iv: string },
  password: string
): Promise<string> {
  if (!keyBackup?.ciphertext || !keyBackup?.salt || !keyBackup?.iv) {
    throw new Error("Key backup data missing");
  }

  const salt = base64ToArrayBuffer(keyBackup.salt);
  const iv = base64ToArrayBuffer(keyBackup.iv);
  const ciphertext = base64ToArrayBuffer(keyBackup.ciphertext);

  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decryptedPrivateKey = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    ciphertext
  );

  return arrayBufferToBase64(decryptedPrivateKey);
}
