"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { api } from "../../lib/api";
import type {
    Notification, NotifFormData, NotifStats,
    NotifCategoryStat, NotifType, NotifCategory, NotifPriority,
    NotifResponse
} from "../../types";

const TYPE_CONFIG: Record<string, { icon: string, color: string, bg: string }> = {
    info: { icon: "ℹ️", color: "#1D4ED8", bg: "#EFF6FF" },
    success: { icon: "✅", color: "#065F46", bg: "#D1FAE5" },
    warning: { icon: "⚠️", color: "#92400E", bg: "#FEF3C7" },
    error: { icon: "🚨", color: "#991B1B", bg: "#FEE2E2" },
};
const PRIORITY_COLOR: Record<string, string> = {
    low: "#6B7280", medium: "#3B82F6", high: "#F59E0B", urgent: "#EF4444"
};
const CATEGORIES = ["conge", "paie", "rh", "systeme", "anniversaire", "contrat"];

export default function NotificationsPage() {
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [stats, setStats] = useState<NotifStats | null>(null);
    const [form, setForm] = useState<NotifFormData>({
        title: "", message: "", type: "info", category: "rh",
        priority: "medium", employeeId: "all", employeeName: "Tous"
    });
    const [total, setTotal] = useState(0);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [catFilter, setCat] = useState("");
    const [readFilter, setRead] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (catFilter) params.set("category", catFilter);
            if (readFilter) params.set("read", readFilter);
            params.set("limit", "50");
            const [n, s] = await Promise.all([api.notify.list(`?${params}`), api.notify.stats()]);
            setNotifs(n.data || []);
            setTotal(n.total || 0);
            setUnread(n.unread || 0);
            setStats(s);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        const fetchNotifs = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (catFilter) params.set("category", catFilter);
                if (readFilter) params.set("read", readFilter);
                params.set("limit", "50");
                const [n, s] = await Promise.all([
                    api.notify.list(`?${params}`) as Promise<NotifResponse>,
                    api.notify.stats() as Promise<NotifStats>,
                ]);
                setNotifs(n.data ?? []);
                setTotal(n.total ?? 0);
                setUnread(n.unread ?? 0);
                setStats(s);
            } finally { setLoading(false); }
        };
        void fetchNotifs();
    }, [catFilter, readFilter]);

    const markRead = async (id: string) => { await api.notify.markRead(id); load(); };
    const markAll = async () => { await api.notify.markAllRead(); load(); };
    const del = async (id: string) => { await api.notify.delete(id); load(); };
    const save = async () => {
        setSaving(true);
        try { await api.notify.create(form); setShowModal(false); load(); }
        finally { setSaving(false); }
    };
    const f = (k: string, v: string) => setForm((p: NotifFormData) => ({ ...p, [k]: v }));

    type SelectField = [string, keyof NotifFormData, string[]];

    const selectFields: SelectField[] = [
        ["Type", "type", ["info", "success", "warning", "error"]],
        ["Catégorie", "category", CATEGORIES as string[]],
        ["Priorité", "priority", ["low", "medium", "high", "urgent"]],
    ];

    return (
        <div style={{ display: "flex" }}>
            <Sidebar />
            <main className="main-content">
                <PageHeader
                    title="🔔 Notifications"
                    subtitle={`${unread} non lues sur ${total}`}
                    action={
                        <div style={{ display: "flex", gap: 10 }}>
                            {unread > 0 && (
                                <button className="btn btn-ghost" onClick={markAll}>✓ Tout marquer lu</button>
                            )}
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Notification</button>
                        </div>
                    }
                />

                {/* Stats par catégorie */}
                {stats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
                        {(stats.byCategory || []).map((c: NotifCategoryStat) => (
                            <div key={c._id} className="stat-card" style={{
                                padding: 16, textAlign: "center",
                                cursor: "pointer", border: catFilter === c._id ? "2px solid #3B82F6" : "1px solid #E8ECF0"
                            }}
                                onClick={() => setCat(catFilter === c._id ? "" : c._id)}>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>{c.count}</div>
                                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, textTransform: "capitalize" }}>{c._id}</div>
                                {c.unread > 0 && (
                                    <div style={{ fontSize: 10, color: "#EF4444", fontWeight: 700 }}>{c.unread} non lues</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Filtres */}
                <div className="card" style={{ padding: 14, marginBottom: 20, display: "flex", gap: 12 }}>
                    <select className="input" style={{ maxWidth: 180 }} value={readFilter} onChange={e => setRead(e.target.value)}>
                        <option value="">Toutes</option>
                        <option value="false">Non lues</option>
                        <option value="true">Lues</option>
                    </select>
                    {catFilter && (
                        <button className="btn btn-ghost" onClick={() => setCat("")}>✕ Effacer filtre</button>
                    )}
                </div>

                {/* Liste */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {loading ? (
                        <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>Chargement...</div>
                    ) : notifs.map((n: Notification) => {
                        const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                        return (
                            <div key={n._id} className="card" style={{
                                padding: "16px 20px",
                                display: "flex", alignItems: "flex-start", gap: 14,
                                opacity: n.read ? 0.65 : 1,
                                borderLeft: `4px solid ${tc.color}`,
                            }}>
                                <div style={{ fontSize: 24, flexShrink: 0 }}>{tc.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 15, color: "#0F172A" }}>
                                                {n.title}
                                            </span>
                                            {!n.read && (
                                                <span style={{
                                                    marginLeft: 8, width: 8, height: 8, background: "#3B82F6",
                                                    borderRadius: "50%", display: "inline-block"
                                                }} />
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <span className="badge" style={{ background: tc.bg, color: tc.color, fontSize: 11 }}>
                                                {n.type}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLOR[n.priority] }}>
                                                {n.priority.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{n.message}</p>
                                    <div style={{ display: "flex", gap: 16, marginTop: 8, alignItems: "center" }}>
                                        <span style={{ fontSize: 12, color: "#94A3B8" }}>
                                            {n.employeeId === "all" ? "📢 Broadcast" : `👤 ${n.employeeName}`}
                                        </span>
                                        <span style={{ fontSize: 12, color: "#94A3B8" }}>
                                            {new Date(n.createdAt).toLocaleDateString("fr-FR")}
                                        </span>
                                        <span className="badge" style={{ background: "#F1F5F9", color: "#64748B", fontSize: 11 }}>
                                            {n.category}
                                        </span>
                                        {!n.read && (
                                            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}
                                                onClick={() => markRead(n._id)}>Marquer lu</button>
                                        )}
                                        <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }}
                                            onClick={() => del(n._id)}>🗑️</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🔔 Nouvelle notification</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Titre *</label>
                                    <input className="input" value={form.title} onChange={e => f("title", e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Message *</label>
                                    <textarea className="input" rows={3} value={form.message}
                                        onChange={e => f("message", e.target.value)}
                                        style={{ resize: "vertical" }} />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                    {selectFields.map(([label, key, opts]) => (
                                        <div key={key}>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
                                                {label}
                                            </label>
                                            <select className="input" value={form[key] as string}
                                                onChange={e => f(key, e.target.value)}>
                                                {opts.map(o => <option key={o}>{o}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={save} disabled={saving}>
                                    {saving ? "⏳..." : "📤 Envoyer"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}