'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Tv, 
  Home, 
  Server, 
  Users, 
  Settings, 
  LogOut,
  BarChart3,
  Shield,
  Activity,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = session?.user?.role === 'admin';

  const navigation = [
    {
      name: 'Dashboard',
      href: isAdmin ? '/admin' : '/dashboard',
      icon: Home,
    },
    {
      name: 'Servidores',
      href: isAdmin ? '/admin/servers' : '/dashboard/servers',
      icon: Server,
    },
    ...(isAdmin ? [
      {
        name: 'Planos',
        href: '/admin/plans',
        icon: CreditCard,
      },
      {
        name: 'Usuários',
        href: '/admin/users',
        icon: Users,
      },
      {
        name: 'Listas Ativas',
        href: '/admin/active-lists',
        icon: Activity,
      },
      {
        name: 'Estatísticas',
        href: '/admin/stats',
        icon: BarChart3,
      },
      {
        name: 'Configurações',
        href: '/admin/settings',
        icon: Settings,
      },
    ] : []),
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="bg-white/90 backdrop-blur-sm shadow-lg border-0 h-12 w-12"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {/* Sidebar overlay (mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 lg:hidden z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-gray-50 shadow-2xl border-r border-gray-200',
          'lg:translate-x-0 lg:static lg:inset-0', // Sempre visível no desktop
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
        initial={false}
        animate={{ 
          x: typeof window !== 'undefined' && window.innerWidth >= 1024 
            ? 0 
            : (isOpen ? 0 : -288) 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Tv className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="font-bold text-xl text-white">IPTV Manager</span>
                <p className="text-xs text-blue-100">Sistema B2B</p>
              </div>
            </motion.div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User info */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                {isAdmin ? (
                  <Shield className="h-6 w-6 text-white" />
                ) : (
                  <Users className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-600">
                  {isAdmin ? 'Administrador' : 'Dono de Servidor'}
                </p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-12 text-left font-medium transition-all duration-200',
                    pathname === item.href 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {pathname === item.href && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    />
                  )}
                </Button>
              </motion.div>
            ))}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sair do Sistema
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}