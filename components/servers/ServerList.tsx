'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Server, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ServerDialog } from './ServerDialog';
import { toast } from 'sonner';

interface Server {
  _id: string;
  codigo: string;
  nome: string;
  dns: string;
  logoUrl?: string;
  corPrimaria: string;
  donoId: {
    _id: string;
    nome: string;
    email: string;
  };
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ServerList() {
  const { data: session } = useSession();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);

  const isAdmin = session?.user?.role === 'admin';

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/servers');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar servidores');
      }

      const data = await response.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error('Fetch servers error:', error);
      toast.error('Erro ao carregar servidores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleEdit = (server: Server) => {
    setEditingServer(server);
    setDialogOpen(true);
  };

  const handleDelete = async (serverId: string) => {
    if (!confirm('Tem certeza que deseja excluir este servidor?')) {
      return;
    }

    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir servidor');
      }

      toast.success('Servidor excluído com sucesso');
      fetchServers();
    } catch (error) {
      console.error('Delete server error:', error);
      toast.error('Erro ao excluir servidor');
    }
  };

  const handleServerSaved = () => {
    setDialogOpen(false);
    setEditingServer(null);
    fetchServers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servidores IPTV</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Gerencie todos os servidores do sistema' : 'Gerencie seus servidores IPTV'}
          </p>
        </div>
        
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Servidor
        </Button>
      </div>

      {/* Servers Grid */}
      {servers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum servidor encontrado
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {isAdmin 
                ? 'Comece criando o primeiro servidor IPTV do sistema.'
                : 'Comece criando seu primeiro servidor IPTV.'
              }
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Servidor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <Card key={server._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={server.logoUrl} alt={server.nome} />
                      <AvatarFallback 
                        className="text-white font-semibold"
                        style={{ backgroundColor: server.corPrimaria }}
                      >
                        {server.nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{server.nome}</CardTitle>
                      <CardDescription>
                        Código: {server.codigo}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(server)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(server._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={server.ativo ? 'default' : 'destructive'}>
                    {server.ativo ? 'Ativo' : 'Pendente'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">DNS:</span>
                  <span className="text-sm font-mono truncate max-w-32">
                    {server.dns}
                  </span>
                </div>
                
                {isAdmin && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dono:</span>
                    <span className="text-sm truncate max-w-32">
                      {server.donoId.nome}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Criado em:</span>
                  <span className="text-sm">
                    {new Date(server.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Server Dialog */}
      <ServerDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingServer(null);
        }}
        server={editingServer}
        onServerSaved={handleServerSaved}
      />
    </div>
  );
}