import type {
  Employee,
  EmployeeStats,
  PaginatedResponse,
  Leave,
  LeaveStats,
  LeaveFormData,
  Notification,
  NotifFormData,
  NotifStats,
  NotifResponse,
  PayslipResult,
  BatchPayrollResult,
  BenchmarkResult,
} from "../types";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${GATEWAY}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

type StatusInput = { status: string; comment?: string; approvedBy?: string };
type PayrollInput = {
  name: string;
  salary: number;
  department: string;
  contractType: string;
  seniority?: number;
};
type BatchInput = { employees: Omit<PayrollInput, "seniority">[] };
type SeedResult = { message: string; count: number };
type DeleteResult = { message: string; id?: string };

export const api = {
  employees: {
    list: (params = "") =>
      request<PaginatedResponse<Employee>>(`/api/employees${params}`),
    stats: () => request<EmployeeStats>("/api/employees/stats"),
    get: (id: string) => request<Employee>(`/api/employees/${id}`),
    create: (data: Partial<Employee>) =>
      request<Employee>("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Employee>) =>
      request<Employee>(`/api/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<DeleteResult>(`/api/employees/${id}`, { method: "DELETE" }),
    seed: () => request<SeedResult>("/api/employees/seed", { method: "POST" }),
  },
  leaves: {
    list: (params = "") =>
      request<PaginatedResponse<Leave>>(`/api/leaves${params}`),
    stats: () => request<LeaveStats>("/api/leaves/stats"),
    create: (data: Partial<Leave>) =>
      request<Leave>("/api/leaves", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, data: StatusInput) =>
      request<Leave>(`/api/leaves/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<DeleteResult>(`/api/leaves/${id}`, { method: "DELETE" }),
    seed: () => request<SeedResult>("/api/leaves/seed", { method: "POST" }),
  },
  notify: {
    list: (params = "") => request<NotifResponse>(`/api/notify${params}`),
    stats: () => request<NotifStats>("/api/notify/stats"),
    create: (data: NotifFormData) =>
      request<Notification>("/api/notify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    markRead: (id: string) =>
      request<Notification>(`/api/notify/${id}/read`, { method: "PATCH" }),
    markAllRead: () =>
      request<{ updated: number }>("/api/notify/read-all", {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
    delete: (id: string) =>
      request<DeleteResult>(`/api/notify/${id}`, { method: "DELETE" }),
    seed: () => request<SeedResult>("/api/notify/seed", { method: "POST" }),
  },
  payroll: {
    calculate: (data: PayrollInput) =>
      request<PayslipResult>("/api/payroll/calculate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    batch: (data: BatchInput) =>
      request<BatchPayrollResult>("/api/payroll/batch", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    stats: (data: BatchInput) =>
      request<Record<string, unknown>>("/api/payroll/stats", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    benchmark: (n = 38) => request<BenchmarkResult>(`/api/compute?n=${n}`),
  },
};
