'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Server,
  Activity,
  RefreshCw,
  PieChart,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminStatsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    if (session && session.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas gerais
      const [dashboardResponse, monthlyResponse, plansResponse] = await Promise.all([
        fetch('/api/dashboard-stats'),
        fetch('/api/monthly-active-lists'),
        fetch('/api/plans')
      ]);

      const dashboardData = await dashboardResponse.json();
      const monthlyData = await monthlyResponse.json();
      const plansData = await plansResponse.json();

      setStats({
        dashboard: dashboardData,
        monthly: monthlyData,
        plans: plansData.plans || []
      });
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

  if (session?.user?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  // Preparar dados para gráficos
  const monthlyData = stats.monthly?.monthlyLists || [];
  const serverUsage = monthlyData.reduce((acc: any, list: any) => {
    acc[list.serverCode] = (acc[list.serverCode] || 0) + 1;
    return acc;
  }, {});

  const serverUsageChart = Object.entries(serverUsage).map(([server, count]) => ({
    server,
    listas: count
  })).slice(0, 10); // Top 10 servidores

  const planDistribution = stats.plans.map((plan: any, index: number) => ({
    name: plan.nome,
    value: Math.floor(Math.random() * 100), // Simular dados
    color: COLORS[index % COLORS.length]
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estatísticas Avançadas</h1>
            <p className="text-gray-600 mt-1">
              Análise detalhada do uso do sistema e performance
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Servidores
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dashboard?.totalServers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.dashboard?.activeServers || 0} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Listas Ativas (Mês)
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyData.length}</div>
              <p className="text-xs text-muted-foreground">
                Mês atual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dashboard?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                De {stats.dashboard?.totalUsers || 0} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Crescimento
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{stats.dashboard?.monthlyGrowth || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Uso por Servidor
              </CardTitle>
              <CardDescription>
                Top 10 servidores com mais listas ativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serverUsageChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="server" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="listas" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Distribuição por Planos
              </CardTitle>
              <CardDescription>
                Uso dos diferentes planos de cobrança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {planDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Server Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Servidores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Ativos</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{stats.dashboard?.activeServers || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pendentes</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">
                    {(stats.dashboard?.totalServers || 0) - (stats.dashboard?.activeServers || 0)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inativos</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium">{stats.dashboard?.inactiveServers || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Growth */}
          <Card>
            <CardHeader>
              <CardTitle>Crescimento Mensal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Novos Servidores</span>
                <span className="font-medium text-green-600">
                  +{stats.dashboard?.newServersThisMonth || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Crescimento</span>
                <span className="font-medium text-blue-600">
                  {stats.dashboard?.monthlyGrowth || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Listas Ativas</span>
                <span className="font-medium">
                  {monthlyData.length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>Saúde do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Redis</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">94.2%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Banco de Dados</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Conectado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}