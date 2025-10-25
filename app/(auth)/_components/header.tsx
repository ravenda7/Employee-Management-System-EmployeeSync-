import { Command } from "lucide-react";
import Link from "next/link";

type Props = {
    label: string;
    href:string;
}

export default function Header({ label, href }: Props) {
    return (
        <div className="absolute w-full z-10 top-0 bg-transparent py-6 px-8">
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-x-3 text-purple-500">
                    <Command className="w-8 h-8" />
                    <span className="font-title font-bold text-lg">Employee Sync</span>
                </div>
                <Link href={href} className="font-semibold text-white hover:bg-slate-800 transition-colors p-2 rounded-sm text-sm">
                    {label}
                </Link>
            </div>
        </div>
    )
}