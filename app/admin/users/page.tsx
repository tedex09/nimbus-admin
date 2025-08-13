'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  RefreshCw,
  UserPlus,
  Server,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserDialog } from '@/components/users/UserDialog';
import { UserServersDialog } from '@/components/users/UserServersDialog';
import { toast } from 'sonner';

interface User {
  _id: string;
  nome: string;
  email: string;
  tipo: string;
  ativo: boolean;
  serverCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [serversDialogOpen, setServersDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (session && session.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersResponse, serversResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/servers')
      ]);
      
      if (!usersResponse.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const usersData = await usersResponse.json();
      const serversData = serversResponse.ok ? await serversResponse.json() : { servers: [] };
      
      // Contar servidores por usuário
      const serverCounts: Record<string, number> = {};
      serversData.servers?.forEach((server: any) => {
        const userId = server.donoId._id || server.donoId;
        serverCounts[userId] = (serverCounts[userId] || 0) + 1;
      });
      
      const usersWithCounts = (usersData.users || []).map((user: User) => ({
        ...user,
        serverCount: serverCounts[user._id] || 0
      }));
      
      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchUsers();
    }
  }, [session]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleViewServers = (user: User) => {
    setSelectedUser(user);
    setServersDialogOpen(true);
  };
  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir usuário');
      }

      toast.success('Usuário excluído com sucesso');
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleUserSaved = () => {
    setDialogOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os donos de servidores IPTV
            </p>
          </div>
          
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Usuários Cadastrados
            </CardTitle>
            <CardDescription>
              Lista de todos os donos de servidores cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Comece criando o primeiro dono de servidor.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Usuário
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Servidores</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Server className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{user.serverCount || 0}</span>
                          {(user.serverCount || 0) > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewServers(user)}
                              className="h-6 px-2 text-xs"
                            >
                              Ver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.ativo ? 'default' : 'secondary'}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(user.serverCount || 0) > 0 && (
                              <DropdownMenuItem onClick={() => handleViewServers(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Servidores
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user._id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* User Servers Dialog */}
        <UserServersDialog
          open={serversDialogOpen}
          onOpenChange={setServersDialogOpen}
          user={selectedUser}
        />
        {/* User Dialog */}
        <UserDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingUser(null);
          }}
          user={editingUser}
          onUserSaved={handleUserSaved}
        />
      </div>
    </DashboardLayout>
  );
}