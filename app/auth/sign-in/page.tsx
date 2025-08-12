"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  const { signInWithEmailPassword, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signInWithEmailPassword(email, password);
    setLoading(false);
    if ((res as any)?.error) {
      setError((res as any).error.message || "Error al iniciar sesión");
      return;
    }
    router.push("/post-login");
  }

  async function onMagicLink() {
    setError(null);
    setLoading(true);
    const url = typeof window !== "undefined" ? `${window.location.origin}/post-login` : undefined;
    const res = await signInWithMagicLink(email, url);
    setLoading(false);
    if ((res as any)?.error) {
      setError((res as any).error.message || "Error enviando magic link");
      return;
    }
    alert("Te hemos enviado un email con tu enlace de acceso");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tú@correo.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cargando..." : "Entrar"}
          </Button>
        </form>
        <div className="my-4 text-center text-sm text-gray-500">o</div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={onMagicLink} disabled={loading || !email}>
            Enviarme Magic Link
          </Button>
        </div>
        <p className="mt-6 text-sm text-gray-600 dark:text-gray-300">
          ¿No tienes cuenta? {" "}
          <Link href="/auth/sign-up" className="text-blue-600 hover:underline">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
}
