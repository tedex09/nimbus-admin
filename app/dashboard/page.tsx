'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
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
  Shield,
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
    if (session?.user) {
      fetchStats();
    }
  }, [session]);
  const recentActivity = [
    { id: 1, action: 'Servidor SERV001 foi atualizado', time: '2h atrás' },
    { id: 2, action: 'Novo usuário conectado ao servidor SERV002', time: '4h atrás' },
    { id: 3, action: 'Configurações de branding alteradas', time: '1d atrás' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">
            Bem-vindo, {session?.user?.name}!
          </h1>
          <p className="opacity-90">
            Gerencie seus servidores IPTV e monitore o desempenho do seu sistema.
          </p>
          <div className="mt-4">
            <Button 
              variant="secondary" 
              onClick={() => router.push('/dashboard/servers')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Gerenciar Servidores
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {loading ? '...' : `${stats.activeServers} ativos`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Servidores Ativos
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : stats.activeServers}
              </div>
              <p className="text-xs text-muted-foreground">
                Online e funcionando
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Listas Ativas (Mês)
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activeLists}</div>
              <p className="text-xs text-muted-foreground">
                Mês atual
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
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => router.push('/dashboard/servers')}
              >
                <Server className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Servidores</p>
                  <p className="text-xs text-muted-foreground">
                    Gerenciar servidores
                  </p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => router.push('/dashboard/stats')}
              >
                <BarChart3 className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Estatísticas</p>
                  <p className="text-xs text-muted-foreground">
                    Ver relatórios
                  </p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => window.open('https://docs.iptv-manager.com', '_blank')}
              >
                <Globe className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Documentação</p>
                  <p className="text-xs text-muted-foreground">
                    Guias e tutoriais
                  </p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => router.push('/dashboard/servers')}
              >
                <Plus className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Novo Servidor</p>
                  <p className="text-xs text-muted-foreground">
                    Adicionar servidor
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