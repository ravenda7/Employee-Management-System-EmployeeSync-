import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { User } from '@/lib/permission';
import { Role } from '@/lib/generated/prisma';

export async function GET(req: Request, { params }: { params: { companyId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user: User = {
    id: session.user.id,
    companyId: session.user.companyId,
    roles: [session.user.role as Role],
  };

  // Only Super Admin or users from the same company can view
  if (user.roles[0] !== 'SUPER_ADMIN' && user.companyId !== params.companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const company = await db.company.findUnique({
    where: { id: params.companyId },
    select: { id: true, name: true },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  return NextResponse.json(company);
}