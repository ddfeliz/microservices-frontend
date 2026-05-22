export type Department =
  | "Cardiologie"
  | "Pédiatrie"
  | "Neurologie"
  | "Dermatologie"
  | "Urgences"
  | "Chirurgie"
  | "Radiologie";
export type ContractType =
  | "Hospitalisation"
  | "Consultation externe"
  | "Urgence"
  | "Soins de suite";
export type EmpStatus = "active" | "inactive" | "onLeave";

export interface IAddress {
  street?: string;
  city: string;
  country: string;
}

export interface IMedicalHistory {
  antecedents: string[];
  allergies: string[];
  traitements: string[];
  groupeSanguin?: string;
}

export interface IPatientBalance {
  consultations: number;
  examens: number;
  hospitalisations: number;
}

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  position: string; // Médecin traitant / Spécialiste
  department: Department;
  employeeId: string;
  managerId: Employee | null;
  hireDate: string; // Date d'admission
  contractType: ContractType;
  salary: number; // Coût estimé des soins
  status: EmpStatus;
  address: IAddress;
  skills: string[]; // Antécédents médicaux
  leaveBalance: IPatientBalance;
  medicalHistory?: IMedicalHistory;
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
  | "Consultation générale"
  | "Consultation spécialiste"
  | "Urgence"
  | "Téléconsultation"
  | "Chirurgie programmée"
  | "Examen radiologique"
  | "IRM / Scanner"
  | "Analyse biologique";

export interface Leave {
  _id: string;
  employeeId: string; // Patient ID
  employeeName: string; // Patient name
  department: string;
  type: LeaveType;
  startDate: string; // Date du rendez-vous
  endDate: string; // Heure du rendez-vous
  days: number; // Durée en heures
  status: LeaveStatus;
  reason: string; // Motif / Symptômes
  comment: string;
  approvedBy: string | null; // Médecin traitant
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
  totalDays: number; // Total heures
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
  | "consultation"
  | "resultat"
  | "urgence"
  | "rappel"
  | "ordonnance"
  | "hospitalisation";
export type NotifPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  _id: string;
  employeeId: string; // Patient ID
  employeeName: string; // Patient name
  title: string;
  message: string;
  type: NotifType;
  category: NotifCategory;
  priority: NotifPriority;
  read: boolean;
  readAt: string | null;
  actionUrl: string;
  actionLabel: string;
  sentBy: string; // Médecin / Service
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
  gross: number; // Coût total des soins
  employeeContributions: number; // Part patient
  employerContributions: number; // Part sécurité sociale
  netBeforeTax: number;
  seniorityBonus: number; // Ancienneté patient
  perfBonus: number; // Adhésion programme santé
  mealVouchers: number; // Forfaits repas hospitaliers
  netTotal: number;
  fibonacciCheck: number;
  durationMs: number;
  pod: string;
}

export interface BatchPayrollResult {
  count: number;
  payslips: PayslipResult[];
  totalPayroll: number; // Coût total des soins
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
