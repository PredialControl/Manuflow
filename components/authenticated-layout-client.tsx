"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { useSidebar } from "@/components/sidebar-context";
import {
    LayoutDashboard,
    Building2,
    Users,
    ArrowLeft,
    FileText,
    ClipboardCheck,
    Package,
    History
} from "lucide-react";

export function AuthenticatedLayoutClient({
    children,
    session,
}: {
    children: React.ReactNode;
    session: any;
}) {
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Detect if we are inside a contract route
    const contractMatch = pathname.match(/\/contracts\/([^\/]+)/);
    const contractId = contractMatch ? contractMatch[1] : null;
    const isContractRoute = !!contractId && contractId !== "new";

    const mainNavItems = [
        { href: "/dashboard", label: "Geral", icon: LayoutDashboard },
        { href: "/contracts", label: "Contratos", icon: Building2 },
    ];

    if (session.user.role === "ADMIN" || session.user.role === "OWNER") {
        mainNavItems.push({ href: "/users", label: "Usuários", icon: Users });
    }

    const contractNavItems = [
        { href: `/contracts/${contractId}`, label: "Visão Geral", icon: LayoutDashboard },
        { href: `/contracts/${contractId}?tab=assets`, label: "Ativos", icon: Package },
        { href: `/contracts/${contractId}?tab=inspections`, label: "Rondas", icon: ClipboardCheck },
        { href: `/contracts/${contractId}?tab=reports`, label: "Laudos", icon: FileText },
    ];

    if (session.user.role === "ADMIN" || session.user.role === "OWNER") {
        contractNavItems.push({ href: `/contracts/${contractId}?tab=team`, label: "Equipe", icon: Users });
    }

    const currentNavItems = isContractRoute ? contractNavItems : mainNavItems;

    return (
        <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
            {/* Sleek Glass Header */}
            <header className="glass shadow-sm shadow-black/5">
                <div className="w-full px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <SidebarToggle />
                        <div className="h-8 w-[1px] bg-border mx-1 hidden lg:block" />
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-primary shadow-lg shadow-primary/20 rounded-xl flex items-center justify-center">
                                <span className="text-white text-lg font-bold">M</span>
                            </div>
                            <div className={cn("hidden sm:flex flex-col transition-opacity duration-300", isCollapsed ? "lg:opacity-0 lg:pointer-events-none" : "opacity-100")}>
                                <span className="text-lg font-bold tracking-tight text-foreground leading-none">ManuFlow</span>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Intelligence</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-xs font-bold text-foreground leading-none">{session.user.name}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter mt-1">{session.user.role}</span>
                        </div>

                        <div className="h-8 w-[1px] bg-border mx-1" />

                        <ThemeToggle />
                        <SignOutButton />
                    </div>
                </div>
            </header>

            <div className="flex flex-1 w-full px-6 overflow-hidden">
                {/* Animated Sidebar */}
                <aside
                    className={cn(
                        "hidden lg:flex flex-col py-8 transition-all duration-300 ease-in-out border-r border-border/40",
                        isCollapsed ? "w-20 pr-0" : "w-64 pr-8"
                    )}
                >
                    <div className="flex flex-col h-full">
                        {isContractRoute && (
                            <div className="mb-6">
                                <Link
                                    href="/contracts"
                                    className={cn(
                                        "flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors",
                                        isCollapsed ? "justify-center" : "px-4 py-2"
                                    )}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Sair do Contrato</span>}
                                </Link>
                            </div>
                        )}

                        <nav className="space-y-1.5 flex-1">
                            {!isCollapsed && !isContractRoute && (
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3 px-4">Menu Principal</p>
                            )}
                            {!isCollapsed && isContractRoute && (
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3 px-4">Gestão do Contrato</p>
                            )}

                            {currentNavItems.map((item) => {
                                const url = new URL(item.href, "http://x");
                                const itemPath = url.pathname;
                                const itemTab = url.searchParams.get("tab");

                                const isActive = itemTab
                                    ? pathname === itemPath && searchParams.get("tab") === itemTab
                                    : pathname === itemPath && !searchParams.get("tab");

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center gap-3 rounded-xl transition-all duration-200",
                                            isCollapsed ? "justify-center p-3" : "px-4 py-2.5",
                                            isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "text-muted-foreground hover:bg-primary/5 hover:text-primary font-bold text-sm"
                                        )}
                                        title={isCollapsed ? item.label : ""}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5 transition-all",
                                            isActive ? "text-white" : "opacity-60 group-hover:opacity-100"
                                        )} />
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Workspace */}
                <main className="flex-1 py-8 overflow-auto animate-in scrollbar-hide">
                    <div className="max-w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
