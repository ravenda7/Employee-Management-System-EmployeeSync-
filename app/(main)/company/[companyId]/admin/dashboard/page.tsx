'use client'
import LogOutButton from "@/components/custom/logout-button";
import { useParams } from "next/navigation";

export default function HRDashboard() {
    const params = useParams();
    const companyId = params.companyId as string;
    return (
        <div><LogOutButton />
            <h1>Company Dashboard {companyId}</h1>
        </div>
    )
}