'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
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
  AlertCircle,
  CheckCircle,
  Globe,
  Database
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalServers: 0,
    activeServers: 0,
    inactiveServers: 0,
    totalUsers: 0,
    activeUsers: 0,
    activeLists: 0,
    monthlyGrowth: 0,
    newServersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && session.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard-stats');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

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
    if (session?.user?.role === 'admin') {
      fetchStats();
    }
  }, [session]);
  const systemHealth = [
    { service: 'API Gateway', status: 'online', uptime: '99.9%' },
    { service: 'Redis Cache', status: 'online', uptime: '99.8%' },
    { service: 'MongoDB', status: 'online', uptime: '100%' },
    { service: 'XtreamCodes API', status: 'online', uptime: '98.7%' },
  ];

  const recentActivity = [
    { id: 1, action: 'Novo servidor SERV025 adicionado por João Silva', time: '15min' },
    { id: 2, action: 'Usuário admin@empresa.com fez login', time: '32min' },
    { id: 3, action: 'Servidor SERV018 foi suspenso', time: '1h' },
    { id: 4, action: 'Cache Redis reiniciado automaticamente', time: '2h' },
  ];

  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Admin Welcome */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-2xl font-bold">
              Painel Administrativo
            </h1>
          </div>
          <p className="opacity-90">
            Bem-vindo, {session.user.name}. Monitore e gerencie todo o sistema IPTV.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button 
              variant="secondary" 
              onClick={() => router.push('/admin/servers')}
            >
              <Server className="h-4 w-4 mr-2" />
              Todos os Servidores
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => router.push('/admin/users')}
            >
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Usuários
            </Button>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Servidores
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalServers}</div>
              <p className="text-xs text-muted-foreground">
                {loading ? '...' : `${stats.activeServers} ativos, ${stats.inactiveServers} inativos`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários do Sistema
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {loading ? '...' : `${stats.activeUsers} ativos`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Listas Ativas
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activeLists}</div>
              <p className="text-xs text-muted-foreground">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Crescimento Mensal
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Novos servidores este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cache Hit Rate
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">94.2%</div>
              <p className="text-xs text-muted-foreground">
                Performance do Redis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Uptime do Sistema
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">99.8%</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Health & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>Saúde do Sistema</CardTitle>
              <CardDescription>
                Status dos serviços principais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealth.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{service.service}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Online</p>
                    <p className="text-xs text-gray-500">Uptime: {service.uptime}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Admin Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Administrativa</CardTitle>
              <CardDescription>
                Últimas ações no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Administrativas</CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades administrativas
            </CardDescription>
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
                  <p className="text-xs text-muted-foreground">
                    Gerenciar todos os servidores
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Administrar usuários
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Estatísticas detalhadas
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Configurações globais
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}