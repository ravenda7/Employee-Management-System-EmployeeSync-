'use client'
import { MoveLeft } from "lucide-react";
import { Button } from "../ui/button";

export default function () {

    return (
        <Button variant="outline" onClick={() => window.history.back()}>
            <MoveLeft />
        </Button>
    )
}