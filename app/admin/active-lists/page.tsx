'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  RefreshCw,
  Users,
  Server,
  Clock
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface ActiveList {
  _id: string;
  serverCode: string;
  username: string;
  userAgent?: string;
  ipAddress?: string;
  lastAccess: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminActiveListsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeLists, setActiveLists] = useState<ActiveList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && session.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  const fetchActiveLists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/active-lists');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar listas ativas');
      }

      const data = await response.json();
      setActiveLists(data.activeLists || []);
    } catch (error) {
      console.error('Fetch active lists error:', error);
      toast.error('Erro ao carregar listas ativas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchActiveLists();
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Listas Ativas</h1>
            <p className="text-gray-600 mt-1">
              Monitoramento de listas IPTV ativas nas últimas 24 horas
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Listas Ativas
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLists.length}</div>
              <p className="text-xs text-muted-foreground">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Servidores Únicos
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(activeLists.map(list => list.serverCode)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Com listas ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Únicos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(activeLists.map(list => `${list.serverCode}-${list.username}`)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Combinações únicas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Lists Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Listas Ativas Detalhadas
            </CardTitle>
            <CardDescription>
              Lista detalhada de todas as listas IPTV ativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeLists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma lista ativa encontrada
                </h3>
                <p className="text-gray-600 text-center">
                  Não há listas IPTV ativas nas últimas 24 horas.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servidor</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLists.map((list) => (
                    <TableRow key={list._id}>
                      <TableCell className="font-medium">{list.serverCode}</TableCell>
                      <TableCell>{list.username}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {list.ipAddress || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(list.lastAccess).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={list.isActive ? 'default' : 'secondary'}>
                          {list.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}