'use client';

import { useSession } from 'next-auth/react';
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Mock data - Replace with real data from API
  const stats = {
    totalServers: 3,
    activeServers: 2,
    totalConnections: 127,
    monthlyGrowth: 15.2,
  };

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
              <div className="text-2xl font-bold">{stats.totalServers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeServers} ativos
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
                {stats.activeServers}
              </div>
              <p className="text-xs text-muted-foreground">
                Online e funcionando
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conexões Ativas
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConnections}</div>
              <p className="text-xs text-muted-foreground">
                Usuários conectados
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
                +{stats.monthlyGrowth}%
              </div>
              <p className="text-xs text-muted-foreground">
                Comparado ao mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas atividades dos seus servidores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesso rápido às principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/servers')}
              >
                <Server className="h-4 w-4 mr-2" />
                Gerenciar Servidores
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/settings')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/stats')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Estatísticas
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('https://docs.iptv-manager.com', '_blank')}
              >
                <Globe className="h-4 w-4 mr-2" />
                Documentação
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Informações sobre a saúde do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">API</p>
                  <p className="text-sm text-gray-600">Operacional</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Cache Redis</p>
                  <p className="text-sm text-gray-600">Funcionando</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Banco de Dados</p>
                  <p className="text-sm text-gray-600">Conectado</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}