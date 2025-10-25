// context/SessionContext.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Session } from 'next-auth';

// Define the simplified user object we expose
interface UserData {
    id: string;
    email: string;
    companyId: string; 
    role: string;
    // Add other fields needed across the client app
}

// Define the shape of the context value
interface SessionContextValue {
    user: UserData | null;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProviderProps {
    children: ReactNode;
    initialSession: Session | null; 
}

export const DataSessionProvider: React.FC<SessionProviderProps> = ({ children, initialSession }) => {
    // Safely extract the data we need from the server-fetched session
    const user: UserData | null = (initialSession?.user && initialSession.user.companyId) ? { 
        id: initialSession.user.id || '',
        email: initialSession.user.email || '',
        companyId: initialSession.user.companyId,
        role: initialSession.user.role || 'employee', // Assuming role is available on user object
    } : null;

    const contextValue: SessionContextValue = { user };

    return (
        <SessionContext.Provider value={contextValue}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSessionData = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSessionData must be used within a SessionProvider (Custom Data Transfer)');
    }
    return context;
};