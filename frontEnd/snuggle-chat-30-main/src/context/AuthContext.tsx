import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "@/api/user";
import { loginApi, signupApi, logoutApi } from "@/api/auth";
import { KeyGenerationService, decryptPrivateKeyFromBackup } from "@/crypto/keyGeneration";
import { updateGoogleUser } from "@/api/user";

interface User {
  id: string;
  name: string;
  email: string;
  publicKey?: string;
  KeyBackup?: { ciphertext: string; salt: string; iv: string };
  userType?: string;
  about?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await getMe();

      // Google user key setup
      if (userData.userType === "Google" && !localStorage.getItem("privateKey")) {
        let restored = false;
        if (userData.KeyBackup) {
          try {
            const restoredKey = await decryptPrivateKeyFromBackup(userData.KeyBackup, userData.id);
            localStorage.setItem("privateKey", restoredKey);
            restored = true;
          } catch (e) {
            console.warn("Could not restore Google user private key:", e);
          }
        }
        
        if (!restored) {
          const keyResult = await KeyGenerationService(userData.id);
          localStorage.setItem("privateKey", keyResult.privateKey);
          await updateGoogleUser({
            publicKey: keyResult.publicKey,
            KeyBackup: keyResult.encryptedPrivateKey,
          });
        }
      }

      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await loginApi(email, password);
    const userData = await getMe();

    // Restore private key from backup
    if (!localStorage.getItem("privateKey") && userData.KeyBackup) {
      try {
        const restoredKey = await decryptPrivateKeyFromBackup(userData.KeyBackup, password);
        localStorage.setItem("privateKey", restoredKey);
      } catch (e) {
        console.warn("Could not restore private key from backup:", e);
      }
    }

    // Google user key setup
    if (userData.userType === "Google" && !localStorage.getItem("privateKey")) {
      let restored = false;
      if (userData.KeyBackup) {
        try {
          const restoredKey = await decryptPrivateKeyFromBackup(userData.KeyBackup, userData.id);
          localStorage.setItem("privateKey", restoredKey);
          restored = true;
        } catch (e) {
          console.warn("Could not restore Google user private key:", e);
        }
      }

      if (!restored) {
        const keyResult = await KeyGenerationService(userData.id);
        localStorage.setItem("privateKey", keyResult.privateKey);
        await updateGoogleUser({
          publicKey: keyResult.publicKey,
          KeyBackup: keyResult.encryptedPrivateKey,
        });
      }
    }

    setUser(userData);
  };

  const signup = async (name: string, email: string, password: string, confirmPassword: string) => {
    const keyResult = await KeyGenerationService(password);
    await signupApi({
      name,
      email,
      password,
      confirmPassword,
      publicKey: keyResult.publicKey,
      encryptedPrivateKey: keyResult.encryptedPrivateKey,
    });
    localStorage.setItem("privateKey", keyResult.privateKey);
    const userData = await getMe();
    setUser(userData);
  };

  const logout = async () => {
    localStorage.removeItem("privateKey");
    await logoutApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
