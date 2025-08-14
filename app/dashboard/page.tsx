'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Activity, 
  Users, 
  BarChart3,
  TrendingUp,
  Globe,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalServers: 0,
    activeServers: 0,
    inactiveServers: 0,
    activeLists: 0,
    monthlyGrowth: 0,
    newServersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard-stats');
      if (!response.ok) throw new Error('Erro ao carregar estatísticas');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Fetch stats error:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) fetchStats();
  }, [session]);

  const statsCards = [
    {
      title: "Total de Servidores",
      value: loading ? '...' : stats.totalServers,
      description: loading ? '...' : `${stats.activeServers} ativos`,
      icon: Server,
      color: "from-blue-500 to-blue-600",
      delay: 0.1
    },
    {
      title: "Servidores Ativos",
      value: loading ? '...' : stats.activeServers,
      description: "Online e funcionando",
      icon: Activity,
      color: "from-green-500 to-green-600",
      delay: 0.2
    },
    {
      title: "Listas Ativas (Mês)",
      value: loading ? '...' : stats.activeLists,
      description: "Mês atual",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      delay: 0.3
    },
    {
      title: "Crescimento Mensal",
      value: loading ? '...' : `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth}%`,
      description: "Novos servidores este mês",
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      delay: 0.4
    }
  ];

  const quickActions = [
    {
      title: "Servidores",
      description: "Gerenciar servidores",
      icon: Server,
      href: "/dashboard/servers"
    },
    {
      title: "Estatísticas",
      description: "Ver relatórios",
      icon: BarChart3,
      href: "/dashboard/stats"
    },
    {
      title: "Documentação",
      description: "Guias e tutoriais",
      icon: Globe,
      href: "https://docs.iptv-manager.com",
      external: true
    },
    {
      title: "Novo Servidor",
      description: "Adicionar servidor",
      icon: Plus,
      href: "/dashboard/servers"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Welcome Section */}
        <motion.div 
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-2xl p-8 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <motion.h1 
                className="text-3xl lg:text-4xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Bem-vindo, {session?.user?.name}! 👋
              </motion.h1>
              <motion.p 
                className="text-lg opacity-90 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Gerencie seus servidores IPTV e monitore o desempenho do seu sistema com nossa plataforma moderna e intuitiva.
              </motion.p>
            </div>
            <motion.div 
              className="mt-6 lg:mt-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => router.push('/dashboard/servers')}
                className="h-12 px-6 bg-white text-blue-600 hover:bg-gray-100 font-semibold shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Gerenciar Servidores
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map(stat => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Ações Rápidas</CardTitle>
              <CardDescription className="text-gray-600">
                Acesso rápido às principais funcionalidades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map(action => (
                  <Button 
                    key={action.title}
                    variant="outline" 
                    className="h-auto p-6 flex flex-col items-start space-y-3 w-full border-2 hover:border-gray-300 transition-all duration-200 bg-white hover:bg-gray-50"
                    onClick={() => action.external ? window.open(action.href, '_blank') : router.push(action.href)}
                  >
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left space-y-1">
                      <p className="font-semibold text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
