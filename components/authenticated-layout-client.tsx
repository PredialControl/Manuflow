"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { useSidebar } from "@/components/sidebar-context";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    LayoutDashboard,
    Building2,
    Users,
    ArrowLeft,
    FileText,
    ClipboardCheck,
    Package,
    Gauge,
    Sparkles,
    DollarSign,
    Menu,
    Network,
    Wrench,
} from "lucide-react";

interface Session {
    user: {
        name?: string | null;
        email?: string | null;
        role: string;
    };
}

export function AuthenticatedLayoutClient({
    children,
    session,
}: {
    children: React.ReactNode;
    session: Session;
}) {
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Detect if we are inside a contract route
    const contractMatch = pathname.match(/\/contracts\/([^/]+)/);
    const contractId = contractMatch ? contractMatch[1] : null;
    const isContractRoute = !!contractId && contractId !== "new";

    const mainNavItems =
        session.user.role === "SUPER_ADMIN"
            ? [
                { href: "/super-admin/companies", label: "Empresas", icon: Building2 },
                { href: "/super-admin/contracts", label: "Contratos", icon: FileText },
                { href: "/super-admin/financial", label: "Financeiro", icon: DollarSign },
            ]
            : session.user.role === "TECHNICIAN"
                ? [
                    { href: "/dashboard", label: "Minhas Tarefas", icon: LayoutDashboard },
                    { href: "/ronda", label: "Ronda Técnica", icon: ClipboardCheck },
                    { href: "/chamados", label: "Chamados", icon: Wrench },
                ]
                : session.user.role === "SUPERVISOR"
                    ? [
                        { href: "/dashboard", label: "Geral", icon: LayoutDashboard },
                        { href: "/contracts", label: "Contratos", icon: Building2 },
                        { href: "/chamados", label: "Chamados", icon: Wrench },
                    ]
                    : [
                        { href: "/dashboard", label: "Geral", icon: LayoutDashboard },
                        { href: "/contracts", label: "Contratos", icon: Building2 },
                        { href: "/chamados", label: "Chamados", icon: Wrench },
                    ];

    if (session.user.role === "ADMIN" || session.user.role === "OWNER") {
        mainNavItems.push({ href: "/users", label: "Usuários", icon: Users });
    }

    const contractNavItems =
        session.user.role === "TECHNICIAN"
            ? [
                { href: `/contracts/${contractId}?tab=measurements`, label: "Medições", icon: Gauge },
                { href: `/contracts/${contractId}?tab=relevant-items`, label: "Itens / Orçamentos", icon: Sparkles },
            ]
            : [
                { href: `/contracts/${contractId}`, label: "Visão Geral", icon: LayoutDashboard },
                { href: `/contracts/${contractId}?tab=assets`, label: "Ativos", icon: Package },
                { href: `/contracts/${contractId}/structure`, label: "Estrutura", icon: Network },
                { href: `/contracts/${contractId}?tab=relevant-items`, label: "Itens / Orçamentos", icon: Sparkles },
                { href: `/contracts/${contractId}?tab=inspections`, label: "Rondas", icon: ClipboardCheck },
                { href: `/contracts/${contractId}?tab=reports`, label: "Laudos", icon: FileText },
                { href: `/contracts/${contractId}?tab=measurements`, label: "Medições", icon: Gauge },
                { href: `/contracts/${contractId}?tab=chamados`, label: "Chamados", icon: Wrench },
            ];

    if (
        session.user.role === "ADMIN" ||
        session.user.role === "OWNER" ||
        session.user.role === "SUPERVISOR"
    ) {
        contractNavItems.push({
            href: `/contracts/${contractId}?tab=team`,
            label: "Equipe",
            icon: Users,
        });
    }

    const currentNavItems = isContractRoute ? contractNavItems : mainNavItems;

    function isActive(href: string) {
        const url = new URL(href, "http://x");
        const itemPath = url.pathname;
        const itemTab = url.searchParams.get("tab");
        return itemTab
            ? pathname === itemPath && searchParams.get("tab") === itemTab
            : pathname === itemPath && !searchParams.get("tab");
    }

    const NavLink = ({ item, onClick }: { item: typeof currentNavItems[0]; onClick?: () => void }) => {
        const active = isActive(item.href);
        return (
            <Link
                href={item.href}
                onClick={onClick}
                className={cn(
                    "group flex items-center gap-3 rounded-xl transition-all duration-200",
                    isCollapsed ? "justify-center p-3" : "px-3 py-2",
                    active
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-primary font-bold text-sm"
                )}
                title={isCollapsed ? item.label : ""}
            >
                <item.icon
                    className={cn(
                        "h-5 w-5 transition-all text-current",
                        active ? "text-white" : "opacity-60 group-hover:opacity-100"
                    )}
                />
                {!isCollapsed && <span>{item.label}</span>}
            </Link>
        );
    };

    // Bottom nav always shows full labels (not collapsed)
    const BottomNavLink = ({ item }: { item: typeof currentNavItems[0] }) => {
        const active = isActive(item.href);
        return (
            <Link
                href={item.href}
                className={cn(
                    "flex flex-col items-center gap-1 flex-1 py-2 transition-all duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                )}
            >
                <item.icon
                    className={cn(
                        "h-5 w-5 transition-all",
                        active ? "text-primary" : "opacity-50"
                    )}
                />
                <span
                    className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        active ? "text-primary" : "text-muted-foreground/60"
                    )}
                >
                    {item.label}
                </span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-background flex transition-colors duration-300">
            <PwaInstallPrompt />

            {/* Mobile Drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-64 p-0">
                    <SheetHeader className="px-6 py-5 border-b border-border/40">
                        <SheetTitle className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                                <img
                                    src="/logo.png"
                                    alt="Logo"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        const p = e.currentTarget.parentElement;
                                        if (p) p.innerHTML = '<span class="text-white font-bold">M</span>';
                                    }}
                                />
                            </div>
                            <span className="font-black tracking-tight">ManuFlow</span>
                        </SheetTitle>
                    </SheetHeader>

                    <nav className="px-4 py-4 space-y-1">
                        {isContractRoute && (
                            <Link
                                href="/contracts"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-primary transition-colors mb-4"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    Sair do Contrato
                                </span>
                            </Link>
                        )}
                        {currentNavItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold",
                                        active
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", active ? "text-white" : "opacity-60")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </SheetContent>
            </Sheet>

            {/* Mobile Header (Hamburger only) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-border/40 px-4 py-3 flex items-center justify-between">
                <button
                    className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Abrir menu"
                >
                    <Menu className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <SignOutButton />
                </div>
            </div>

            <div className="flex flex-1 w-full lg:px-6 gap-x-6 overflow-hidden pt-16 lg:pt-0">
                {/* Desktop Sidebar */}
                <aside
                    className={cn(
                        "hidden lg:flex flex-col py-6 transition-all duration-300 ease-in-out border-r border-border/40",
                        isCollapsed ? "w-16" : "w-64"
                    )}
                >
                    <div className="flex flex-col h-full pr-2">
                        {/* Logo & Toggle */}
                        <div className={cn("mb-6 flex items-center", isCollapsed ? "justify-center" : "px-3 justify-between")}>
                            {!isCollapsed && (
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                                        <img src="/logo.png" alt="ManuFlow" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement!.innerHTML = '<span class="text-white font-bold text-sm">M</span>'; }} />
                                    </div>
                                    <span className="text-lg font-bold tracking-tight">ManuFlow</span>
                                </div>
                            )}
                            <SidebarToggle />
                        </div>

                        {isContractRoute && (
                            <div className="mb-6">
                                <Link
                                    href="/contracts"
                                    className={cn(
                                        "flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors",
                                        isCollapsed ? "justify-center" : "px-3 py-2"
                                    )}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    {!isCollapsed && (
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            Sair
                                        </span>
                                    )}
                                </Link>
                            </div>
                        )}

                        <nav className="space-y-1 flex-1">
                            {currentNavItems.map((item) => (
                                <NavLink key={item.href} item={item} />
                            ))}
                        </nav>

                        {/* User Info & Actions */}
                        <div className="mt-auto pt-4 border-t border-border/40">
                            {!isCollapsed && (
                                <div className="px-3 mb-4">
                                    <p className="text-xs font-bold text-foreground truncate">{session.user.name}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">{session.user.role}</p>
                                </div>
                            )}
                            <div className={cn("flex gap-2", isCollapsed ? "flex-col items-center" : "px-3")}>
                                <ThemeToggle />
                                <SignOutButton />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-10 overflow-auto animate-in scrollbar-hide pb-24 lg:pb-10">
                    <div className="w-full">{children}</div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50">
                <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
                    {currentNavItems.slice(0, 5).map((item) => (
                        <BottomNavLink key={item.href} item={item} />
                    ))}
                </div>
            </nav>
        </div>
    );
}
