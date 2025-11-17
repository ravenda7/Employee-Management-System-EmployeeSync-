import { Clock } from "lucide-react";

interface Props {
    className?: string;
    shiftName?: string;
    shiftStartTime?: string;
    shiftEndTime?: string;
}

export default function HeroCard({ className, shiftName, shiftStartTime, shiftEndTime}: Props) {

    return(
        <div className={`${className} bg-white rounded-lg p-4 flex flex-col gap-y-2 w-[220px]`}>
            <div className="flex flex-row items-center justify-between">
            <p className="text-slate-600 font-bold">Today's Shift</p>
                <Clock className="text-sky-500" />
            </div>
            <div className="">
                <p className="text-slate-500 font-semibold">{shiftName}</p>
                <p className="text-slate-500 font-mono">{shiftStartTime} - {shiftEndTime}</p>
            </div>
        </div>
    )
}