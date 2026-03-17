const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}



export const encryptMessage = async (message,publicKeyString) =>{

  const binaryKey = base64ToArrayBuffer(publicKeyString);

  const publicKey = await crypto.subtle.importKey(
    "spki",   
    binaryKey, 
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,          
    ["encrypt"]      
  );
  const encoded = new TextEncoder().encode(message);

  const encrypted = await crypto.subtle.encrypt({
    name: "RSA-OAEP"
  },publicKey,
  encoded);

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));

}

export const decryptMessage = async (message, privateKeyString) =>{

  const binaryKey = base64ToArrayBuffer(privateKeyString);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["decrypt"]
  );
  const binary = Uint8Array.from(atob(message), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({
    name: "RSA-OAEP"
  }, privateKey, binary);

  return new TextDecoder().decode(decrypted);

}