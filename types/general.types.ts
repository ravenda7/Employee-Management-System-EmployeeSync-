type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string | null;
};

type Company = {
  id: string;
  name: string;
};

type EmployeesData = {
  employees: { id: string; name: string; email: string; role: string }[];
  count: number;
};