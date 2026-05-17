"use client";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import PageHeader from "./components/PageHeader";
import { api } from "../lib/api";
import type {
  EmployeeStats, LeaveStats, NotifStats,
  Leave, DeptStat, StatusStat, ContractStat, PaginatedResponse
} from "../types";

const STATUS_COLOR: Record<string, string> = {
  active: "#10B981", inactive: "#6B7280", onLeave: "#F59E0B",
  pending: "#F59E0B", approved: "#10B981", rejected: "#EF4444",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Actif", inactive: "Inactif", onLeave: "En congé",
  pending: "En attente", approved: "Approuvé", rejected: "Refusé",
};

export default function Dashboard() {
  const [empStats, setEmpStats] = useState<EmployeeStats | null>(null);
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);
  const [notifStats, setNotifStats] = useState<NotifStats | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    try {
      const [e, l, n, lv] = await Promise.all([
        api.employees.stats(),
        api.leaves.stats(),
        api.notify.stats(),
        api.leaves.list("?limit=5&status=pending"),
      ]);
      setEmpStats(e);
      setLeaveStats(l);
      setNotifStats(n);
      setRecentLeaves(lv.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const seedAll = async () => {
    setSeeding(true);
    try {
      await Promise.all([
        api.employees.seed(),
        api.leaves.seed(),
        api.notify.seed(),
      ]);
      await load();
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [e, l, n, lv] = await Promise.all([
          api.employees.stats(),
          api.leaves.stats(),
          api.notify.stats(),
          api.leaves.list("?limit=5&status=pending"),
        ]);
        setEmpStats(e as EmployeeStats);
        setLeaveStats(l as LeaveStats);
        setNotifStats(n as NotifStats);
        setRecentLeaves((lv as PaginatedResponse<Leave>).data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);


  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main className="main-content">
        <PageHeader
          title="🏠 Dashboard RH"
          subtitle="Vue d'ensemble de votre organisation"
          action={
            <button className="btn btn-ghost" onClick={seedAll} disabled={seeding}>
              {seeding ? "⏳ Chargement..." : "🌱 Seed données démo"}
            </button>
          }
        />

        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#94A3B8" }}>Chargement...</div>
        ) : (
          <>
            {/* Stats cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
              <StatCard label="Employés actifs" value={empStats?.total || 0}
                sub={`Salaire moyen : ${(empStats?.avgSalary || 0).toLocaleString("fr")} €`}
                icon="👥" color="#3B82F6" />
              <StatCard label="Congés en attente" value={leaveStats?.pending || 0}
                sub="Demandes à traiter" icon="🏖️" color="#F59E0B" />
              <StatCard label="Notifications" value={notifStats?.unread || 0}
                sub="Non lues" icon="🔔" color="#8B5CF6" />
              <StatCard label="Départements"
                value={empStats?.byDepartment?.length || 0}
                sub="Équipes actives" icon="🏢" color="#10B981" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Répartition par département */}
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#0F172A" }}>
                  👥 Effectifs par département
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(empStats?.byDepartment || []).map((d: DeptStat) => {
                    const pct = Math.round((d.count / (empStats?.total || 1)) * 100);
                    return (
                      <div key={d._id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{d._id}</span>
                          <span style={{ fontSize: 13, color: "#6B7280" }}>
                            {d.count} · {(d.avgSalary || 0).toLocaleString("fr")} € moy.
                          </span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 99 }}>
                          <div style={{
                            height: "100%", width: `${pct}%`,
                            background: "linear-gradient(90deg,#3B82F6,#8B5CF6)",
                            borderRadius: 99, transition: "width 0.6s"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Congés en attente */}
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#0F172A" }}>
                  ⏳ Congés en attente de validation
                </h2>
                {recentLeaves.length === 0 ? (
                  <p style={{ color: "#94A3B8", fontSize: 14 }}>Aucune demande en attente</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {recentLeaves.map((l: Leave) => (
                      <div key={l._id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 14px", background: "#F8FAFC", borderRadius: 10
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{l.employeeName}</div>
                          <div style={{ fontSize: 12, color: "#94A3B8" }}>{l.type} · {l.days}j</div>
                        </div>
                        <span className="badge" style={{ background: "#FEF3C7", color: "#92400E" }}>
                          En attente
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Types de contrats */}
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#0F172A" }}>
                  📋 Types de contrats
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {(empStats?.byContract || []).map((c: ContractStat) => (
                    <div key={c._id} style={{
                      padding: "16px", background: "#F8FAFC", borderRadius: 12, textAlign: "center"
                    }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A" }}>{c.count}</div>
                      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginTop: 4 }}>{c._id}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statuts employés */}
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#0F172A" }}>
                  🟢 Statuts des employés
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(empStats?.byStatus || []).map((s: StatusStat) => (
                    <div key={s._id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 16px", borderRadius: 10,
                      background: `${STATUS_COLOR[s._id] || "#6B7280"}10`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: STATUS_COLOR[s._id] || "#6B7280"
                        }} />
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                          {STATUS_LABEL[s._id] || s._id}
                        </span>
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: STATUS_COLOR[s._id] || "#6B7280" }}>
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}