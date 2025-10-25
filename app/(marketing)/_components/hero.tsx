'use client';

import Orb from "@/components/react-bits-components/orb";
import Header from "./header";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="bg-black p-0 m-0" style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Header />
      <Orb
        hoverIntensity={0.5}
        rotateOnHover={true}
        hue={0}
        forceHoverState={false}
      />
      <div className="absolute top-1/3 w-full">
        <div className="flex flex-col gap-y-2 justify-center items-center w-full">
            <Badge className="bg-purple-700/12 h-6 sm:h-8 text-xs sm:text-sm font-normal inline-flex items-center gap-2 border border-white/30">
            <Sparkles className="text-white animate-pulse" />
            Powerful Features
            </Badge>
            <h1 className="text-white text-xl sm:text-4xl font-bold">Simplify Workflow</h1>
            <h1 className="text-white text-xl sm:text-4xl font-bold mb-4">To Manage Your Employees</h1>
            <p className="text-white text-center max-w-xl px-4 mb-6 text-xs sm:text-lg">EmployeeSync Free brings powerful attendance tracking and payroll management to small teams. 100% free, forever.</p>
            <div className="space-x-4">
              <Link href='/register'>
                <Button variant='outline' size='lg'>Get Started</Button>
              </Link>
              <Link href='/login'>
                <Button size='lg' className="cursor-pointer">Sign In</Button>
              </Link>
            </div>
        </div>
      </div>
      
    </div>
  );
}
