// import { NextResponse, NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt'; 
// import { Role } from '@/lib/generated/prisma';
// import { hasPermission, User, Permissions } from './lib/permission'; 
// import type { JWT } from 'next-auth/jwt'; 

// // NOTE: You must set NEXTAUTH_SECRET in your .env file
// const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET; 

// export async function middleware(req: NextRequest) {
//     const token = await getToken({ 
//         req, 
//         secret: NEXTAUTH_SECRET 
//     }) as JWT | null; 

//     const { pathname } = req.nextUrl;
    
//     // isAuthenticated now checks for the required custom fields from the token
//     const isAuthenticated = token && token.role && token.sub; 
    
//     const userToken = token as JWT; 

//     // 2. Redirect logged-in users away from /login
//     if (isAuthenticated && (pathname === '/login' || pathname === '/')) {   

//         const companyId = userToken.companyId;

//         if (userToken.role === 'SUPER_ADMIN') {
//             return NextResponse.redirect(new URL('/super-admin/dashboard', req.url));
//         } 
//         else if (companyId) { 
//             if (userToken.role === 'COMPANY_ADMIN') {
//                 return NextResponse.redirect(new URL(`/company/${companyId}/dashboard`, req.url));
//             } else if (userToken.role === 'COMPANY_HR') {
//                 return NextResponse.redirect(new URL(`/company/${companyId}/hr/dashboard`, req.url));
//             } else if (userToken.role === 'EMPLOYEE') {
//                 return NextResponse.redirect(new URL(`/employee/${companyId}/profile`, req.url)); 
//             }
//         }
//         return NextResponse.redirect(new URL('/', req.url)); // Fallback
//     }

//     // 3. Redirect unauthenticated users to /login
//     if (!isAuthenticated && pathname !== '/login' && pathname !== '/register-company' && !pathname.startsWith('/api/')) {
//         return NextResponse.redirect(new URL('/login', req.url));
//     }

//     // 4. RBAC and Tenancy Checks
//     if (isAuthenticated) {
//         const user: User = {
//             id: userToken.sub!,
//             companyId: userToken.companyId,
//             roles: [userToken.role as Role],
//         };

//         const routePermissions: { [key: string]: { resource: keyof Permissions; action: Permissions[keyof Permissions]['action'] } } = {
//             '/super-admin': { resource: 'companies', action: 'view' },
//             '/company/[companyId]/dashboard': { resource: 'employees', action: 'view' },
//             '/company/[companyId]/hr': { resource: 'employees', action: 'view' },
//             '/employee/[companyId]/profile': { resource: 'employees', action: 'view' },
//         };

//         const matchingKey = Object.keys(routePermissions).find(key => {
//             const pattern = key.replace(/\[companyId\]/g, '([^/]+)'); 
//             return new RegExp(`^${pattern}(/|$)`).test(pathname); 
//         });

//         if (matchingKey) {
//             const { resource, action } = routePermissions[matchingKey];
//             if (!hasPermission(user, resource, action)) {
//                 return NextResponse.redirect(new URL('/unauthorized', req.url));
//             }
//         }

//         // 5. Tenant Scoping
//         if (user.roles[0] !== 'SUPER_ADMIN' && user.companyId && pathname.includes('/company/')) {
//             const pathSegments = pathname.split('/');
//             const pathCompanyId = pathSegments[2];

//             if (pathCompanyId && pathCompanyId !== user.companyId) {
//                 return NextResponse.redirect(new URL(`/company/${user.companyId}/dashboard`, req.url));
//             }
//         }
//     }

//     return NextResponse.next();
// }

// export const config = {
//     matcher: [
//         '/',
//         '/login',
//         '/register-company',
//         '/super-admin/:path*',
//         '/company/:path*',
//         '/employee/:path*',
//         '/unauthorized',
//     ],
// };











// import { NextResponse, NextRequest } from "next/server";
// import { getToken } from "next-auth/jwt";

// export async function middleware(req: NextRequest) {
//   const token = await getToken({
//     req,
//     secret: process.env.NEXTAUTH_SECRET,
//   });

//   const { pathname } = req.nextUrl;

//   // 🔒 If not logged in and trying to access protected routes (except /login, /register-company)
//   if (
//     !token &&
//     pathname !== "/login" &&
//     pathname !== "/register-company" &&
//     !pathname.startsWith("/api/")
//   ) {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }

//   // 🧭 If logged in and tries to visit `/` or `/login`, redirect to dashboard based on role
//   if (token && (pathname === "/" || pathname === "/login")) {
//     switch (token.role) {
//       case "SUPER_ADMIN":
//         return NextResponse.redirect(new URL("/super-admin/dashboard", req.url));
//       case "COMPANY_ADMIN":
//         return NextResponse.redirect(
//           new URL(`/company/${token.companyId}/dashboard`, req.url)
//         );
//       case "COMPANY_HR":
//         return NextResponse.redirect(
//           new URL(`/hr/${token.companyId}/dashboard`, req.url)
//         );
//       case "EMPLOYEE":
//         return NextResponse.redirect(
//           new URL(`/employee/${token.companyId}/profile`, req.url)
//         );
//       default:
//         return NextResponse.redirect(new URL("/unauthorized", req.url));
//     }
//   }

//   // 🧰 Role-based route protection
//   if (pathname.startsWith("/super-admin") && token?.role !== "SUPER_ADMIN") {
//     return NextResponse.redirect(new URL("/unauthorized", req.url));
//   }

