"use client";
import { useState, useEffect } from "react";
import Shell from "../components/Shell";
import PageHeader from "../components/PageHeader";
import { api } from "../../lib/api";
import type {
    Leave, LeaveFormData, LeaveStats, LeaveStatus, LeaveType,
    LeaveStatusStat, PaginatedResponse, Employee
} from "../../types";
import { Plus, Check, X, Calendar, Clock, CalendarDays, Filter, Stethoscope, Syringe, Heart, Brain, Bone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const LEAVE_TYPES: LeaveType[] = [
    "Consultation générale", "Consultation spécialiste", "Urgence", "Téléconsultation",
    "Chirurgie programmée", "Examen radiologique", "IRM / Scanner", "Analyse biologique"
];

const STATUS_CONFIG: Record<LeaveStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    pending: { label: "En attente", variant: "outline", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200" },
    approved: { label: "Confirmé", variant: "default", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200" },
    rejected: { label: "Annulé", variant: "destructive", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200" },
    cancelled: { label: "Reporté", variant: "secondary", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200" },
};

const EMPTY: LeaveFormData = {
    employeeId: "", employeeName: "", department: "",
    type: "Consultation générale", startDate: "", endDate: "", days: "", reason: ""
};

export default function LeavesPage() {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [stats, setStats] = useState<LeaveStats | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusF, setStatusF] = useState("all");
    const [typeF, setTypeF] = useState("all");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<LeaveFormData>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const p = new URLSearchParams();
                if (statusF !== "all") p.set("status", statusF);
                if (typeF !== "all") p.set("type", typeF);
                p.set("limit", "50");
                const [lv, st] = await Promise.all([
                    api.leaves.list(`?${p}`) as Promise<PaginatedResponse<Leave>>,
                    api.leaves.stats() as Promise<LeaveStats>,
                ]);
                setLeaves(lv.data ?? []);
                setTotal(lv.total ?? 0);
                setStats(st);
            } finally { setLoading(false); }
        };
        void load();
    }, [statusF, typeF]);

    useEffect(() => {
        const load = async () => {
            const r = await api.employees.list("?limit=100&status=active") as PaginatedResponse<Employee>;
            setEmployees(r.data ?? []);
        };
        void load();
    }, []);

    const selectEmp = (id: string) => {
        const emp = employees.find(e => e.employeeId === id || e._id === id);
        if (!emp) return;
        setForm(p => ({
            ...p,
            employeeId: emp.employeeId,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            department: emp.department,
        }));
    };

    const save = async () => {
        setSaving(true); setError("");
        try {
            await api.leaves.create({ ...form, days: Number(form.days) });
            setOpen(false);
            setStatusF(s => s);
        } catch (e) { setError((e as Error).message); }
        finally { setSaving(false); }
    };

    const updateStatus = async (id: string, status: LeaveStatus) => {
        await api.leaves.updateStatus(id, { status, approvedBy: "Dr. Dashboard" });
        setLeaves(prev => prev.map(l => l._id === id ? { ...l, status } : l));
        if (stats) {
            const pending = status === "pending"
                ? stats.pending + 1
                : Math.max(0, stats.pending - 1);
            setStats({ ...stats, pending });
        }
    };

    const f = (k: keyof LeaveFormData, v: string) => setForm(p => ({ ...p, [k]: v }));
    const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR");

    // Calcul des totaux pour les stats
    const totalDays = stats?.byStatus?.reduce((sum, s) => sum + (s.totalDays || 0), 0) || 0;

    return (
        <Shell>
            <PageHeader
                title="Gestion des rendez-vous"
                subtitle={`${total} consultations · ${totalDays} heures au total`}
                action={
                    <Button 
                        size="sm" 
                        onClick={() => { setForm(EMPTY); setError(""); setOpen(true); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                        <Plus size={14} className="mr-1" /> Nouveau rendez-vous
                    </Button>
                }
            />

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {(Object.entries(STATUS_CONFIG) as [LeaveStatus, typeof STATUS_CONFIG[LeaveStatus]][]).map(([key, cfg]) => {
                        const found = stats.byStatus?.find((s: LeaveStatusStat) => s._id === key);
                        const isActive = statusF === key;
                        return (
                            <Card 
                                key={key} 
                                className={`cursor-pointer transition-all duration-200 border ${
                                    isActive 
                                        ? 'border-emerald-300 shadow-md ring-1 ring-emerald-200' 
                                        : 'border-slate-200 dark:border-slate-800 hover:shadow-md'
                                }`}
                                onClick={() => setStatusF(statusF === key ? "all" : key)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                                {found?.count ?? 0}
                                            </p>
                                            <Badge className={`mt-1 text-xs ${cfg.color} border-0`}>
                                                {cfg.label}
                                            </Badge>
                                        </div>
                                        <div className={`p-2 rounded-lg ${
                                            key === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                            key === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                            key === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                                            'bg-slate-100 dark:bg-slate-800'
                                        }`}>
                                            {key === 'pending' && <Clock size={18} className="text-amber-600" />}
                                            {key === 'approved' && <Check size={18} className="text-emerald-600" />}
                                            {key === 'rejected' && <X size={18} className="text-red-600" />}
                                            {key === 'cancelled' && <Calendar size={18} className="text-slate-600" />}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {found?.totalDays ?? 0} heures
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Filtres */}
            <Card className="mb-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex gap-3 flex-wrap items-center">
                        <Filter size={14} className="text-muted-foreground" />
                        <Select value={statusF} onValueChange={setStatusF}>
                            <SelectTrigger className="w-[160px] h-9 text-sm border-slate-200">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[LeaveStatus]][]).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={typeF} onValueChange={setTypeF}>
                            <SelectTrigger className="w-[200px] h-9 text-sm border-slate-200">
                                <SelectValue placeholder="Type de consultation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les types</SelectItem>
                                {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {(statusF !== "all" || typeF !== "all") && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => { setStatusF("all"); setTypeF("all"); }}
                            >
                                Réinitialiser
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tableau */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">Patient</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">Type</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">Date & heure</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">Durée</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">Motif / Symptômes</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">Statut</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-16">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                                        <p className="text-muted-foreground text-sm">Chargement des rendez-vous...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : leaves.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-16">
                                    <div className="flex flex-col items-center gap-2">
                                        <CalendarDays size={40} className="text-slate-300" />
                                        <p className="text-muted-foreground text-sm">Aucun rendez-vous programmé</p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => { setForm(EMPTY); setError(""); setOpen(true); }}
                                            className="mt-2 border-emerald-200 text-emerald-600"
                                        >
                                            <Plus size={14} className="mr-1" /> Nouveau rendez-vous
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : leaves.map(l => {
                            const cfg = STATUS_CONFIG[l.status];
                            return (
                                <TableRow 
                                    key={l._id} 
                                    className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors border-b border-slate-100 dark:border-slate-800"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                                                {l.employeeName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                                    {l.employeeName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{l.department}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs font-normal bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-700">
                                            {l.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground">
                                        {fmt(l.startDate)} à {l.endDate || "à confirmer"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                            {l.days}h
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                                        {l.reason || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`text-xs border-0 ${cfg.color}`}>
                                            {cfg.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {l.status === "pending" && (
                                            <div className="flex justify-end gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                                    onClick={() => updateStatus(l._id, "approved")}
                                                >
                                                    <Check size={12} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => updateStatus(l._id, "rejected")}
                                                >
                                                    <X size={12} />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal Nouveau rendez-vous */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Stethoscope size={18} className="text-emerald-500" />
                            Nouvelle consultation
                        </DialogTitle>
                    </DialogHeader>
                    
                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                            {error}
                        </p>
                    )}
                    
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Patient *</Label>
                            <Select value={form.employeeId} onValueChange={selectEmp}>
                                <SelectTrigger className="h-9 text-sm border-slate-200 focus:border-emerald-300">
                                    <SelectValue placeholder="Sélectionner un patient..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(e => (
                                        <SelectItem key={e._id} value={e.employeeId}>
                                            {e.firstName} {e.lastName} (ID: {e.employeeId})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Type de consultation *</Label>
                            <Select value={form.type} onValueChange={v => f("type", v)}>
                                <SelectTrigger className="h-9 text-sm border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                ["Date *", "startDate", "date"],
                                ["Heure *", "endDate", "time"],
                                ["Durée (h) *", "days", "number"],
                            ] as [string, keyof LeaveFormData, string][]).map(([label, key, type]) => (
                                <div key={key} className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
                                    <Input 
                                        className="h-9 text-sm border-slate-200 focus:border-emerald-300 focus:ring-emerald-200" 
                                        type={type} 
                                        value={form[key] as string}
                                        onChange={e => f(key, e.target.value)} 
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Motif / Symptômes</Label>
                            <Input 
                                className="h-9 text-sm border-slate-200 focus:border-emerald-300" 
                                value={form.reason}
                                placeholder="Description des symptômes..."
                                onChange={e => f("reason", e.target.value)} 
                            />
                        </div>
                    </div>
                    
                    <Separator className="bg-slate-200 dark:bg-slate-800" />
                    
                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setOpen(false)}
                            className="border-slate-200"
                        >
                            Annuler
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={save} 
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {saving ? "Envoi..." : "Programmer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Shell>
    );
}