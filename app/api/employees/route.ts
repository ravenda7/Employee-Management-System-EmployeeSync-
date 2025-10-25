import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { hasPermission, User } from '@/lib/permission';
import { Role } from '@/lib/generated/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user: User = {
    id: session.user.id,
    companyId: session.user.companyId,
    roles: [session.user.role as Role],
  };

  if (!hasPermission(user, 'employees', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const where = user.roles[0] === 'SUPER_ADMIN' ? {} : { companyId: user.companyId };
  const employees = await db.employee.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, companyId: true },
  });
  const employeeCount = await db.employee.count({ where });

  return NextResponse.json({ employees, count: employeeCount });
}