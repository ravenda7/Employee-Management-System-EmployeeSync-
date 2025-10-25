import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { hasPermission, User } from '@/lib/permission';
import { Role } from '@/lib/generated/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user: User = {
    id: session.user.id,
    companyId: session.user.companyId,
    roles: [session.user.role as Role],
  };

  if (!hasPermission(user, 'companies', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const companies = await db.company.findMany({
    select: { id: true, name: true },
  });

  return NextResponse.json(companies);
}