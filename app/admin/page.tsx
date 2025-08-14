'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Server,
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  Shield,
  CheckCircle,
  Database
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AdminStats {
  totalServers: number;
  activeServers: number;
  inactiveServers: number;
  totalUsers: number;
  activeUsers: number;
  activeLists: number;
  monthlyGrowth: number; // percent (ex.: 12, -3)
  newServersThisMonth: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats>({
    totalServers: 0,
    activeServers: 0,
    inactiveServers: 0,
    totalUsers: 0,
    activeUsers: 0,
    activeLists: 0,
    monthlyGrowth: 0,
    newServersThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  // Redireciona não-admins quando autenticados
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard-stats');
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }
      const data = (await response.json()) as Partial<AdminStats>;
      setStats(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Fetch stats error:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchStats();
    }
  }, [status, session]);

  // Enquanto carrega a sessão, não renderiza nada
  if (status === 'loading') return null;
  // Se autenticado e não-admin, já foi feito replace; evita render
  if (status === 'authenticated' && session?.user?.role !== 'admin') return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Admin Welcome */}
        <motion.div
          className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 text-white rounded-2xl p-8 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <motion.div
                className="flex items-center space-x-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="h-8 w-8" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold">Painel Administrativo</h1>
              </motion.div>
              <motion.p
                className="text-lg opacity-90 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Bem-vindo, {session?.user?.name}. Monitore e gerencie todo o sistema IPTV com
                controle total e visibilidade completa.
              </motion.p>
            </div>
            <motion.div
              className="mt-6 lg:mt-0 flex flex-wrap gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => router.push('/admin/servers')}
                  className="bg-white text-purple-600 hover:bg-gray-100 font-semibold shadow-lg"
                >
                  <Server className="h-5 w-5 mr-2" />
                  Todos os Servidores
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => router.push('/admin/users')}
                  className="bg-white text-purple-600 hover:bg-gray-100 font-semibold shadow-lg"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Gerenciar Usuários
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Total de Servidores',
              value: loading ? '...' : stats.totalServers,
              description: loading ? '...' : `${stats.activeServers} ativos, ${stats.inactiveServers} inativos`,
              icon: Server,
              color: 'from-blue-500 to-blue-600',
              delay: 0.1
            },
            {
              title: 'Usuários do Sistema',
              value: loading ? '...' : stats.totalUsers,
              description: loading ? '...' : `${stats.activeUsers} ativos`,
              icon: Users,
              color: 'from-green-500 to-green-600',
              delay: 0.2
            },
            {
              title: 'Listas Ativas',
              value: loading ? '...' : stats.activeLists,
              description: 'Últimas 24 horas',
              icon: Activity,
              color: 'from-purple-500 to-purple-600',
              delay: 0.3
            },
            {
              title: 'Crescimento Mensal',
              value: loading ? '...' : `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth}%`,
              description: 'Novos servidores este mês',
              icon: TrendingUp,
              color: 'from-orange-500 to-orange-600',
              delay: 0.4
            },
            {
              title: 'Cache Hit Rate',
              value: '94.2%',
              description: 'Performance do Redis',
              icon: Database,
              color: 'from-cyan-500 to-cyan-600',
              delay: 0.5
            },
            {
              title: 'Uptime do Sistema',
              value: '99.8%',
              description: 'Últimos 30 dias',
              icon: CheckCircle,
              color: 'from-emerald-500 to-emerald-600',
              delay: 0.6
            }
          ].map((stat) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Ações rápidas do Admin */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Administrativas</CardTitle>
            <CardDescription>Acesso rápido às funcionalidades administrativas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => router.push('/admin/servers')}
              >
                <Server className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Servidores</p>
                  <p className="text-xs text-muted-foreground">Gerenciar todos os servidores</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => router.push('/admin/users')}
              >
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Usuários</p>
                  <p className="text-xs text-muted-foreground">Administrar usuários</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => router.push('/admin/stats')}
              >
                <BarChart3 className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Relatórios</p>
                  <p className="text-xs text-muted-foreground">Estatísticas detalhadas</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => router.push('/admin/settings')}
              >
                <Shield className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Configurações</p>
                  <p className="text-xs text-muted-foreground">Configurações globais</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
