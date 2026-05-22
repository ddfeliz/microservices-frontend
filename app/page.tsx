"use client";
import { useEffect, useState } from "react";
import Shell from "./components/Shell";
import PageHeader from "./components/PageHeader";
import { api } from "../lib/api";
import type {
  EmployeeStats, LeaveStats, NotifStats,
  Leave, PaginatedResponse
} from "../types";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Users, CalendarOff, Bell, TrendingUp,
  UserCheck, UserX, Clock, Building2, Briefcase,
  Heart, Stethoscope, Activity, Syringe, Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";

const LEAVE_STATUS_LABEL: Record<string, string> = {
  pending: "En attente", approved: "Confirmé",
  rejected: "Annulé", cancelled: "Reporté",
};
const LEAVE_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline", approved: "default",
  rejected: "destructive", cancelled: "secondary",
};

// Couleurs médicales pour les graphiques
const CHART_COLORS = ["#059669", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"];

export default function Dashboard() {
  const [empStats, setEmpStats] = useState<EmployeeStats | null>(null);
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);
  const [notifStats, setNotifStats] = useState<NotifStats | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [e, l, n, lv] = await Promise.all([
          api.employees.stats() as Promise<EmployeeStats>,
          api.leaves.stats() as Promise<LeaveStats>,
          api.notify.stats() as Promise<NotifStats>,
          api.leaves.list("?limit=6&status=pending") as Promise<PaginatedResponse<Leave>>,
        ]);
        setEmpStats(e);
        setLeaveStats(l);
        setNotifStats(n);
        setRecentLeaves(lv.data ?? []);
      } finally { setLoading(false); }
    };
    void fetch();
  }, []);

  const seedAll = async () => {
    setSeeding(true);
    try {
      await Promise.all([
        api.employees.seed(),
        api.leaves.seed(),
        api.notify.seed(),
      ]);
      window.location.reload();
    } finally { setSeeding(false); }
  };

  const kpis = [
    {
      label: "Patients totaux",
      value: empStats?.total ?? 0,
      sub: `Coût moyen : ${(empStats?.avgSalary ?? 0).toLocaleString("fr")} €/an`,
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "En traitement",
      value: empStats?.byStatus?.find(s => s._id === "active")?.count ?? 0,
      sub: "Patients actifs",
      icon: Heart,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Consultations en attente",
      value: leaveStats?.pending ?? 0,
      sub: "Rendez-vous à confirmer",
      icon: CalendarOff,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      label: "Alertes non consultées",
      value: notifStats?.unread ?? 0,
      sub: `Sur ${notifStats?.total ?? 0} au total`,
      icon: Bell,
      gradient: "from-slate-500 to-slate-600",
    },
  ];

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground text-sm">Chargement des données médicales...</p>
          </div>
        </div>
      </Shell>
    );
  }

  const deptData = (empStats?.byDepartment ?? []).map(d => ({
    name: d._id, effectif: d.count,
    salaire: Math.round(d.avgSalary / 1000),
  }));

  const contractData = (empStats?.byContract ?? []).map(c => ({
    name: c._id === "Hospitalisation" ? "Hospital." :
          c._id === "Consultation externe" ? "Consult. ext." :
          c._id === "Urgence" ? "Urgences" : "Soins suite",
    value: c.count,
  }));

  return (
    <Shell>
      <PageHeader
        title="Tableau de bord médical"
        subtitle="Vue d'ensemble stratégique des soins et consultations"
        action={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={seedAll} 
            disabled={seeding}
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {seeding ? "Chargement..." : "Initialiser les données"}
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map(({ label, value, sub, icon: Icon, gradient }) => (
          <Card key={label} className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-start justify-between p-5">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Patients par service */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 size={16} className="text-emerald-500" />
              Patients par service
            </CardTitle>
            <CardDescription className="text-xs">
              Nombre de patients et coût moyen (k€)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12, border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))", color: "hsl(var(--foreground))",
                    borderRadius: 8,
                  }}
                  cursor={{ fill: "rgba(5, 150, 105, 0.05)" }}
                />
                <Bar 
                  dataKey="effectif" 
                  fill="#059669" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={40}
                  label={{ position: 'top', fontSize: 11, fill: '#666' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Types de séjour */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase size={16} className="text-emerald-500" />
              Types de séjour
            </CardTitle>
            <CardDescription className="text-xs">Répartition par type de prise en charge</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={contractData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                >
                  {contractData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12, border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))", color: "hsl(var(--foreground))",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Consultations en attente */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarOff size={16} className="text-amber-500" />
              Consultations en attente
            </CardTitle>
            <CardDescription className="text-xs">Rendez-vous à confirmer</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {recentLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarOff size={40} className="text-slate-300 mb-3" />
                <p className="text-sm text-muted-foreground">Aucune consultation en attente</p>
                <p className="text-xs text-muted-foreground mt-1">Tous les rendez-vous sont programmés</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900">
                    <TableHead className="text-xs font-semibold">Patient</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Durée</TableHead>
                    <TableHead className="text-xs font-semibold">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeaves.map(l => (
                    <TableRow key={l._id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                      <TableCell className="text-sm font-medium">{l.employeeName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.type}</TableCell>
                      <TableCell className="text-xs font-semibold">{l.days}h</TableCell>
                      <TableCell>
                        <Badge variant={LEAVE_STATUS_VARIANT[l.status] ?? "outline"} className="text-xs">
                          {LEAVE_STATUS_LABEL[l.status] ?? l.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Statuts des patients */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity size={16} className="text-emerald-500" />
              Statuts des patients
            </CardTitle>
            <CardDescription className="text-xs">Répartition par statut médical</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {(empStats?.byStatus ?? []).map(s => {
              const total = empStats?.total || 1;
              const pct = Math.round((s.count / total) * 100);
              const icons: Record<string, any> = {
                active: Heart, inactive: UserX, onLeave: Clock
              };
              const labels: Record<string, string> = {
                active: "En traitement", inactive: "Sorti", onLeave: "En convalescence"
              };
              const colors: Record<string, string> = {
                active: "bg-emerald-500", inactive: "bg-slate-400", onLeave: "bg-amber-500"
              };
              const Icon = icons[s._id] ?? Users;
              return (
                <div key={s._id} className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${s._id === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : s._id === 'inactive' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold">{labels[s._id] ?? s._id}</span>
                      <span className="text-muted-foreground">{s.count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[s._id]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Statistiques consultations par type */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp size={12} />
                Consultations effectuées (confirmées)
              </p>
              <div className="space-y-2.5">
                {(leaveStats?.byType ?? []).slice(0, 4).map(t => (
                  <div key={t._id} className="flex justify-between text-xs items-center">
                    <span className="text-muted-foreground">
                      {t._id === "Consultation générale" ? "Consult. générale" :
                       t._id === "Consultation spécialiste" ? "Consult. spécialiste" :
                       t._id === "Téléconsultation" ? "Téléconsultation" :
                       t._id === "Urgence" ? "Urgences" : t._id}
                    </span>
                    <div className="flex gap-4">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t.totalDays}h</span>
                      <span className="text-muted-foreground">{t.count} consultations</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé alertes médicales */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell size={16} className="text-emerald-500" />
            Alertes par catégorie
          </CardTitle>
          <CardDescription className="text-xs">
            <span className="font-semibold text-emerald-600">{notifStats?.unread ?? 0}</span> non consultées sur{" "}
            <span className="font-semibold">{notifStats?.total ?? 0}</span> au total
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(notifStats?.byCategory ?? []).map(c => {
              const categoryLabels: Record<string, string> = {
                consultation: "Consultations",
                resultat: "Résultats",
                urgence: "Urgences",
                rappel: "Rappels",
                ordonnance: "Ordonnances",
                hospitalisation: "Hospitalisations"
              };
              const categoryColors: Record<string, string> = {
                consultation: "from-emerald-500 to-teal-600",
                resultat: "from-blue-500 to-blue-600",
                urgence: "from-red-500 to-red-600",
                rappel: "from-amber-500 to-amber-600",
                ordonnance: "from-purple-500 to-purple-600",
                hospitalisation: "from-indigo-500 to-indigo-600",
              };
              const gradient = categoryColors[c._id] || "from-emerald-500 to-emerald-600";
              const label = categoryLabels[c._id] || c._id;
              return (
                <div 
                  key={c._id} 
                  className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    {c._id === "consultation" && <Stethoscope size={14} className="text-white" />}
                    {c._id === "resultat" && <Activity size={14} className="text-white" />}
                    {c._id === "urgence" && <Bell size={14} className="text-white" />}
                    {c._id === "rappel" && <Clock size={14} className="text-white" />}
                    {c._id === "ordonnance" && <Syringe size={14} className="text-white" />}
                    {c._id === "hospitalisation" && <Heart size={14} className="text-white" />}
                    {!["consultation", "resultat", "urgence", "rappel", "ordonnance", "hospitalisation"].includes(c._id) && <Bell size={14} className="text-white" />}
                  </div>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{c.count}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">{label}</p>
                  {c.unread > 0 && (
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 bg-emerald-50 dark:bg-emerald-950/30 inline-block px-2 py-0.5 rounded-full">
                      {c.unread} non consultées
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}