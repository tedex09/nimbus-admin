'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/sonner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        
        <div className="lg:pl-64">
          <main className="p-4 lg:p-8 pt-16 lg:pt-8">
            {children}
          </main>
        </div>
        
        <Toaster position="top-right" />
      </div>
    </SessionProvider>
  );
}