"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function AppProgressBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Sempre que o pathname mudar, significa que a navegação terminou
    setLoading(false);
    setProgress(0);
  }, [pathname]);

  useEffect(() => {
    // Detectar cliques em links
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.href && target.href.startsWith(window.location.origin)) {
        const url = new URL(target.href);
        if (url.pathname !== pathname && !target.target) {
          setLoading(true);
          setProgress(10);
        }
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [pathname]);

  useEffect(() => {
    if (!loading) return;

    // Incrementar progresso gradualmente
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90; // Para em 90% até carregar
        return prev + Math.random() * 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[99999] pointer-events-none"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg,
            hsl(var(--primary)) 0%,
            hsl(var(--primary) / 0.85) 25%,
            hsl(var(--primary) / 0.7) 50%,
            hsl(var(--primary) / 0.85) 75%,
            hsl(var(--primary)) 100%)`,
          backgroundSize: "200% 100%",
          animation: "gradient-shift 1.5s ease-in-out infinite",
          boxShadow: `0 0 12px hsl(var(--primary) / 0.6), 0 0 6px hsl(var(--primary) / 0.4)`,
        }}
      >
        <div
          className="absolute right-0 top-0 h-full w-[120px]"
          style={{
            boxShadow: `0 0 20px hsl(var(--primary)), 0 0 12px hsl(var(--primary))`,
            opacity: 1,
            transform: "rotate(2deg) translate(0px, -2px)",
          }}
        />
      </div>
    </div>
  );
}
