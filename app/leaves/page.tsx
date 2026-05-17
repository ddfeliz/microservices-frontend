"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { api } from "../../lib/api";
import type {
    Leave, LeaveFormData, LeaveStats,
    LeaveStatus, LeaveStatusStat, Employee, PaginatedResponse
} from "../../types";

const LEAVE_TYPES = ["Congé Payé", "RTT", "Maladie", "Maternité", "Paternité", "Sans Solde", "Exceptionnel"];
const STATUS_CONFIG: Record<string, { color: string, bg: string, label: string }> = {
    pending: { color: "#92400E", bg: "#FEF3C7", label: "En attente" },
    approved: { color: "#065F46", bg: "#D1FAE5", label: "Approuvé" },
    rejected: { color: "#991B1B", bg: "#FEE2E2", label: "Refusé" },
    cancelled: { color: "#374151", bg: "#F3F4F6", label: "Annulé" },
};

const EMPTY_LEAVE: LeaveFormData = {
    employeeId: "", employeeName: "", department: "",
    type: "Congé Payé", startDate: "", endDate: "", days: "", reason: ""
};

export default function LeavesPage() {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [stats, setStats] = useState<LeaveStats | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [form, setForm] = useState<LeaveFormData>({
        employeeId: "", employeeName: "", department: "",
        type: "Congé Payé", startDate: "", endDate: "", days: "", reason: ""
    });
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatus] = useState("");
    const [typeFilter, setType] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set("status", statusFilter);
            if (typeFilter) params.set("type", typeFilter);
            params.set("limit", "50");
            const [lv, st] = await Promise.all([
                api.leaves.list(`?${params}`),
                api.leaves.stats(),
            ]);
            setLeaves(lv.data || []);
            setTotal(lv.total || 0);
            setStats(st);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        const fetchLeaves = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (statusFilter) params.set("status", statusFilter);
                if (typeFilter) params.set("type", typeFilter);
                params.set("limit", "50");
                const [lv, st] = await Promise.all([
                    api.leaves.list(`?${params}`) as Promise<PaginatedResponse<Leave>>,
                    api.leaves.stats() as Promise<LeaveStats>,
                ]);
                setLeaves(lv.data ?? []);
                setTotal(lv.total ?? 0);
                setStats(st);
            } finally { setLoading(false); }
        };
        void fetchLeaves();
    }, [statusFilter, typeFilter]);

    // Séparé pour les employés (sans setLoading)
    useEffect(() => {
        const fetchEmployees = async () => {
            const r = await api.employees.list("?limit=100&status=active") as PaginatedResponse<Employee>;
            setEmployees(r.data ?? []);
        };
        void fetchEmployees();
    }, []);

    useEffect(() => {
        api.employees.list("?limit=100&status=active").then(r => setEmployees(r.data || []));
    }, []);

    const selectEmployee = (id: string) => {
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
            setShowModal(false);
            load();
        } catch (e) { setError((e as Error).message); }
        finally { setSaving(false); }
    };

    const updateStatus = async (id: string, status: string) => {
        await api.leaves.updateStatus(id, { status, approvedBy: "RH Dashboard" });
        load();
    };

    const f = (k: string, v: string) => setForm((p: LeaveFormData) => ({ ...p, [k]: v }));

    const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

    return (
        <div style={{ display: "flex" }}>
            <Sidebar />
            <main className="main-content">
                <PageHeader
                    title="🏖️ Congés"
                    subtitle={`${total} demandes`}
                    action={<button className="btn btn-primary" onClick={() => { setForm(EMPTY_LEAVE); setError(""); setShowModal(true); }}>
                        + Nouvelle demande
                    </button>}
                />

                {/* Stats rapides */}
                {stats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                            const found = stats.byStatus?.find((s: LeaveStatusStat) => s._id === key);
                            return (
                                <div key={key} className="stat-card" style={{ padding: 18 }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>{found?.count || 0}</div>
                                    <div className="badge" style={{ marginTop: 6, background: cfg.bg, color: cfg.color }}>{cfg.label}</div>
                                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{found?.totalDays || 0}j total</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Filtres */}
                <div className="card" style={{ padding: 14, marginBottom: 20, display: "flex", gap: 12 }}>
                    <select className="input" style={{ maxWidth: 180 }} value={statusFilter} onChange={e => setStatus(e.target.value)}>
                        <option value="">Tous les statuts</option>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <select className="input" style={{ maxWidth: 200 }} value={typeFilter} onChange={e => setType(e.target.value)}>
                        <option value="">Tous les types</option>
                        {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="card" style={{ overflow: "hidden" }}>
                    {loading ? (
                        <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>Chargement...</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Employé</th><th>Type</th><th>Période</th>
                                    <th>Durée</th><th>Motif</th><th>Statut</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((l: Leave) => {
                                    const cfg = STATUS_CONFIG[l.status];
                                    return (
                                        <tr key={l._id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{l.employeeName}</div>
                                                <div style={{ fontSize: 12, color: "#94A3B8" }}>{l.department}</div>
                                            </td>
                                            <td>
                                                <span className="badge" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{l.type}</span>
                                            </td>
                                            <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                                                {fmtDate(l.startDate)} → {fmtDate(l.endDate)}
                                            </td>
                                            <td style={{ fontWeight: 700, color: "#0F172A" }}>{l.days}j</td>
                                            <td style={{ maxWidth: 200, color: "#64748B", fontSize: 13 }}>
                                                {l.reason || "—"}
                                            </td>
                                            <td>
                                                <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                            </td>
                                            <td>
                                                {l.status === "pending" && (
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button className="btn" style={{
                                                            padding: "5px 10px", fontSize: 12,
                                                            background: "#D1FAE5", color: "#065F46"
                                                        }}
                                                            onClick={() => updateStatus(l._id, "approved")}>✓ Approuver</button>
                                                        <button className="btn" style={{
                                                            padding: "5px 10px", fontSize: 12,
                                                            background: "#FEE2E2", color: "#991B1B"
                                                        }}
                                                            onClick={() => updateStatus(l._id, "rejected")}>✕ Refuser</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🏖️ Nouvelle demande de congé</h2>
                            {error && (
                                <div style={{
                                    background: "#FEE2E2", color: "#DC2626", padding: "10px 14px",
                                    borderRadius: 8, marginBottom: 16, fontSize: 14
                                }}>{error}</div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
                                        Employé *
                                    </label>
                                    <select className="input" value={form.employeeId}
                                        onChange={e => selectEmployee(e.target.value)}>
                                        <option value="">Sélectionner un employé</option>
                                        {employees.map((e: Employee) => (
                                            <option key={e._id} value={e.employeeId}>
                                                {e.firstName} {e.lastName} ({e.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
                                        Type de congé *
                                    </label>
                                    <select className="input" value={form.type} onChange={e => f("type", e.target.value)}>
                                        {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                    {(
                                        [
                                            ["Date début *", "startDate", "date"],
                                            ["Date fin *", "endDate", "date"],
                                            ["Nb jours *", "days", "number"],
                                        ] as [string, keyof LeaveFormData, string][]
                                    ).map(([label, key, type]) => (
                                        <div key={key}>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
                                                {label}
                                            </label>
                                            <input className="input" type={type} value={form[key]}
                                                onChange={e => f(key, e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Motif</label>
                                    <input className="input" value={form.reason}
                                        placeholder="Raison de la demande..."
                                        onChange={e => f("reason", e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={save} disabled={saving}>
                                    {saving ? "⏳..." : "✅ Soumettre"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}