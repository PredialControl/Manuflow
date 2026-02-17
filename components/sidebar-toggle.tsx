"use client";

import React from "react";
import { Menu, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-context";

export function SidebarToggle() {
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-primary/10 transition-colors"
            onClick={toggleSidebar}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
            {isCollapsed ? (
                <Menu className="h-5 w-5 text-foreground" />
            ) : (
                <ChevronLeft className="h-5 w-5 text-foreground" />
            )}
        </Button>
    );
}
