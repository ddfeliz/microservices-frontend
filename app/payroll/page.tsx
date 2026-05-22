"use client";
import { useState, useEffect } from "react";
import Shell from "../components/Shell";
import PageHeader from "../components/PageHeader";
import { api } from "../../lib/api";
import type { Employee, PayslipResult, BatchPayrollResult, BenchmarkResult, PaginatedResponse } from "../../types";
import { Play, Zap, Stethoscope, Activity, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payslip, setPayslip] = useState<PayslipResult | null>(null);
    const [batch, setBatch] = useState<BatchPayrollResult | null>(null);
    const [benchResults, setBench] = useState<BenchmarkResult[]>([]);
    const [running, setRunning] = useState(false);
    const [benchRun, setBenchRun] = useState(false);
    const [benchCount, setBenchCount] = useState(0);
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

    useEffect(() => {
        const load = async () => {
            const r = await api.employees.list("?limit=100&status=active") as PaginatedResponse<Employee>;
            setEmployees(r.data ?? []);
        };
        void load();
    }, []);

    const calcPayslip = async () => {
        if (!selectedEmp) return;
        setRunning(true); setPayslip(null);
        try {
            const seniority = Math.floor(
                (Date.now() - new Date(selectedEmp.hireDate).getTime()) / (365.25 * 24 * 3600 * 1000)
            );
            const res = await api.payroll.calculate({
                name: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
                salary: selectedEmp.salary,
                department: selectedEmp.department,
                contractType: selectedEmp.contractType,
                seniority,
            }) as PayslipResult;
            setPayslip(res);
        } finally { setRunning(false); }
    };

    const calcBatch = async () => {
        setRunning(true); setBatch(null);
        try {
            const res = await api.payroll.batch({
                employees: employees.map((e: Employee) => ({
                    name: `${e.firstName} ${e.lastName}`,
                    salary: e.salary,
                    department: e.department,
                    contractType: e.contractType,
                }))
            }) as BatchPayrollResult;
            setBatch(res);
        } finally { setRunning(false); }
    };

    const runBenchmark = async () => {
        setBenchRun(true); setBenchCount(0); setBench([]);
        for (let i = 0; i < 20; i++) {
            const r = await api.payroll.benchmark(40) as BenchmarkResult;
            setBench(p => [r, ...p].slice(0, 15));
            setBenchCount(i + 1);
        }
        setBenchRun(false);
    };

    const row = (label: string, value: string | number, highlight = false) => (
        <div className="flex justify-between py-2 border-b last:border-0 border-slate-100 dark:border-slate-800">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={cn("text-sm font-mono", highlight && "font-semibold text-emerald-600 dark:text-emerald-400")}>
                {value}
            </span>
        </div>
    );

    return (
        <Shell>
            <PageHeader 
                title="Facturation & Coûts médicaux" 
                subtitle="Simulation des coûts de soins et benchmark HPA" 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Simulateur de coûts */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Stethoscope size={16} className="text-emerald-500" />
                            Simulateur de coûts médicaux
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Calcul individuel des coûts de soins (part patient + sécu)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Patient</Label>
                            <Select onValueChange={id => {
                                const found = employees.find(e => e._id === id);
                                if (found) setSelectedEmp(found);
                            }}>
                                <SelectTrigger className="h-8 text-sm border-slate-200 focus:border-emerald-300">
                                    <SelectValue placeholder="Sélectionner un patient" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(e => (
                                        <SelectItem key={e._id} value={e._id}>
                                            {e.firstName} {e.lastName} — {e.department}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" 
                            size="sm" 
                            onClick={calcPayslip}
                            disabled={!selectedEmp || running}
                        >
                            <Play size={13} className="mr-1.5" />
                            {running ? "Calcul en cours..." : "Calculer les coûts"}
                        </Button>

                        {payslip && (
                            <div className="pt-2">
                                <Separator className="mb-3 bg-slate-200 dark:bg-slate-800" />
                                {row("Coût total des soins", `${payslip.gross.toLocaleString("fr")} €`)}
                                {row("Part patient (mutuelle + ticket modérateur)", `− ${payslip.employeeContributions.toLocaleString("fr")} €`)}
                                {row("Prise en charge sécu / mutuelle", `${payslip.netBeforeTax.toLocaleString("fr")} €`)}
                                {row("Prime d'ancienneté patient fidèle", `+ ${payslip.seniorityBonus.toLocaleString("fr")} €`)}
                                {row("Programme prévention santé", `+ ${payslip.perfBonus.toLocaleString("fr")} €`)}
                                {row("Forfaits hospitaliers", `+ ${payslip.mealVouchers.toLocaleString("fr")} €`)}
                                <Separator className="my-2 bg-slate-200 dark:bg-slate-800" />
                                {row("RESTE À CHARGE PATIENT", `${payslip.netTotal.toLocaleString("fr")} €`, true)}
                                <p className="text-[11px] text-muted-foreground font-mono mt-2">
                                    {payslip.durationMs}ms · Service {payslip.pod?.slice(0, 16)}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Coûts globaux */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Heart size={16} className="text-emerald-500" />
                            Coûts de soins globaux
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Traitement batch de tous les patients actifs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            Calcule le coût total des soins pour les {employees.length} patients actifs.
                            Traitement intensif CPU — déclenche le HPA (autoscaling Kubernetes).
                        </p>
                        <Button 
                            className="w-full" 
                            size="sm" 
                            variant="outline"
                            onClick={calcBatch} 
                            disabled={running || employees.length === 0}
                        >
                            <Play size={13} className="mr-1.5" />
                            {running ? "Traitement en cours..." : `Batch (${employees.length} patients)`}
                        </Button>

                        {batch && (
                            <div className="pt-2">
                                <Separator className="mb-3 bg-slate-200 dark:bg-slate-800" />
                                {row("Patients traités", batch.count)}
                                {row("Coût mensuel total des soins", `${batch.totalPayroll.toLocaleString("fr")} €`, true)}
                                {row("Coût annuel total", `${(batch.totalPayroll * 12).toLocaleString("fr")} €`, true)}
                                <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                                        📊 Moyennes
                                    </p>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-muted-foreground">Coût moyen par patient</span>
                                        <span className="font-mono font-semibold text-emerald-600">
                                            {(batch.totalPayroll / batch.count).toLocaleString("fr")} €/mois
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-mono mt-2">
                                    {batch.durationMs}ms · Service {batch.pod?.slice(0, 16)}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Benchmark */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Activity size={16} className="text-emerald-500" />
                            Benchmark CPU — Autoscaling Médical
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            20 calculs intensifs Fibonacci(40) — observez le scaling automatique des pods
                        </CardDescription>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={runBenchmark} 
                        disabled={benchRun}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0"
                    >
                        <Zap size={13} className="mr-1.5" />
                        {benchRun ? `En cours (${benchCount}/20)` : "Lancer benchmark médical"}
                    </Button>
                </CardHeader>
                <CardContent>
                    {benchResults.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead className="text-xs font-semibold">#</TableHead>
                                    <TableHead className="text-xs font-semibold">Service/Pod</TableHead>
                                    <TableHead className="text-xs font-semibold">Calcul médical</TableHead>
                                    <TableHead className="text-xs font-semibold">Analyses triées</TableHead>
                                    <TableHead className="text-xs font-semibold text-right">Temps réponse</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {benchResults.map((r: BenchmarkResult, i: number) => (
                                    <TableRow key={i} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20">
                                        <TableCell className="text-xs text-muted-foreground font-mono">
                                            {benchResults.length - i}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground">
                                            {r.pod?.slice(0, 18)}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            fibo({r.input}) → {r.fibonacci?.toLocaleString("fr")}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {r.sortedElements?.toLocaleString("fr")} résultats
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={r.durationMs > 1500 ? "destructive" : r.durationMs > 800 ? "outline" : "secondary"}
                                                className={cn(
                                                    "text-xs font-mono",
                                                    r.durationMs <= 800 && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                )}
                                            >
                                                {r.durationMs}ms
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {benchResults.length === 0 && !benchRun && (
                        <div className="text-center py-8">
                            <Activity size={32} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">
                                Lancez le benchmark pour tester l'autoscaling de l'infrastructure médicale
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Shell>
    );
}