"use client";

import { FpjsProvider } from "@fingerprintjs/fingerprintjs-pro-react";

export function FpjsClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <FpjsProvider
      loadOptions={{
        apiKey: process.env.NEXT_PUBLIC_FPJS_API_KEY!,
        // TODO: later add region, scriptUrlPattern etc if needed
      }}
    >
      {children}
    </FpjsProvider>
  );
}
