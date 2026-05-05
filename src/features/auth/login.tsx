"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LoginView } from "./login.view";
import { useRouter } from "next/navigation";

export const LoginFeature = () => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const idToken = await userCredential.user.getIdToken();

      // Establecer sesión segura vía API (HttpOnly)
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Credenciales inválidas o error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginView
      email={email}
      setEmail={setEmail}
      pass={pass}
      setPass={setPass}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
    />
  );
};
