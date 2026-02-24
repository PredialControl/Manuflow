"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
  minimum: 0.08,
  easing: "ease",
  speed: 400,
});

function ProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Interceptar cliques em links
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.currentTarget as HTMLAnchorElement;
      const targetUrl = new URL(target.href);
      const currentUrl = new URL(window.location.href);

      if (targetUrl.pathname !== currentUrl.pathname) {
        NProgress.start();
      }
    };

    // Interceptar submit de forms
    const handleFormSubmit = () => {
      NProgress.start();
    };

    // Adicionar listeners a todos os links e forms
    const addListeners = () => {
      document.querySelectorAll('a[href^="/"]').forEach((anchor) => {
        anchor.addEventListener("click", handleAnchorClick as EventListener);
      });

      document.querySelectorAll("form").forEach((form) => {
        form.addEventListener("submit", handleFormSubmit);
      });
    };

    // Observar mudanças no DOM para adicionar listeners a novos elementos
    const observer = new MutationObserver(addListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    addListeners();

    return () => {
      observer.disconnect();
      document.querySelectorAll('a[href^="/"]').forEach((anchor) => {
        anchor.removeEventListener("click", handleAnchorClick as EventListener);
      });
      document.querySelectorAll("form").forEach((form) => {
        form.removeEventListener("submit", handleFormSubmit);
      });
    };
  }, []);

  return null;
}

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarContent />
    </Suspense>
  );
}
