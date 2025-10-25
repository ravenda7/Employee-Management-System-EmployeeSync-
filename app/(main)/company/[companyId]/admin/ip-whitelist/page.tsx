import { SiteHeader } from "@/components/layout/company/site-header";
import AddIPForm from "../_components/add-ip-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getIpRangesByCompany } from "@/lib/queries";
import { WhitelistedIpRange } from "@/lib/generated/prisma";
import IPManagementClient from "../_components/ip-management-client";

export default async function ManageIpWhitelist() {
    const session = await getServerSession(authOptions);
    if(!session || !session.user || !session.user.companyId) {
        redirect('/login');
    }
    const user = session.user;
    const initialIpRanges: WhitelistedIpRange[] = await getIpRangesByCompany(user.companyId ?? '');
            
    return (
        <>
            <SiteHeader title="IP Whitelist Management" />
            <section className="px-4 lg:px-6 py-4 flex flex-col gap-y-4">
                <AddIPForm />
                <IPManagementClient 
                    initialIpRanges={initialIpRanges} 
                />
            </section>
        </>
    )
}