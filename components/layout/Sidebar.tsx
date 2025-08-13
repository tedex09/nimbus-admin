'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
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
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="bg-white shadow-lg"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Sidebar overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Tv className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-lg">IPTV Manager</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User info */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {isAdmin ? (
                  <Shield className="h-5 w-5 text-blue-600" />
                ) : (
                  <Users className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {isAdmin ? 'Administrador' : 'Dono de Servidor'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={pathname === item.href ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            ))}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}