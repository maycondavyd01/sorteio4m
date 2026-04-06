import { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-outer">
      <div className="mx-auto max-w-md min-h-screen bg-background shadow-sm">
        {children}
      </div>
    </div>
  );
}
