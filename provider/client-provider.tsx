"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";

interface ClientProvideProps {
  children: React.ReactNode;
}

const ClientProvider: React.FC<ClientProvideProps> = ({ children }) => {
    return <SessionProvider>{children}</SessionProvider>
}
export default ClientProvider;