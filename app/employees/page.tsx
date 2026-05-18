"use client";
import { useState, useEffect } from "react";
import Shell from "../components/Shell";
import PageHeader from "../components/PageHeader";
import { api } from "../../lib/api";
import type { Employee, EmployeeFormData, PaginatedResponse, Department, ContractType, EmpStatus } from "../../types";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
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

const DEPARTMENTS: Department[] = ["Engineering", "HR", "Finance", "Marketing", "Operations", "Legal", "Sales"];
const CONTRACT_TYPES: ContractType[] = ["CDI", "CDD", "Stage", "Alternance"];
const STATUSES: { value: EmpStatus; label: string }[] = [
    { value: "active", label: "Actif" },
    { value: "inactive", label: "Inactif" },
    { value: "onLeave", label: "En congé" },
];

const EMP_STATUS_LABEL: Record<EmpStatus, string> = {
    active: "Actif", inactive: "Inactif", onLeave: "En congé"
};
const EMP_STATUS_VARIANT: Record<EmpStatus, "default" | "secondary" | "outline"> = {
    active: "default", inactive: "secondary", onLeave: "outline"
};

const EMPTY: EmployeeFormData = {
    firstName: "", lastName: "", email: "", phone: "",
    position: "", department: "Engineering", contractType: "CDI",
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
        if (!confirm("Supprimer cet employé ?")) return;
        await api.employees.delete(id);
        setEmployees(prev => prev.filter(e => e._id !== id));
        setTotal(t => t - 1);
    };

    const f = (k: keyof EmployeeFormData, v: string) =>
        setForm(p => ({ ...p, [k]: v }));

    return (
        <Shell>
            <PageHeader
                title="Employés"
                subtitle={`${total} collaborateurs`}
                action={
                    <Button size="sm" onClick={openCreate}>
                        <Plus size={14} className="mr-1" /> Ajouter
                    </Button>
                }
            />

            {/* Filtres */}
            <Card className="mb-5">
                <CardContent className="p-3 flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-8 h-8 text-sm"
                            placeholder="Rechercher un employé..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={dept} onValueChange={setDept}>
                        <SelectTrigger className="w-[180px] h-8 text-sm">
                            <SelectValue placeholder="Département" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les départements</SelectItem>
                            {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[150px] h-8 text-sm">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {(search || dept !== "all" || status !== "all") && (
                        <Button variant="ghost" size="sm" className="h-8"
                            onClick={() => { setSearch(""); setDept("all"); setStatus("all"); }}>
                            Réinitialiser
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Tableau */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Collaborateur</TableHead>
                            <TableHead>Poste</TableHead>
                            <TableHead>Département</TableHead>
                            <TableHead>Contrat</TableHead>
                            <TableHead className="text-right">Salaire</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                                    Chargement...
                                </TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                                    Aucun employé trouvé
                                </TableCell>
                            </TableRow>
                        ) : employees.map(e => (
                            <TableRow key={e._id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
                                            {e.firstName[0]}{e.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{e.firstName} {e.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{e.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">{e.position}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs font-normal">{e.department}</Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{e.contractType}</TableCell>
                                <TableCell className="text-right text-sm font-mono">
                                    {e.salary.toLocaleString("fr")} €
                                </TableCell>
                                <TableCell>
                                    <Badge variant={EMP_STATUS_VARIANT[e.status]} className="text-xs">
                                        {EMP_STATUS_LABEL[e.status]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7"
                                            onClick={() => openEdit(e)}>
                                            <Pencil size={12} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                            onClick={() => remove(e._id)}>
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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selected ? "Modifier l'employé" : "Nouvel employé"}</DialogTitle>
                    </DialogHeader>

                    {error && (
                        <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                            {error}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 py-2">
                        {([["Prénom *", "firstName"], ["Nom *", "lastName"],
                        ["Email *", "email"], ["Téléphone", "phone"],
                        ["Poste *", "position"], ["Ville", "city"],
                        ] as [string, keyof EmployeeFormData][]).map(([label, key]) => (
                            <div key={key} className="space-y-1.5">
                                <Label className="text-xs">{label}</Label>
                                <Input className="h-8 text-sm" value={form[key] as string}
                                    onChange={e => f(key, e.target.value)} />
                            </div>
                        ))}

                        <div className="space-y-1.5">
                            <Label className="text-xs">Département *</Label>
                            <Select value={form.department} onValueChange={v => f("department", v)}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Type de contrat</Label>
                            <Select value={form.contractType} onValueChange={v => f("contractType", v)}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CONTRACT_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Salaire annuel (€)</Label>
                            <Input className="h-8 text-sm" type="number" value={form.salary}
                                onChange={e => f("salary", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Statut</Label>
                            <Select value={form.status} onValueChange={v => f("status", v)}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs">Compétences (séparées par des virgules)</Label>
                            <Input className="h-8 text-sm" value={form.skills}
                                placeholder="React, Node.js, Docker..."
                                onChange={e => f("skills", e.target.value)} />
                        </div>
                    </div>

                    <Separator />
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button size="sm" onClick={save} disabled={saving}>
                            {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Shell>
    );
}