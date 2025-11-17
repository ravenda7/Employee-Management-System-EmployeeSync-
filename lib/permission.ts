// // lib/permission.ts
// import { Role } from '@/lib/generated/prisma';

// type Employee = { id: string; companyId: string; role: Role };
// type Payroll = { id: string; companyId: string; empId: string; isPaid: boolean };
// type Attendance = { id: string; companyId: string; empId: string; type: "CHECK_IN" | "CHECK_OUT" };
// type Leave = { id: string; companyId: string; empId: string; status: "PENDING" | "APPROVED" | "REJECTED" };
// type Company = { id: string };

// export type User = { id: string; companyId?: string | null; roles: Role[] };

// export type Permissions = {
//     employees: { dataType: Employee; action: "view" | "create" | "update" | "delete" };
//     payroll: { dataType: Payroll; action: "view" | "create" | "update" | "markPaid" };
//     attendance: { dataType: Attendance; action: "view" | "create" | "mark" };
//     leaves: { dataType: Leave; action: "view" | "create" | "approve" | "reject" };
//     companies: { dataType: Company; action: "view" | "create" | "delete" };
// };

// type PermissionCheck<Key extends keyof Permissions> =
//     | boolean
//     | ((user: User, data: Permissions[Key]["dataType"]) => boolean);

// type RolesWithPermissions = {
//     [R in Role]: Partial<{
//         [Key in keyof Permissions]: Partial<{
//             [Action in Permissions[Key]["action"]]: PermissionCheck<Key>
//         }>
//     }>
// };

// // --- Roles and Permissions Definition ---
// export const ROLES: RolesWithPermissions = {
//     SUPER_ADMIN: {
//         employees: { view: true, create: true, update: true, delete: true },
//         payroll: { view: true, create: true, update: true, markPaid: true },
//         attendance: { view: true, create: true, mark: true },
//         leaves: { view: true, create: true, approve: true, reject: true },
//         companies: { view: true, create: true, delete: true },
//     },
//     COMPANY_ADMIN: {
//         employees: {
//             view: (user, emp) => emp.companyId === user.companyId,
//             create: (user, emp) => emp.companyId === user.companyId,
//             update: (user, emp) => emp.companyId === user.companyId,
//             delete: (user, emp) => emp.companyId === user.companyId && emp.role !== "COMPANY_ADMIN",
//         },
//         payroll: {
//             view: (user, payroll) => payroll.companyId === user.companyId,
//             create: (user, payroll) => payroll.companyId === user.companyId,
//             update: (user, payroll) => payroll.companyId === user.companyId,
//             markPaid: (user, payroll) => payroll.companyId === user.companyId && !payroll.isPaid,
//         },
//         attendance: {
//             view: (user, att) => att.companyId === user.companyId,
//             create: (user, att) => att.companyId === user.companyId,
//             mark: (user, att) => att.companyId === user.companyId && att.empId === user.id,
//         },
//         leaves: {
//             view: (user, leave) => leave.companyId === user.companyId,
//             create: (user, leave) => leave.companyId === user.companyId && leave.empId === user.id,
//             approve: (user, leave) => leave.companyId === user.companyId && leave.status === "PENDING",
//             reject: (user, leave) => leave.companyId === user.companyId && leave.status === "PENDING",
//         },
//     },
//     COMPANY_HR: {
//         employees: {
//             view: (user, emp) => emp.companyId === user.companyId,
//             update: (user, emp) => emp.companyId === user.companyId,
//         },
//         payroll: {
//             view: (user, payroll) => payroll.companyId === user.companyId,
//             markPaid: (user, payroll) => payroll.companyId === user.companyId && !payroll.isPaid,
//         },
//         attendance: { view: (user, att) => att.companyId === user.companyId },
//         leaves: {
//             view: (user, leave) => leave.companyId === user.companyId,
//             approve: (user, leave) => leave.companyId === user.companyId && leave.status === "PENDING",
//             reject: (user, leave) => leave.companyId === user.companyId && leave.status === "PENDING",
//         },
//     },
//     EMPLOYEE: {
//         employees: {
//             view: (user, emp) => emp.id === user.id,
//             update: (user, emp) => emp.id === user.id,
//         },
//         payroll: { view: (user, payroll) => payroll.empId === user.id },
//         attendance: {
//             view: (user, att) => att.empId === user.id,
//             create: true,
//             mark: (user, att) => att.empId === user.id,
//         },
//         leaves: {
//             view: (user, leave) => leave.empId === user.id,
//             create: true,
//         },
//     },
// } as const;


