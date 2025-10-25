import { Menu } from "lucide-react";
import {
    Sheet, 
    SheetContent,
    SheetTrigger
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";


export const MobileSidebar = () => {
    return(
        <Sheet>
            <SheetTrigger>
                <Menu className="text-white" />
            </SheetTrigger>
            <SheetContent className="p-0 z-[100] bg-[#392B2F]" side="left">
                <Sidebar />
            </SheetContent>
        </Sheet>
    )
}