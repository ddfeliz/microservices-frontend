"use client";
import { useState, useEffect } from "react";
import Shell from "../components/Shell";
import PageHeader from "../components/PageHeader";
import { api } from "../../lib/api";
import type { Employee, EmployeeFormData, PaginatedResponse, Department, ContractType, EmpStatus } from "../../types";
import { Search, Plus, Pencil, Trash2, Users, Briefcase, MapPin, Mail, Phone, Tag, Activity, Heart, Stethoscope, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";

const DEPARTMENTS: Department[] = ["Cardiologie", "Pédiatrie", "Neurologie", "Dermatologie", "Urgences", "Chirurgie", "Radiologie"];
const CONTRACT_TYPES: ContractType[] = ["Hospitalisation", "Consultation externe", "Urgence", "Soins de suite"];
const STATUSES: { value: EmpStatus; label: string }[] = [
    { value: "active", label: "Actif" },
    { value: "inactive", label: "Inactif" },
    { value: "onLeave", label: "En congé" },
];

const EMP_STATUS_LABEL: Record<EmpStatus, string> = {
    active: "Actif", inactive: "Inactif", onLeave: "En congé"
};
const EMP_STATUS_VARIANT: Record<EmpStatus, "default" | "secondary" | "outline" | "destructive"> = {
    active: "default", inactive: "secondary", onLeave: "outline"
};
const EMP_STATUS_COLOR: Record<EmpStatus, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
    inactive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200",
    onLeave: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200"
};

