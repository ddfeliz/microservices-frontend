"use client";
import { useState, useEffect } from "react";
import Shell from "../components/Shell";
import PageHeader from "../components/PageHeader";
import { api } from "../../lib/api";
import type {
    Notification, NotifFormData, NotifStats,
    NotifCategoryStat, NotifType, NotifCategory,
    NotifPriority, NotifResponse
} from "../../types";
import { Plus, Check, CheckCheck, Trash2, Stethoscope, AlertCircle, Syringe, Heart, Brain, Activity, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TYPE_VARIANT: Record<NotifType, "default" | "secondary" | "destructive" | "outline"> = {
    info: "outline",
    success: "default",
    warning: "secondary",
    error: "destructive",
};
const PRIORITY_LABEL: Record<NotifPriority, string> = {
    low: "Faible", medium: "Moyen", high: "Élevé", urgent: "Urgent"
};
const CATEGORIES: NotifCategory[] = ["consultation", "resultat", "urgence", "rappel", "ordonnance", "hospitalisation"];

const EMPTY: NotifFormData = {
    title: "", message: "", type: "info", category: "consultation",
    priority: "medium", employeeId: "all", employeeName: "Tous"
};

export default function NotificationsPage() {
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [stats, setStats] = useState<NotifStats | null>(null);
    const [total, setTotal] = useState(0);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [catF, setCatF] = useState("all");
    const [readF, setReadF] = useState("all");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<NotifFormData>(EMPTY);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const p = new URLSearchParams();
                if (catF !== "all") p.set("category", catF);
                if (readF !== "all") p.set("read", readF);
                p.set("limit", "50");
                const [n, s] = await Promise.all([
                    api.notify.list(`?${p}`) as Promise<NotifResponse>,
                    api.notify.stats() as Promise<NotifStats>,
                ]);
                setNotifs(n.data ?? []);
                setTotal(n.total ?? 0);
                setUnread(n.unread ?? 0);
                setStats(s);
            } finally { setLoading(false); }
        };
        void load();
    }, [catF, readF]);

    const markRead = async (id: string) => {
        await api.notify.markRead(id);
        setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        setUnread(u => Math.max(0, u - 1));
    };
    const markAll = async () => {
        await api.notify.markAllRead();
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
        setUnread(0);
    };
    const del = async (id: string) => {
        await api.notify.delete(id);
        setNotifs(prev => prev.filter(n => n._id !== id));
        setTotal(t => t - 1);
    };
    const save = async () => {
        setSaving(true);
        try { await api.notify.create(form); setOpen(false); setCatF(c => c); }
        finally { setSaving(false); }
    };

    const f = (k: keyof NotifFormData, v: string) => setForm(p => ({ ...p, [k]: v }));

    type SelectField = [string, keyof NotifFormData, string[]];
    const selectFields: SelectField[] = [
        ["Type", "type", ["info", "success", "warning", "error"] as NotifType[]],
        ["Catégorie", "category", CATEGORIES as string[]],
        ["Priorité", "priority", ["low", "medium", "high", "urgent"] as NotifPriority[]],
    ];

    const getCategoryIcon = (category: string) => {
        switch(category) {
            case "consultation": return <Stethoscope size={12} className="mr-1" />;
            case "resultat": return <Activity size={12} className="mr-1" />;
            case "urgence": return <AlertCircle size={12} className="mr-1" />;
            case "rappel": return <Bell size={12} className="mr-1" />;
            case "ordonnance": return <Syringe size={12} className="mr-1" />;
            case "hospitalisation": return <Heart size={12} className="mr-1" />;
            default: return null;
        }
    };

    return (
        <Shell>
            <PageHeader
                title="Alertes médicales & résultats"
                subtitle={`${unread} non consultées · ${total} au total`}
                action={
                    <div className="flex gap-2">
                        {unread > 0 && (
                            <Button variant="outline" size="sm" onClick={markAll}>
                                <CheckCheck size={14} className="mr-1" /> Tout marquer lu
                            </Button>
                        )}
                        <Button 
                            size="sm" 
                            onClick={() => { setForm(EMPTY); setOpen(true); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            <Plus size={14} className="mr-1" /> Nouvelle alerte
                        </Button>
                    </div>
                }
            />

            {/* Stats catégories */}
            {stats && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
                    {(stats.byCategory ?? []).map((c: NotifCategoryStat) => (
                        <Card
                            key={c._id}
                            className={cn(
                                "cursor-pointer transition-colors hover:shadow-md",
                                catF === c._id && "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                            )}
                            onClick={() => setCatF(catF === c._id ? "all" : c._id)}
                        >
                            <CardContent className="p-3 text-center">
                                <div className="flex justify-center mb-1">
                                    {getCategoryIcon(c._id)}
                                </div>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{c.count}</p>
                                <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                                    {c._id === "consultation" ? "Consultations" :
                                     c._id === "resultat" ? "Résultats" :
                                     c._id === "urgence" ? "Urgences" :
                                     c._id === "rappel" ? "Rappels" :
                                     c._id === "ordonnance" ? "Ordonnances" : "Hospitalisations"}
                                </p>
                                {c.unread > 0 && (
                                    <p className="text-[10px] font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400">
                                        {c.unread} non consultées
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Filtres */}
            <Card className="mb-5 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-3 flex gap-3">
                    <Select value={readF} onValueChange={setReadF}>
                        <SelectTrigger className="w-[160px] h-8 text-sm border-slate-200">
                            <SelectValue placeholder="Statut lecture" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="false">Non consultées</SelectItem>
                            <SelectItem value="true">Consultées</SelectItem>
                        </SelectContent>
                    </Select>
                    {catF !== "all" && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => setCatF("all")}
                        >
                            Effacer filtre
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Liste */}
            <div className="space-y-2">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                            <p className="text-muted-foreground text-sm">Chargement des alertes...</p>
                        </div>
                    </div>
                ) : notifs.length === 0 ? (
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-12 text-center">
                            <Bell size={40} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">Aucune alerte médicale</p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-3 border-emerald-200 text-emerald-600"
                                onClick={() => { setForm(EMPTY); setOpen(true); }}
                            >
                                <Plus size={14} className="mr-1" /> Créer une alerte
                            </Button>
                        </CardContent>
                    </Card>
                ) : notifs.map(n => (
                    <Card key={n._id} className={cn(
                        "border-slate-200 dark:border-slate-800 transition-all",
                        !n.read && "border-l-4 border-l-emerald-500 shadow-md"
                    )}>
                        <CardContent className="p-4 flex gap-4 items-start">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className={cn("text-sm", !n.read ? "font-semibold text-slate-800 dark:text-slate-100" : "font-normal text-muted-foreground")}>
                                            {n.title}
                                        </p>
                                        {!n.read && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant={TYPE_VARIANT[n.type]} className="text-xs">
                                            {n.type === "info" ? "Information" :
                                             n.type === "success" ? "Succès" :
                                             n.type === "warning" ? "Attention" : "Urgence"}
                                        </Badge>
                                        <span className={cn(
                                            "text-[11px] font-medium px-1.5 py-0.5 rounded",
                                            n.priority === "urgent" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                            n.priority === "high" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                            n.priority === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                        )}>
                                            {PRIORITY_LABEL[n.priority]}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[11px] text-muted-foreground">
                                        {n.employeeId === "all" ? "Tous les patients" : n.employeeName}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        {new Date(n.createdAt).toLocaleDateString("fr-FR")}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] py-0 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200">
                                        {n.category === "consultation" ? "Consultation" :
                                         n.category === "resultat" ? "Résultat" :
                                         n.category === "urgence" ? "Urgence" :
                                         n.category === "rappel" ? "Rappel" :
                                         n.category === "ordonnance" ? "Ordonnance" : "Hospitalisation"}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                {!n.read && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => markRead(n._id)}
                                    >
                                        <Check size={12} />
                                    </Button>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => del(n._id)}
                                >
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Bell size={18} className="text-emerald-500" />
                            Nouvelle alerte médicale
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Titre *</Label>
                            <Input 
                                className="h-8 text-sm border-slate-200 focus:border-emerald-300 focus:ring-emerald-200" 
                                value={form.title}
                                onChange={e => f("title", e.target.value)} 
                                placeholder="Ex: Résultat d'analyse disponible"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Message *</Label>
                            <Textarea 
                                className="text-sm resize-none border-slate-200 focus:border-emerald-300" 
                                rows={3}
                                value={form.message} 
                                onChange={e => f("message", e.target.value)} 
                                placeholder="Détails de l'alerte médicale..."
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {selectFields.map(([label, key, opts]) => (
                                <div key={key} className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
                                    <Select value={form[key] as string} onValueChange={v => f(key, v)}>
                                        <SelectTrigger className="h-8 text-sm border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {opts.map(o => (
                                                <SelectItem key={o} value={o}>
                                                    {key === "category" ? (
                                                        o === "consultation" ? "Consultation" :
                                                        o === "resultat" ? "Résultat" :
                                                        o === "urgence" ? "Urgence" :
                                                        o === "rappel" ? "Rappel" :
                                                        o === "ordonnance" ? "Ordonnance" : "Hospitalisation"
                                                    ) : o}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
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
                            {saving ? "Envoi..." : "Envoyer l'alerte"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Shell>
    );
}