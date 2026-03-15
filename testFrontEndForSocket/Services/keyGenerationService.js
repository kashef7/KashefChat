export const KeyGenerationService = async (userPassword) => {
    const keyPair = await window.crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, // extractable — needed so we can export and encrypt it
    ["encrypt", "decrypt"]);

    // Export both keys as raw bytes
    const privateKeyBytes = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const publicKeyBytes  = await window.crypto.subtle.exportKey("spki",  keyPair.publicKey);

    // Convert both to base64 strings
    const privateKeyString = btoa(String.fromCharCode(...new Uint8Array(privateKeyBytes)));
    const publicKeyString  = btoa(String.fromCharCode(...new Uint8Array(publicKeyBytes)));

    // Generate a random 16-byte salt
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    // Import the password as a raw key
    const passwordKey = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(userPassword), "PBKDF2", false, ["deriveKey"]);
    // Derive a 256-bit AES-GCM key from the password + salt
    const derivedKey = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, passwordKey, { name: "AES-GCM", length: 256 }, false, // non-extractable — the derived key itself never leaves
    ["encrypt", "decrypt"]);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encryptedPrivateKey = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, derivedKey, privateKeyBytes // the raw private key bytes from step 1
    );
    const blob = {
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedPrivateKey))),
        salt: btoa(String.fromCharCode(...salt)),
        iv: btoa(String.fromCharCode(...iv)),
    };
    return {
        publicKey: publicKeyString,   // base64 string → store in User.publicKey
        privateKey: privateKeyString,  // base64 string → store locally (secure store)
        encryptedPrivateKey: blob,             // → upload to server as KeyBackup
    };
};
