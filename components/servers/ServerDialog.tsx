'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const serverSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  dns: z.string()
    .url('DNS deve ser uma URL válida'),
  donoId: z.string().optional(),
  planoId: z.string().min(1, 'Plano é obrigatório'),
  status: z.enum(['ativo', 'pendente', 'inativo', 'vencido']).optional(),
});

type ServerFormData = z.infer<typeof serverSchema>;

interface ServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server?: any;
  onServerSaved: () => void;
}

export function ServerDialog({ open, onOpenChange, server, onServerSaved }: ServerDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const isEditing = !!server;
  const isAdmin = session?.user?.role === 'admin';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServerFormData>({
    resolver: zodResolver(serverSchema),
  });

  const donoId = watch('donoId');
  const planoId = watch('planoId');
  const status = watch('status');

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans?.filter((plan: any) => plan.ativo) || []);
      }
    } catch (error) {
      console.error('Fetch plans error:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPlans();
      if (isAdmin) {
        fetchUsers();
      }
    }
  }, [open, isAdmin]);

  useEffect(() => {
    if (planoId) {
      const plan = plans.find(p => p._id === planoId);
      setSelectedPlan(plan);
    } else {
      setSelectedPlan(null);
    }
  }, [planoId, plans]);

  useEffect(() => {
    if (server) {
      reset({
        nome: server.nome,
        dns: server.dns,
        donoId: server.donoId?._id || '',
        planoId: server.planoId?._id || '',
        status: server.status,
      });
    } else {
      reset({
        nome: '',
        dns: '',
        donoId: '',
        planoId: '',
        status: 'pendente',
      });
    }
  }, [server, reset]);

  const onSubmit = async (data: ServerFormData) => {
    setLoading(true);

    try {
      // Se não for admin, não enviar donoId e status
      const submitData = { ...data };
      if (!isAdmin) {
        delete submitData.donoId;
        delete submitData.status;
      }

      const url = isEditing ? `/api/servers/${server._id}` : '/api/servers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar servidor');
      }

      toast.success(isEditing ? 'Servidor atualizado com sucesso' : 'Servidor criado com sucesso');
      onServerSaved();
    } catch (error: any) {
      console.error('Save server error:', error);
      toast.error(error.message || 'Erro ao salvar servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isEditing ? 'Editar Servidor' : 'Novo Servidor'}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              {isEditing 
                ? 'Altere as informações do servidor IPTV'
                : 'Preencha as informações do novo servidor IPTV'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {isEditing && (
              <motion.div 
                className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-2 text-blue-800">
                  <span className="font-semibold">Código:</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    {server.codigo}
                  </Badge>
                  <span className="text-sm text-blue-600">(gerado automaticamente)</span>
                </div>
              </motion.div>
            )}

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label htmlFor="nome" className="text-sm font-semibold text-gray-700">
                Nome do Servidor
              </Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Meu Servidor IPTV"
                className="h-12 border-2 focus:border-blue-500 transition-colors"
              />
              {errors.nome && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600"
                >
                  {errors.nome.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="dns" className="text-sm font-semibold text-gray-700">
                DNS/URL do Servidor
              </Label>
              <Input
                id="dns"
                {...register('dns')}
                placeholder="http://meuservidor.com"
                className="h-12 border-2 focus:border-blue-500 transition-colors"
              />
              {errors.dns && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600"
                >
                  {errors.dns.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="planoId" className="text-sm font-semibold text-gray-700">
                Plano de Cobrança *
              </Label>
              <Select value={planoId} onValueChange={(value) => setValue('planoId', value)}>
                <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                  <SelectValue placeholder="Selecione o plano de cobrança" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>{plan.nome}</span>
                        <Badge variant="outline" className="ml-2">
                          R$ {plan.valor.toFixed(2).replace('.', ',')}
                        </Badge>
                        <Badge variant="secondary" className="ml-1">
                          {plan.durabilidadeMeses}m
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.planoId && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600"
                >
                  {errors.planoId.message}
                </motion.p>
              )}
            </motion.div>

            <AnimatePresence>
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Detalhes do Plano Selecionado
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          {selectedPlan.unlimited || selectedPlan.limiteListasAtivas === 0 ? (
                            <span className="text-green-700 font-medium">Listas Ilimitadas</span>
                          ) : (
                            <>
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-700 font-medium">
                                {selectedPlan.limiteListasAtivas} listas/mês
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-700 font-medium">
                            {selectedPlan.durabilidadeMeses} mês(es)
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tipo:</span>
                          <span className="ml-2 font-medium text-gray-800">
                            {selectedPlan.tipoCobranca === 'fixo' ? 'Valor Fixo' : 'Por Lista'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Valor:</span>
                          <span className="ml-2 font-bold text-green-600">
                            R$ {selectedPlan.valor.toFixed(2).replace('.', ',')}
                            {selectedPlan.tipoCobranca === 'fixo' ? `/período` : '/lista'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {isAdmin && (
              <>
                {isEditing && (
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                      Status do Servidor
                    </Label>
                    <Select value={status} onValueChange={(value) => setValue('status', value as any)}>
                      <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

                {!isEditing && (
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Label htmlFor="donoId" className="text-sm font-semibold text-gray-700">
                      Dono do Servidor
                    </Label>
                    <Select value={donoId} onValueChange={(value) => setValue('donoId', value)}>
                      <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                        <SelectValue placeholder="Selecione o dono do servidor" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>{user.nome}</span>
                              <span className="text-gray-500">({user.email})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Deixe vazio para atribuir a você mesmo
                    </p>
                  </motion.div>
                )}
              </>
            )}

            <DialogFooter className="gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-12 px-6"
              >
                Cancelar
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    isEditing ? 'Atualizar Servidor' : 'Criar Servidor'
                  )}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}