// lib/permission.ts
import { Role } from '@/lib/generated/prisma';

// --- Data Types for Permission Checks ---
type Employee = { id: string; companyId: string; role: Role };
type Payroll = { id: string; companyId: string; empId: string; isPaid: boolean };
type Attendance = { id: string; companyId: string; empId: string; type: "CHECK_IN" | "CHECK_OUT" };
type Leave = { id: string; companyId: string; empId: string; status: "PENDING" | "APPROVED" | "REJECTED" };
type Company = { id: string };

// --- User Type for Authorization ---
export type User = { id: string; companyId?: string | null; roles: Role[] };

// --- Permission Structure Types ---
export type Permissions = {
    employees: { dataType: Employee; action: "view" | "create" | "update" | "delete" };
    payroll: { dataType: Payroll; action: "view" | "create" | "update" | "markPaid" };
    attendance: { dataType: Attendance; action: "view" | "create" | "mark" };
    leaves: { dataType: Leave; action: "view" | "create" | "approve" | "reject" };
    companies: { dataType: Company; action: "view" | "create" | "delete" };
};

type PermissionCheck<Key extends keyof Permissions> =
    | boolean
    | ((user: User, data: Permissions[Key]["dataType"]) => boolean);

type RolesWithPermissions = {
    [R in Role]: Partial<{
        [Key in keyof Permissions]: Partial<{
            [Action in Permissions[Key]["action"]]: PermissionCheck<Key>
        }>
    }>
};

// --- Roles and Permissions Definition ---
export const ROLES: RolesWithPermissions = {
    SUPER_ADMIN: {
        employees: { view: true, create: true, update: true, delete: true },
        payroll: { view: true, create: true, update: true, markPaid: true },
        attendance: { view: true, create: true, mark: true },
        leaves: { view: true, create: true, approve: true, reject: true },
        companies: { view: true, create: true, delete: true },
    },
    COMPANY_ADMIN: {
        employees: {
            view: (user, emp) => emp.companyId === user.companyId,
            create: (user, emp) => emp.companyId === user.companyId,
            update: (user, emp) => emp.companyId === user.companyId,
            delete: (user, emp) => emp.companyId === user.companyId && emp.role !== "COMPANY_ADMIN",
        },
        payroll: {
            view: (user, payroll) => payroll.companyId === user.companyId,
            create: (user, payroll) => payroll.companyId === user.companyId,
            update: (user, payroll) => payroll.companyId === user.companyId,
            markPaid: (user, payroll) => payroll.companyId === user.companyId && !payroll.isPaid,
        },
        attendance: {
            view: (user, att) => att.companyId === user.companyId,
            create: (user, att) => att.companyId === user.companyId,
            mark: (user, att) => att.companyId === user.companyId && att.empId === user.id,
        },
        leaves: {
            view: (user, leave) => leave.companyId === user.companyId,
            create: (user, leave) => leave.companyId === user.companyId && leave.empId === user.id,
            approve: (user, leave) => leave.companyId === user.companyId && leave.status === "PENDING",
            reject: (user, leave) => leave.companyId === user.companyId && leave.status === "PENDING",
        },
    },
    COMPANY_HR: {
        employees: {
            view: (user, emp) => emp.companyId === user.companyId,
            update: (user, emp) => emp.companyId === user.companyId,
        },
        payroll: {
            view: (user, payroll) => payroll.companyId === user.companyId,
            markPaid: (user, payroll) => payroll.companyId === user.companyId && !payroll.isPaid,
        },
        attendance: { view: (user, att) => att.companyId === user.companyId },
        leaves: {
            view: (user, leave) => leave.companyId === user.companyId,
            approve: (user, leave) => leave.companyId === user.companyId && leave.status === "PENDING",
            reject: (user, leave) => leave.companyId === user.companyId && leave.status === "PENDING",
        },
    },
    EMPLOYEE: {
        employees: {
            view: (user, emp) => emp.id === user.id,
            update: (user, emp) => emp.id === user.id,
        },
        payroll: { view: (user, payroll) => payroll.empId === user.id },
        attendance: {
            view: (user, att) => att.empId === user.id,
            create: true,
            mark: (user, att) => att.empId === user.id,
        },
        leaves: {
            view: (user, leave) => leave.empId === user.id,
            create: true,
        },
    },
} as const;


// --- Has Permission Function (Used by Middleware) ---
export function hasPermission<Resource extends keyof Permissions>(
    user: User,
    resource: Resource,
    // Add cast to ensure type safety when 'data' is omitted (like in middleware)
    action: Permissions[Resource]["action"] | string, 
    data?: Permissions[Resource]["dataType"]
): boolean {
    const validAction = action as Permissions[Resource]["action"];

    return user.roles.some(role => {
        const permission = ROLES[role][resource]?.[validAction];
        if (permission == null) return false;
        if (typeof permission === "boolean") return permission;
        
        // Conditional logic: If data is required by the function but not provided, deny access.
        return data != null && permission(user, data); 
    });
}