const EMPTY: EmployeeFormData = {
    firstName: "", lastName: "", email: "", phone: "",
    position: "", department: "Cardiologie", contractType: "Hospitalisation",
    salary: "", city: "", skills: "", status: "active",
};

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [dept, setDept] = useState("all");
    const [status, setStatus] = useState("all");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<EmployeeFormData>(EMPTY);
    const [selected, setSelected] = useState<Employee | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const p = new URLSearchParams();
                if (search) p.set("search", search);
                if (dept !== "all") p.set("department", dept);
                if (status !== "all") p.set("status", status);
                p.set("limit", "50");
                const res = await api.employees.list(`?${p}`) as PaginatedResponse<Employee>;
                setEmployees(res.data ?? []);
                setTotal(res.total ?? 0);
            } finally { setLoading(false); }
        };
        void load();
    }, [search, dept, status]);

    const openCreate = () => { setForm(EMPTY); setSelected(null); setError(""); setOpen(true); };
    const openEdit = (e: Employee) => {
        setForm({
            firstName: e.firstName, lastName: e.lastName,
            email: e.email, phone: e.phone,
            position: e.position, department: e.department,
            contractType: e.contractType, salary: String(e.salary),
            city: e.address?.city ?? "", skills: e.skills?.join(", ") ?? "",
            status: e.status,
        });
        setSelected(e); setError(""); setOpen(true);
    };

    const save = async () => {
        setSaving(true); setError("");
        try {
            const payload = {
                ...form, salary: Number(form.salary),
                skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
                address: { street: "", city: form.city, country: "France" },
            };
            if (selected) await api.employees.update(selected._id, payload);
            else await api.employees.create(payload);
            setOpen(false);
            setSearch(s => s); // trigger reload
        } catch (e) { setError((e as Error).message); }
        finally { setSaving(false); }
    };

    const remove = async (id: string) => {
        if (!confirm("Supprimer ce patient ?")) return;
        await api.employees.delete(id);
        setEmployees(prev => prev.filter(e => e._id !== id));
        setTotal(t => t - 1);
    };

    const f = (k: keyof EmployeeFormData, v: string) =>
        setForm(p => ({ ...p, [k]: v }));

    // Statistiques pour l'en-tête (version médicale)
    const activeCount = employees.filter(e => e.status === "active").length;
    const avgSalary = employees.length > 0 
        ? Math.round(employees.reduce((sum, e) => sum + e.salary, 0) / employees.length)
        : 0;

    return (
        <Shell>
            <PageHeader
                title="Gestion des patients"
                subtitle={`${total} patients · Dossier médical sécurisé`}
                action={
                    <Button 
                        size="sm" 
                        onClick={openCreate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                        <Plus size={14} className="mr-1" /> Nouveau patient
                    </Button>
                }
            />

            {/* Stats rapides - Version médicale */}
            <div className="grid grid-cols-3 gap-4 mb-5">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Patients totaux</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{total}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">En traitement</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <Heart size={18} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Coût moyen / séjour</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {avgSalary.toLocaleString("fr")} €
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <Activity size={18} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtres */}
            <Card className="mb-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-8 h-9 text-sm border-slate-200 focus:border-emerald-300 focus:ring-emerald-200"
                                placeholder="Rechercher un patient..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={dept} onValueChange={setDept}>
                            <SelectTrigger className="w-[180px] h-9 text-sm border-slate-200">
                                <SelectValue placeholder="Spécialité" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les spécialités</SelectItem>
                                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[150px] h-9 text-sm border-slate-200">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {(search || dept !== "all" || status !== "all") && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => { setSearch(""); setDept("all"); setStatus("all"); }}
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
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">Spécialité / Médecin</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">Service</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider">Type séjour</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Coût estimé</TableHead>
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
                                        <p className="text-muted-foreground text-sm">Chargement des dossiers patients...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-16">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users size={40} className="text-slate-300" />
                                        <p className="text-muted-foreground text-sm">Aucun patient trouvé</p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={openCreate}
                                            className="mt-2 border-emerald-200 text-emerald-600"
                                        >
                                            <Plus size={14} className="mr-1" /> Ajouter un patient
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : employees.map(e => (
                            <TableRow 
                                key={e._id} 
                                className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors border-b border-slate-100 dark:border-slate-800"
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm shrink-0">
                                            {e.firstName[0]}{e.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                                {e.firstName} {e.lastName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Mail size={10} className="text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground">{e.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Phone size={10} className="text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground">{e.phone || "Non renseigné"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Stethoscope size={12} className="text-emerald-600" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {e.position}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs font-normal bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-700">
                                        {e.department}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">
                                        {e.contractType === "Hospitalisation" ? "Hospitalisation" :
                                         e.contractType === "Consultation externe" ? "Consultation externe" :
                                         e.contractType === "Urgence" ? "Urgence" : "Soins de suite"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                        {e.salary.toLocaleString("fr")} €
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`text-xs border ${EMP_STATUS_COLOR[e.status]}`}>
                                        {EMP_STATUS_LABEL[e.status]}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                            onClick={() => openEdit(e)}
                                        >
                                            <Pencil size={12} />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => remove(e._id)}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {selected ? "Modifier le dossier patient" : "Nouveau dossier patient"}
                        </DialogTitle>
                    </DialogHeader>

                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                            {error}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 py-2">
                        {([["Prénom *", "firstName"], ["Nom *", "lastName"],
                        ["Email *", "email"], ["Téléphone", "phone"],
                        ["Médecin traitant", "position"], ["Ville", "city"],
                        ] as [string, keyof EmployeeFormData][]).map(([label, key]) => (
                            <div key={key} className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
                                <Input 
                                    className="h-9 text-sm border-slate-200 focus:border-emerald-300 focus:ring-emerald-200" 
                                    value={form[key] as string}
                                    onChange={e => f(key, e.target.value)} 
                                />
                            </div>
                        ))}

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Service *</Label>
                            <Select value={form.department} onValueChange={v => f("department", v)}>
                                <SelectTrigger className="h-9 text-sm border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Type de séjour</Label>
                            <Select value={form.contractType} onValueChange={v => f("contractType", v)}>
                                <SelectTrigger className="h-9 text-sm border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONTRACT_TYPES.map(c => (
                                        <SelectItem key={c} value={c}>
                                            {c === "Hospitalisation" ? "Hospitalisation" :
                                             c === "Consultation externe" ? "Consultation externe" :
                                             c === "Urgence" ? "Urgence" : "Soins de suite"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Coût estimé (€)</Label>
                            <Input 
                                className="h-9 text-sm border-slate-200 focus:border-emerald-300" 
                                type="number" 
                                value={form.salary}
                                onChange={e => f("salary", e.target.value)} 
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Statut</Label>
                            <Select value={form.status} onValueChange={v => f("status", v)}>
                                <SelectTrigger className="h-9 text-sm border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Antécédents médicaux (séparés par des virgules)</Label>
                            <Input 
                                className="h-9 text-sm border-slate-200 focus:border-emerald-300" 
                                value={form.skills}
                                placeholder="Hypertension, Diabète, Allergies..."
                                onChange={e => f("skills", e.target.value)} 
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
                            {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Shell>
    );
}