// // --- Has Permission Function (Used by Middleware) ---
// export function hasPermission<Resource extends keyof Permissions>(
//     user: User,
//     resource: Resource,
//     action: Permissions[Resource]["action"] | string, 
//     data?: Permissions[Resource]["dataType"]
// ): boolean {
//     const validAction = action as Permissions[Resource]["action"];

//     return user.roles.some(role => {
//         const permission = ROLES[role][resource]?.[validAction];
//         if (permission == null) return false;
//         if (typeof permission === "boolean") return permission;
        
//         return data != null && permission(user, data); 
//     });
// }









// TODO: Check this new permission then remove above code
import { Role } from '@/lib/generated/prisma';

// High-level permission keys, used for UI + Employee.permissions
export const PERMISSION_KEYS = {
  EMPLOYEES_VIEW: 'employees:view',
  EMPLOYEES_MANAGE: 'employees:manage',
  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_MANAGE: 'payroll:manage',
  ATTENDANCE_VIEW: 'attendance:view',
  LEAVES_VIEW: 'leaves:view',
  LEAVES_MANAGE: 'leaves:manage',
  COMPANY_SETTINGS: 'company:settings',
} as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];


type Employee = { id: string; companyId: string; role: Role };
type Payroll = { id: string; companyId: string; empId: string; isPaid: boolean };
type Attendance = { id: string; companyId: string; empId: string; type: "CHECK_IN" | "CHECK_OUT" };
type Leave = { id: string; companyId: string; empId: string; status: "PENDING" | "APPROVED" | "REJECTED" };
type Company = { id: string };

export type User = { id: string; companyId?: string | null; roles: Role[] };

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
    action: Permissions[Resource]["action"] | string, 
    data?: Permissions[Resource]["dataType"]
): boolean {
    const validAction = action as Permissions[Resource]["action"];

    return user.roles.some(role => {
        const permission = ROLES[role][resource]?.[validAction];
        if (permission == null) return false;
        if (typeof permission === "boolean") return permission;
        
        return data != null && permission(user, data); 
    });
}



// Default permission sets per role – used when creating Employees
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<Role, PermissionKey[]> = {
  SUPER_ADMIN: [
    // Full system access
    PERMISSION_KEYS.EMPLOYEES_VIEW,
    PERMISSION_KEYS.EMPLOYEES_MANAGE,
    PERMISSION_KEYS.PAYROLL_VIEW,
    PERMISSION_KEYS.PAYROLL_MANAGE,
    PERMISSION_KEYS.ATTENDANCE_VIEW,
    PERMISSION_KEYS.LEAVES_VIEW,
    PERMISSION_KEYS.LEAVES_MANAGE,
    PERMISSION_KEYS.COMPANY_SETTINGS,
  ],

  COMPANY_ADMIN: [
    PERMISSION_KEYS.EMPLOYEES_VIEW,
    PERMISSION_KEYS.EMPLOYEES_MANAGE,
    PERMISSION_KEYS.PAYROLL_VIEW,
    PERMISSION_KEYS.PAYROLL_MANAGE,
    PERMISSION_KEYS.ATTENDANCE_VIEW,
    PERMISSION_KEYS.LEAVES_VIEW,
    PERMISSION_KEYS.LEAVES_MANAGE,
    PERMISSION_KEYS.COMPANY_SETTINGS,
  ],

  COMPANY_HR: [
    // 💡 HR defaults
    PERMISSION_KEYS.EMPLOYEES_VIEW,
    PERMISSION_KEYS.EMPLOYEES_MANAGE,
    PERMISSION_KEYS.ATTENDANCE_VIEW,
    PERMISSION_KEYS.LEAVES_VIEW,
    PERMISSION_KEYS.LEAVES_MANAGE,
    PERMISSION_KEYS.PAYROLL_VIEW,
    // Usually HR shouldn’t change global company settings:
    // no COMPANY_SETTINGS, no PAYROLL_MANAGE (they just mark paid or view)
  ],

  EMPLOYEE: [
    // 💡 Normal employee defaults (self-scoped on backend)
    PERMISSION_KEYS.ATTENDANCE_VIEW,
    PERMISSION_KEYS.LEAVES_VIEW,
    PERMISSION_KEYS.PAYROLL_VIEW,
    // They don’t manage other employees or settings
  ],
};
