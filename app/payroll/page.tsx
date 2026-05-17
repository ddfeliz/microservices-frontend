"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { api } from "../../lib/api";
import type { Employee, PayslipResult, BatchPayrollResult, BenchmarkResult, PaginatedResponse } from "../../types";

export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payslip, setPayslip] = useState<PayslipResult | null>(null);
    const [batchResult, setBatch] = useState<BatchPayrollResult | null>(null);
    const [benchResults, setBench] = useState<BenchmarkResult[]>([]);
    const [running, setRunning] = useState(false);
    const [benchRunning, setBenchRunning] = useState(false);
    const [benchCount, setBenchCount] = useState(0);
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

    useEffect(() => {
        const fetchEmployees = async () => {
            const r = await api.employees.list("?limit=100&status=active") as PaginatedResponse<Employee>;
            setEmployees(r.data ?? []);
        };
        void fetchEmployees();
    }, []);

    const calcPayslip = async () => {
        if (!selectedEmp) return;
        setRunning(true); setPayslip(null);
        try {
            const res = await api.payroll.calculate({
                name: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
                salary: selectedEmp.salary,
                department: selectedEmp.department,
                contractType: selectedEmp.contractType,
                seniority: Math.floor((Date.now() - new Date(selectedEmp.hireDate).getTime()) / (365.25 * 24 * 3600 * 1000)),
            });
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
            });
            setBatch(res);
        } finally { setRunning(false); }
    };

    const runBenchmark = async () => {
        setBenchRunning(true); setBenchCount(0); setBench([]);
        for (let i = 0; i < 20; i++) {
            const r = await api.payroll.benchmark(40);
            setBench(p => [r, ...p].slice(0, 15));
            setBenchCount(i + 1);
        }
        setBenchRunning(false);
    };

    const row = (label: string, value: string | number, bold = false, color = "#374151") => (
        <div style={{
            display: "flex", justifyContent: "space-between", padding: "10px 0",
            borderBottom: "1px solid #F1F5F9"
        }}>
            <span style={{ fontSize: 14, color: "#64748B" }}>{label}</span>
            <span style={{
                fontSize: 14, fontWeight: bold ? 700 : 500, color,
                fontFamily: "var(--font-mono)"
            }}>{value}</span>
        </div>
    );

    return (
        <div style={{ display: "flex" }}>
            <Sidebar />
            <main className="main-content">
                <PageHeader title="💰 Paie & Performance" subtitle="Simulation de paie + Benchmark HPA" />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

                    {/* Simulateur de fiche de paie */}
                    <div className="card" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🧾 Simulateur de fiche de paie</h2>
                        <select className="input" style={{ marginBottom: 14 }}
                            onChange={e => {
                                const found = employees.find(emp => emp._id === e.target.value);
                                if (found) setSelectedEmp(found);
                            }}>
                            <option value="">Sélectionner un employé</option>
                            {employees.map((e: Employee) => (
                                <option key={e._id} value={e._id}>
                                    {e.firstName} {e.lastName} — {e.department}
                                </option>
                            ))}
                        </select>
                        <button className="btn btn-primary" style={{ width: "100%" }}
                            onClick={calcPayslip} disabled={!selectedEmp || running}>
                            {running ? "⏳ Calcul en cours..." : "🧮 Calculer la fiche"}
                        </button>

                        {payslip && (
                            <div style={{ marginTop: 20 }}>
                                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16 }}>
                                    {row("Salaire brut mensuel", `${payslip.gross.toLocaleString("fr")} €`)}
                                    {row("Cotisations salariales (-)", `${payslip.employeeContributions.toLocaleString("fr")} €`, false, "#EF4444")}
                                    {row("Cotisations patronales", `${payslip.employerContributions.toLocaleString("fr")} €`, false, "#94A3B8")}
                                    {row("Net avant impôt", `${payslip.netBeforeTax.toLocaleString("fr")} €`)}
                                    {row("Prime ancienneté (+)", `${payslip.seniorityBonus.toLocaleString("fr")} €`, false, "#10B981")}
                                    {row("Prime performance (+)", `${payslip.perfBonus.toLocaleString("fr")} €`, false, "#10B981")}
                                    {row("Tickets restaurant (+)", `${payslip.mealVouchers.toLocaleString("fr")} €`, false, "#10B981")}
                                    <div style={{ height: 1, background: "#E2E8F0", margin: "8px 0" }} />
                                    {row("NET À PAYER", `${payslip.netTotal.toLocaleString("fr")} €`, true, "#0F172A")}
                                    <div style={{
                                        marginTop: 8, fontSize: 12, color: "#94A3B8",
                                        fontFamily: "var(--font-mono)"
                                    }}>
                                        ⏱ Calculé en {payslip.durationMs}ms · Pod: {payslip.pod?.slice(0, 12)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Masse salariale */}
                    <div className="card" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📊 Masse salariale globale</h2>
                        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
                            Calcule les fiches de paie de tous les employés actifs en un batch — intensif CPU.
                        </p>
                        <button className="btn btn-primary" style={{ width: "100%", marginBottom: 16 }}
                            onClick={calcBatch} disabled={running || employees.length === 0}>
                            {running ? "⏳ Traitement batch..." : `🏭 Lancer batch (${employees.length} employés)`}
                        </button>

                        {batchResult && (
                            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16 }}>
                                {row("Employés traités", batchResult.count)}
                                {row("Masse salariale mensuelle", `${batchResult.totalPayroll.toLocaleString("fr")} €`, true, "#3B82F6")}
                                {row("Masse salariale annuelle", `${(batchResult.totalPayroll * 12).toLocaleString("fr")} €`, true, "#0F172A")}
                                <div style={{ marginTop: 12, fontSize: 12, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>
                                    ⏱ {batchResult.durationMs}ms · Pod: {batchResult.pod?.slice(0, 12)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Benchmark HPA */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>⚡ Benchmark CPU — Déclencheur HPA</h2>
                            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                                20 requêtes Fibonacci(40) séquentielles · Observer le scaling dans kubectl get hpa
                            </p>
                        </div>
                        <button className="btn btn-primary" style={{ background: "#EF4444" }}
                            onClick={runBenchmark} disabled={benchRunning}>
                            {benchRunning ? `🔥 Benchmark... (${benchCount}/20)` : "🔥 Lancer Benchmark"}
                        </button>
                    </div>

                    {benchResults.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th><th>Pod</th><th>Fibonacci(40)</th>
                                    <th>Éléments triés</th><th>Durée</th>
                                </tr>
                            </thead>
                            <tbody>
                                {benchResults.map((r: BenchmarkResult, i: number) => (
                                    <tr key={i}>
                                        <td style={{ color: "#94A3B8", fontFamily: "var(--font-mono)" }}>{benchResults.length - i}</td>
                                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#7C3AED" }}>
                                            {r.pod?.slice(0, 18)}
                                        </td>
                                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                                            {r.input} → {r.fibonacci?.toLocaleString("fr")}
                                        </td>
                                        <td style={{ color: "#64748B" }}>{r.sortedElements?.toLocaleString("fr")}</td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700, fontFamily: "var(--font-mono)",
                                                color: r.durationMs > 1000 ? "#EF4444" : r.durationMs > 500 ? "#F59E0B" : "#10B981"
                                            }}>
                                                {r.durationMs}ms
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}