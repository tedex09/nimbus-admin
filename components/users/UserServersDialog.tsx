'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Server, 
  RefreshCw,
  Users,
  Infinity
} from 'lucide-react';
import { toast } from 'sonner';

interface UserServersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

export function UserServersDialog({ open, onOpenChange, user }: UserServersDialogProps) {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserServers = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/servers');
      
      if (response.ok) {
        const data = await response.json();
        const userServers = data.servers?.filter((server: any) => 
          (server.donoId._id || server.donoId) === user._id
        ) || [];
        setServers(userServers);
      }
    } catch (error) {
      console.error('Fetch user servers error:', error);
      toast.error('Erro ao carregar servidores do usuário');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchUserServers();
    }
  }, [open, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'default';
      case 'pendente': return 'secondary';
      case 'inativo': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'pendente': return 'Pendente';
      case 'inativo': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Servidores de {user?.nome}
          </DialogTitle>
          <DialogDescription>
            Lista de todos os servidores pertencentes a este usuário
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Server className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum servidor encontrado
            </h3>
            <p className="text-gray-600 text-center">
              Este usuário ainda não possui servidores cadastrados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {servers.map((server) => (
              <div key={server._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                      <h4 className="font-medium">{server.nome}</h4>
                      <p className="text-sm text-gray-600">Código: {server.codigo}</p>
                    </div>
                  </div>
                  
                  <Badge variant={getStatusColor(server.status)}>
                    {getStatusLabel(server.status)}
                  </Badge>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">DNS:</span>
                    <p className="font-mono truncate">{server.dns}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Limite Mensal:</span>
                    <div className="flex items-center space-x-1">
                      {server.limiteMensal === null ? (
                        <>
                          <Infinity className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Ilimitado</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 text-gray-500" />
                          <span>{server.limiteMensal}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {server.planoId && (
                    <div>
                      <span className="text-gray-600">Plano:</span>
                      <p className="font-medium">{server.planoId.nome}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-600">Criado em:</span>
                    <p>{new Date(server.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}