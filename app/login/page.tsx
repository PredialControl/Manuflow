"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha incorretos");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Ocorreu um erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary),0.05),transparent)] pointer-events-none" />

      <div className="w-full max-w-[400px] space-y-8 animate-in relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="h-16 w-16 bg-primary shadow-2xl shadow-primary/40 rounded-[1.25rem] flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="ManuFlow Logo" className="h-full w-full object-cover" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<span class="text-white text-3xl font-black italic">M</span>';
            }} />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-black tracking-tighter text-foreground">ManuFlow</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Inteligência em Gestão</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-8 pt-10">
            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-black px-4 py-3 rounded-xl text-center uppercase tracking-wider">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">E-mail Corporativo</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  className="h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-all"
                  placeholder="admin@manuflow.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Senha de Acesso</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" id="remember" className="h-4 w-4 rounded border-border/60 text-primary focus:ring-primary" defaultChecked />
                <Label htmlFor="remember" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 cursor-pointer">Manter conectado neste dispositivo</Label>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2" disabled={loading}>
                {loading ? "Autenticando..." : "Entrar no Sistema"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">
          ManuFlow Management &copy; {new Date().getFullYear()}
        </p>
      </div>

      <div className="fixed bottom-4 right-6">
        <ThemeToggle />
      </div>
    </div>
  );
}
