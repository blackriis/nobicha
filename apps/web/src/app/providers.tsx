'use client';

import { AuthProvider } from "@/components/auth";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="theme"
      >
        {children}
      </ThemeProvider>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

