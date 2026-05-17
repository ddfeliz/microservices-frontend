export type Department =
  | "Engineering"
  | "HR"
  | "Finance"
  | "Marketing"
  | "Operations"
  | "Legal"
  | "Sales";
export type ContractType = "CDI" | "CDD" | "Stage" | "Alternance";
export type EmpStatus = "active" | "inactive" | "onLeave";

export interface IAddress {
  street: string;
  city: string;
  country: string;
}

export interface ILeaveBalance {
  paid: number;
  rtt: number;
  sick: number;
}

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  position: string;
  department: Department;
  employeeId: string;
  managerId: Employee | null;
  hireDate: string;
  contractType: ContractType;
  salary: number;
  status: EmpStatus;
  address: IAddress;
  skills: string[];
  leaveBalance: ILeaveBalance;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: Department;
  contractType: ContractType;
  salary: string;
  city: string;
  skills: string;
  status: EmpStatus;
}

export interface DeptStat {
  _id: Department;
  count: number;
  avgSalary: number;
}
export interface StatusStat {
  _id: EmpStatus;
  count: number;
}
export interface ContractStat {
  _id: ContractType;
  count: number;
}

export interface EmployeeStats {
  total: number;
  avgSalary: number;
  byDepartment: DeptStat[];
  byStatus: StatusStat[];
  byContract: ContractStat[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType =
  | "Congé Payé"
  | "RTT"
  | "Maladie"
  | "Maternité"
  | "Paternité"
  | "Sans Solde"
  | "Exceptionnel";

export interface Leave {
  _id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string;
  comment: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface LeaveFormData {
  employeeId: string;
  employeeName: string;
  department: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: string;
  reason: string;
}

export interface LeaveStatusStat {
  _id: LeaveStatus;
  count: number;
  totalDays: number;
}
export interface LeaveTypeStat {
  _id: LeaveType;
  count: number;
  totalDays: number;
}
export interface LeaveDeptStat {
  _id: string;
  totalDays: number;
}

export interface LeaveStats {
  byStatus: LeaveStatusStat[];
  byType: LeaveTypeStat[];
  byDepartment: LeaveDeptStat[];
  pending: number;
}

export type NotifType = "info" | "success" | "warning" | "error";
export type NotifCategory =
  | "conge"
  | "paie"
  | "rh"
  | "systeme"
  | "anniversaire"
  | "contrat";
export type NotifPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  _id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  message: string;
  type: NotifType;
  category: NotifCategory;
  priority: NotifPriority;
  read: boolean;
  readAt: string | null;
  actionUrl: string;
  actionLabel: string;
  sentBy: string;
  createdAt: string;
}

export interface NotifFormData {
  title: string;
  message: string;
  type: NotifType;
  category: NotifCategory;
  priority: NotifPriority;
  employeeId: string;
  employeeName: string;
}

export interface NotifCategoryStat {
  _id: NotifCategory;
  count: number;
  unread: number;
}
export interface NotifPriorityStat {
  _id: NotifPriority;
  count: number;
}

export interface NotifStats {
  byCategory: NotifCategoryStat[];
  byPriority: NotifPriorityStat[];
  total: number;
  unread: number;
}

export interface NotifResponse extends PaginatedResponse<Notification> {
  unread: number;
}

export interface PayslipResult {
  employee: string;
  department: string;
  contractType: string;
  gross: number;
  employeeContributions: number;
  employerContributions: number;
  netBeforeTax: number;
  seniorityBonus: number;
  perfBonus: number;
  mealVouchers: number;
  netTotal: number;
  fibonacciCheck: number;
  durationMs: number;
  pod: string;
}

export interface BatchPayrollResult {
  count: number;
  payslips: PayslipResult[];
  totalPayroll: number;
  durationMs: number;
  pod: string;
}

export interface BenchmarkResult {
  input: number;
  fibonacci: number;
  sortedElements: number;
  durationMs: number;
  pod: string;
}
