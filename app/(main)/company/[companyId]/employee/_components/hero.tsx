'use client'
import { ClipboardClock } from "lucide-react";
import HeroCard from "./hero-card";
import QuickActions from "./quick-action";
import { formatDateToTimeString } from "@/lib/time";

// Utility function to get the current system date and give in format
function getFormattedTodayDate(): string {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return today.toLocaleDateString('en-US', options);
}

type Employee = {
  name: string;
  id: string;
  email: string;
  avatarUrl: string | null;
  departmentId: string | null;
  baseSalary: number;
  shiftId: string | null;
  shift: {
    name: string;
    id: string;
    createdAt: Date;
    companyId: string;
    startTime: Date;
    endTime: Date;
  } | null;
};

interface Props {
    employeeData: Employee; 
}

export default function Hero({  employeeData }: Props) {
    const userName = employeeData.name;
    console.log("employeedata:", employeeData)
    const shiftName = employeeData.shift?.name;
    const shiftStartTime = employeeData.shift ? formatDateToTimeString(employeeData.shift.startTime) : "";
    const shiftEndTime = employeeData.shift ? formatDateToTimeString(employeeData.shift.endTime) : "";
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-x-4">
                <div className="w-full flex gap-2 rounded-lg bg-sky-300 p-6">
                    <div className="w-full flex flex-col justify-between">
                        <p className="font-mono text-slate-700 text-[14px]">{getFormattedTodayDate()}</p>
                        <div>
                            <h1 className="text-2xl font-semibold text-black">Hello! {userName} 👋</h1>
                            <p className="font-mono text-slate-700 text-[12px]">Track & manage your progress here</p>
                        </div>
                    </div>
                    <div className="flex items-center flex-row gap-4">
                        <HeroCard
                        shiftName={shiftName}
                        shiftStartTime={shiftStartTime}
                        shiftEndTime={shiftEndTime}
                        />
                    </div>
                </div>
                <QuickActions />
            </div>
    )
}