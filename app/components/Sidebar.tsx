"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
    LayoutDashboard, Users, CalendarOff,
    Bell, Wallet, Sun, Moon, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV = [
    { href: "/", icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/employees", icon: Users, label: "Patients" },
    { href: "/leaves", icon: CalendarOff, label: "Rendez-vous" },
    { href: "/notifications", icon: Bell, label: "Alertes" },
    { href: "/payroll", icon: Wallet, label: "Facturation" },
];

export default function Sidebar() {
    const path = usePathname();
    const { theme, setTheme } = useTheme();

    return (
        <aside className={cn(
            "fixed left-0 top-0 h-screen flex flex-col",
            "bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700",
            "shadow-xl z-40"
        )} style={{ width: "var(--sidebar-w)" }}>

            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-6 bg-gradient-to-r from-emerald-600 to-teal-700 mx-2 mt-2 rounded-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Activity size={18} className="text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold leading-none text-white">MediCare</p>
                    <p className="text-[10px] text-emerald-200 mt-0.5">Santé Connectée</p>
                </div>
            </div>

            <Separator className="bg-slate-700 my-3" />

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Navigation
                </p>
                {NAV.map(({ href, icon: Icon, label }) => {
                    const active = path === href;
                    return (
                        <Link key={href} href={href}>
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer",
                                active
                                    ? "bg-emerald-600 text-white shadow-md font-medium"
                                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                            )}>
                                <Icon size={18} className={active ? "text-white" : "text-slate-400"} />
                                {label}
                                {active && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <Separator className="bg-slate-700 my-2" />

            {/* Footer */}
            <div className="px-4 py-5 space-y-4">
                <div className="space-y-2 bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        Infrastructure
                    </p>
                    <p className="text-xs text-slate-300">Dossier médical · Sécurisé</p>
                    <p className="text-xs text-slate-300">Hébergé · HDS</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun size={14} className="dark:hidden text-amber-400" />
                    <Moon size={14} className="hidden dark:block text-emerald-300" />
                    <span className="text-xs">Changer de thème</span>
                </Button>
            </div>
        </aside>
    );
}