//   if (
//     pathname.startsWith("/company/") &&
//     token?.role !== "COMPANY_ADMIN" &&
//     token?.role !== "COMPANY_HR"
//   ) {
//     return NextResponse.redirect(new URL("/unauthorized", req.url));
//   }

//   if (pathname.startsWith("/employee/") && token?.role !== "EMPLOYEE") {
//     return NextResponse.redirect(new URL("/unauthorized", req.url));
//   }

//   // 🏢 Tenant scoping — make sure users stay inside their own company
//   if (
//     token?.role !== "SUPER_ADMIN" &&
//     token?.companyId &&
//     pathname.includes("/company/")
//   ) {
//     const pathSegments = pathname.split("/");
//     const pathCompanyId = pathSegments[2];

//     if (pathCompanyId && pathCompanyId !== token.companyId) {
//       return NextResponse.redirect(
//         new URL(`/company/${token.companyId}/dashboard`, req.url)
//       );
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/",
//     "/login",
//     "/register-company",
//     "/super-admin/:path*",
//     "/company/:path*",
//     "/employee/:path*",
//     "/unauthorized",
//   ],
// };



















// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Helper to map URL segment to required role
const RequiredRoleMap: Record<string, string> = {
    "admin": "COMPANY_ADMIN",
    "hr": "COMPANY_HR",
    "employee": "EMPLOYEE",
};

export async function middleware(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname, searchParams } = req.nextUrl;

    // ... (Unauthenticated users and Login Redirects - Keep as is)
    if (
        !token &&
        pathname !== "/" &&        
        pathname !== "/login" &&
        pathname !== "/register-company" &&
        !pathname.startsWith("/api/")
    ) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token && (pathname === "/" || pathname === "/login")) {
        // ... (Login Redirects - Keep as is)
        switch (token.role) {
            case "SUPER_ADMIN":
                return NextResponse.redirect(new URL("/super-admin/dashboard", req.url));
            case "COMPANY_ADMIN":
                return NextResponse.redirect(
                    new URL(`/company/${token.companyId}/admin/dashboard`, req.url)
                );
            case "COMPANY_HR":
                return NextResponse.redirect(
                    new URL(`/company/${token.companyId}/hr/dashboard`, req.url)
                );
            case "EMPLOYEE":
                return NextResponse.redirect(
                    new URL(`/company/${token.companyId}/employee/dashboard`, req.url)
                );
            default:
                return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
    }

    // 🛡 Role-based protection (CORRECTED LOGIC)
    
    // 1. Check for Super Admin separately
    if (pathname.startsWith("/super-admin") && token?.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // 2. Check Company Roles (Requires checking the third segment of the path)
    if (pathname.startsWith("/company/") && token) {
        const pathSegments = pathname.split('/').filter(s => s.length > 0);
        const roleSegment = pathSegments[2]; // /company/[companyId]/[role]/...
        
        const requiredRole = RequiredRoleMap[roleSegment];

        // If the path contains a recognized role segment (admin, hr, employee)
        if (requiredRole) {
            // Check if the user's token role MATCHES the role required by the URL
            if (token.role !== requiredRole) {
                // User is trying to access a restricted path! Redirect them to their OWN dashboard.
                const userRolePrefix = getRolePrefix(token.role, token.companyId); // Helper needed below
                
                if (userRolePrefix) {
                    return NextResponse.redirect(new URL(`${userRolePrefix}/dashboard`, req.url));
                }
                
                // Fallback unauthorized if we can't determine a safe redirect
                return NextResponse.redirect(new URL("/unauthorized", req.url));
            }
        }
    }

    // 🏢 Tenant scoping — ensure user stays in their company (Keep as is, it's correct)
    if (
        token?.companyId &&
        (pathname.startsWith("/company/admin/") ||
          pathname.startsWith("/company/hr/") ||
          pathname.startsWith("/company/employee/"))
    ) {
        const pathSegments = pathname.split("/");
        const pathCompanyId = pathSegments[2]; // e.g. /company/[companyId]/dashboard
        
        // ... (rest of the tenant scoping logic is correct)
        if (pathCompanyId && pathCompanyId !== token.companyId) {
            // Redirect user back to their own company dashboard/profile
            if (token.role === "COMPANY_ADMIN") {
                return NextResponse.redirect(
                    new URL(`/company/${token.companyId}/admin/dashboard`, req.url)
                );
            }
            if (token.role === "COMPANY_HR") {
                return NextResponse.redirect(
                    new URL(`/company/${token.companyId}/hr/dashboard`, req.url)
                );
            }
            if (token.role === "EMPLOYEE") {
                return NextResponse.redirect(
                    new URL(`/company/${token.companyId}/employee/dashboard`, req.url)
                );
            }
        }
    }

    return NextResponse.next();
}

// ⚠️ NEW HELPER FUNCTION to be added near the top of middleware.ts
function getRolePrefix(role?: string | null, companyId?: string | null): string | null {
    // If role or companyId are missing, we can't build a valid prefix.
    if (!role || !companyId) return null;

    switch (role) {
        case "COMPANY_ADMIN":
            return `/company/${companyId}/admin`;
        case "COMPANY_HR":
            return `/company/${companyId}/hr`;
        case "EMPLOYEE":
            return `/company/${companyId}/employee`;
        default:
            return null;
    }
}

export const config = {
  matcher: [
    // ... (Keep the matcher as simplified previously)
    "/",
    "/login",
    "/register-company",
    "/super-admin/:path*",
    "/company/:path*",
    "/unauthorized",
  ],
};