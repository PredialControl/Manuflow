import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ManuFlow - Gestão Técnica",
  description: "Sistema de gestão de manutenção técnica",
  manifest: "/manifest.json",
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Eruda console mobile - adicione ?debug=1 na URL para ativar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.location.search.includes('debug=1')) {
                var script = document.createElement('script');
                script.src = "https://cdn.jsdelivr.net/npm/eruda";
                document.body.appendChild(script);
                script.onload = function () { eruda.init(); }
              }
            `,
          }}
        />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background transition-colors duration-300")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
