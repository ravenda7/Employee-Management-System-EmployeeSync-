'use client'

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "../ui/button";

export default function LogOutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => 
    signOut(
        {
            redirect: true,
            callbackUrl: `${window.location.origin}`,
      })}>
      <LogOut />
      Log out
    </Button>
  );
}