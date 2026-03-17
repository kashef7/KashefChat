// messageEndToEndEncryptionService.js

const toBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromBase64 = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

function pemToBinary(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  return fromBase64(b64);
}

export async function importRsaPublicKey(pem) {
  return crypto.subtle.importKey(
    'spki',
    pemToBinary(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}

async function importRsaPrivateKey(pem) {
  return crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
}

// Encrypts plaintext, returns { content, iv, encryptedKey } for one recipient
export async function encryptForRecipient(plaintext, recipientPublicKeyPem) {
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(plaintext)
  );

  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const rsaPublicKey = await importRsaPublicKey(recipientPublicKeyPem);
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaPublicKey,
    rawAesKey
  );

  return {
    content: toBase64(ciphertext),
    iv: toBase64(iv),
    encryptedKey: toBase64(encryptedKey),
  };
}

// Given an encryptedKey (base64) + ciphertext + iv, decrypts using RSA private key
export async function decryptMessage(ciphertextB64, ivB64, encryptedKeyB64, privateKeyPem) {
  const rsaPrivateKey = await importRsaPrivateKey(privateKeyPem);
  const rawAesKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    rsaPrivateKey,
    fromBase64(encryptedKeyB64)
  );

  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawAesKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivB64) },
    aesKey,
    fromBase64(ciphertextB64)
  );

  return new TextDecoder().decode(plaintext);
}