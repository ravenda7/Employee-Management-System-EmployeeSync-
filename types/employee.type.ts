export type EmployeeAllowances = {
    // Allows any string key (e.g., "medical", "travel")
    [key: string]: number; 
} | null;

export interface Department {
  id: string;
  name: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetEmployees {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  allowences?: EmployeeAllowances;
  isActive: boolean;
  departmentId: string;
  joinDate: string;
  baseSalary: number;
  role: string;
  department: Department;
}

export interface GetEmployeeAPIResponse {
  data: {
    employees: GetEmployees[];
    total: number;
    page: number;
    limit: number;
  }
}

export type EmployeeFilter = {
    searchTerm?: string | '';
    department?: string;
    requestedRole?: string;
    page?: number | 1;
    limit?: number | 10;
}