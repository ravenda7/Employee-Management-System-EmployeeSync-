import { Drone } from "lucide-react";
import Link from "next/link";

export default function Header() {

    return (
        <div className="absolute w-full z-10 top-6 bg-transparent text-white">
            <div className="flex justify-center items-center w-full">
                <header className="flex justify-between items-center w-full max-w-2xl px-6 h-14 border border-white/30 backdrop-blur-md bg-pink-300/5 rounded-full shadow-lg">
                    <div className="flex items-center gap-1">
                         <Drone /><h1 className="text-sm sm:text-lg font-bold">EmployeeSync</h1>
                    </div>
                    <div className="space-x-5 text-xs sm:text-sm font-semibold">
                        <Link href="/home" className="hover:underline">Home</Link>
                        <Link href="/about" className="hover:underline">About</Link>
                    </div>
                </header>
            </div>
        </div>
    )
}