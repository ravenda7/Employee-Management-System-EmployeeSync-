

interface Department {
  id: number;
  name: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

interface GetEmployees {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  isActive: boolean;
  departmentId: string;
  joinDate: string;
  baseSalary: number;
  role: string;
  department: Department;
}

export interface GetEmployeeAPIResponse {
    data: GetEmployees[];
    total: number;
    page: number;
    limit: number;
}

export type EmployeeFilter = {
    searchTerm?: string | '';
    department?: string;
    requestedRole?: string;
    page?: number | 1;
    limit?: number | 10;
}