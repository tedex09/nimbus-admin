'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Server as ServerIcon, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  RefreshCw,
  Users,
  CreditCard,
  Activity,
  Palette
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ServerDialog } from './ServerDialog';
import { LayoutEditor } from './LayoutEditor';
import { toast } from 'sonner';

interface Plano {
  _id: string;
  nome: string;
  limiteListasAtivas: number | null;
  tipoCobranca: 'fixo' | 'por_lista';
  valor: number;
}

interface Dono {
  _id: string;
  nome: string;
  email: string;
}

interface ServerData {
  _id: string;
  codigo: string;
  nome: string;
  dns: string;
  logoUrl?: string;
  corPrimaria: string;
  donoId: Dono;
  planoId?: Plano;
  status: 'ativo' | 'pendente' | 'inativo';
  activeLists?: number;
  createdAt: string;
  updatedAt: string;
}

export function ServerList() {
  const { data: session } = useSession();
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);
  const [editingLayoutServer, setEditingLayoutServer] = useState<ServerData | null>(null);

  const isAdmin = session?.user?.role === 'admin';

  const fetchServers = async () => {
    try {
      setLoading(true);
      const [serversResponse, activeListsResponse] = await Promise.all([
        fetch('/api/servers'),
        fetch('/api/monthly-active-lists')
      ]);

      if (!serversResponse.ok) throw new Error('Erro ao carregar servidores');
      const serversData = await serversResponse.json();

      let activeListsData = { monthlyLists: [] };
      if (activeListsResponse.ok) {
        activeListsData = await activeListsResponse.json();
      }

      const activeListsCount: Record<string, number> = {};
      activeListsData.monthlyLists?.forEach((list: any) => {
        activeListsCount[list.serverCode] = (activeListsCount[list.serverCode] || 0) + 1;
      });

      const serversWithActiveLists: ServerData[] = (serversData.servers || []).map((server: ServerData) => ({
        ...server,
        activeLists: activeListsCount[server.codigo] || 0,
      }));

      setServers(serversWithActiveLists);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar servidores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleEdit = (server: ServerData) => {
    setEditingServer(server);
    setDialogOpen(true);
  };

  const handleEditLayout = (server: ServerData) => {
    setEditingLayoutServer(server);
    setLayoutEditorOpen(true);
  };

  const handleDelete = async (serverId: string) => {
    if (!confirm('Tem certeza que deseja excluir este servidor?')) return;
    try {
      const response = await fetch(`/api/servers/${serverId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao excluir servidor');
      toast.success('Servidor excluído com sucesso');
      fetchServers();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir servidor');
    }
  };

  const handleServerSaved = () => {
    setDialogOpen(false);
    setEditingServer(null);
    fetchServers();
  };

  const getStatusColor = (status: ServerData['status']) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inativo': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: ServerData['status']) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'pendente': return 'Pendente';
      case 'inativo': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  const calculateUsagePercentage = (activeLists: number, limit: number | null) => {
    if (limit === null) return 0;
    return Math.min((activeLists / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <RefreshCw className="h-8 w-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Servidores IPTV
          </h1>
          <p className="text-lg text-gray-600">
            {isAdmin ? 'Gerencie todos os servidores do sistema' : 'Gerencie seus servidores IPTV'}
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={() => setDialogOpen(true)}
            size="lg"
            className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Servidor
          </Button>
        </motion.div>
      </motion.div>

      {/* Servers Grid */}
      {servers.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
                <ServerIcon className="h-16 w-16 text-gray-400 mb-6" />
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Nenhum servidor encontrado
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                {isAdmin ? 'Comece criando o primeiro servidor IPTV do sistema.' : 'Comece criando seu primeiro servidor IPTV.'}
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => setDialogOpen(true)} size="lg" className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Servidor
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {servers.map((server, index) => (
              <motion.div
                key={server._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 group-hover:from-blue-50 group-hover:to-purple-50">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                          <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                            <AvatarImage src={server.logoUrl} alt={server.nome} />
                            <AvatarFallback className="text-white font-bold text-lg" style={{ backgroundColor: server.corPrimaria }}>
                              {server.nome.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
                            {server.nome}
                          </CardTitle>
                          <CardDescription className="text-sm font-medium text-gray-600">
                            Código: {server.codigo}
                          </CardDescription>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(server)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditLayout(server)}>
                            <Palette className="h-4 w-4 mr-2" />
                            Editar Layout
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => handleDelete(server._id)} className="text-red-600 focus:text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <Badge className={`${getStatusColor(server.status)} border font-medium`}>
                        {getStatusLabel(server.status)}
                      </Badge>
                    </div>

                    {server.planoId && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Plano:</span>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">{server.planoId.nome}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Listas Ativas:</span>
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-bold text-green-700">
                                {server.activeLists || 0}
                                <span className="text-gray-500">/{server.planoId.limiteListasAtivas !== null ? server.planoId.limiteListasAtivas : '∞'}</span>
                              </span>
                            </div>
                          </div>

                          {server.planoId.limiteListasAtivas !== null && (
                            <div className="space-y-1">
                              <Progress value={calculateUsagePercentage(server.activeLists || 0, server.planoId.limiteListasAtivas)} className="h-2" />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Uso atual</span>
                                <span>{calculateUsagePercentage(server.activeLists || 0, server.planoId.limiteListasAtivas).toFixed(1)}%</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                          <span className="text-sm font-medium text-gray-700">Valor:</span>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-700">R$ {(server.planoId?.valor ?? 0).toFixed(2).replace('.', ',')}</div>
                            <div className="text-xs text-gray-600">{server.planoId.tipoCobranca === 'fixo' ? 'por mês' : 'por lista ativa'}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">DNS:</span>
                      <span className="text-sm font-mono text-gray-800 truncate max-w-[10rem]">{server.dns}</span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Dono:</span>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[8rem]">{server.donoId.nome}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Criado em:</span>
                      <span className="text-sm text-gray-800">{new Date(server.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ServerDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingServer(null); }}
        server={editingServer}
        onServerSaved={handleServerSaved}
      />

      <LayoutEditor
        open={layoutEditorOpen}
        onOpenChange={(open) => { 
          setLayoutEditorOpen(open); 
          if (!open) setEditingLayoutServer(null); 
        }}
        serverId={editingLayoutServer?._id || ''}
        serverName={editingLayoutServer?.nome || ''}
      />
    </div>
  );
}
