"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { sanitizeString } from "@/lib/sanitize";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  updateUserProfile: async () => {},
  uploadAvatar: async () => "",
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser } as User);
    }
  }, []);

  const updateUserProfile = useCallback(async (displayName: string, photoURL?: string) => {
    if (!auth.currentUser) throw new Error("No hay usuario autenticado");
    
    const sanitizedName = sanitizeString(displayName);
    const updates: { displayName: string; photoURL?: string } = {
      displayName: sanitizedName,
    };
    if (photoURL) {
      updates.photoURL = photoURL;
    }

    await updateProfile(auth.currentUser, updates);
    await refreshUser();
  }, [refreshUser]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!auth.currentUser) throw new Error("No hay usuario autenticado");

    // Limitar nombre de archivo y evitar inyecciones
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileRef = ref(storage, `avatars/${auth.currentUser.uid}/${Date.now()}_${safeName}`);
    
    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type,
    });
    
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, updateUserProfile, uploadAvatar, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

