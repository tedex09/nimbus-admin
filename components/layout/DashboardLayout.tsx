'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SessionProvider } from 'next-auth/react';
import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/sonner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Conteúdo */}
        <div className="flex-1 lg:ml-4">
          <main className="p-4 lg:p-8 pt-20 lg:pt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {children}
            </motion.div>
          </main>
        </div>

        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
          }}
        />
      </div>
    </SessionProvider>
  );
}
