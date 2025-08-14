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
  CreditCard, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  RefreshCw,
  Infinity
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
import { PlanDialog } from '@/components/plans/PlanDialog';
import { toast } from 'sonner';

interface Plan {
  _id: string;
  nome: string;
  limiteListasAtivas: number | null;
  tipoCobranca: 'fixo' | 'por_lista';
  valor: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPlansPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (session && session.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/plans');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar planos');
      }

      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Fetch plans error:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchPlans();
    }
  }, [session]);

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      const response = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao excluir plano');

      toast.success('Plano excluído com sucesso');
      fetchPlans();
    } catch (error) {
      console.error('Delete plan error:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  const handlePlanSaved = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    fetchPlans();
  };

  if (session?.user?.role !== 'admin') return null;

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
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Planos</h1>
            <p className="text-gray-600 mt-1">
              Configure os planos de cobrança para os servidores IPTV
            </p>
          </div>
          
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Planos Cadastrados
            </CardTitle>
            <CardDescription>
              Lista de todos os planos de cobrança disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum plano encontrado
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Comece criando o primeiro plano de cobrança.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Plano
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Limite de Listas</TableHead>
                    <TableHead>Tipo de Cobrança</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan._id}>
                      <TableCell className="font-medium">{plan.nome}</TableCell>
                      <TableCell>
                        <span>{plan.limiteListasAtivas ? plan.limiteListasAtivas : 'Ilimitado'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.tipoCobranca === 'fixo' ? 'default' : 'secondary'}>
                          {plan.tipoCobranca === 'fixo' ? 'Valor Fixo' : 'Por Lista'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span>R$ {plan.valor.toFixed(2).replace('.', ',')}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.ativo ? 'default' : 'secondary'}>
                          {plan.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(plan)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(plan._id)}
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

        {/* Plan Dialog */}
        <PlanDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingPlan(null);
          }}
          plan={editingPlan}
          onPlanSaved={handlePlanSaved}
        />
      </div>
    </DashboardLayout>
  );
}
