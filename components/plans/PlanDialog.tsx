'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const planSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  limiteListasAtivas: z.string().optional(),
  unlimited: z.boolean().default(false),
  tipoCobranca: z.enum(['fixo', 'por_lista']),
  valor: z.number()
    .min(0, 'Valor deve ser maior ou igual a zero'),
  durabilidadeMeses: z.number()
    .min(1, 'Durabilidade deve ser no mínimo 1 mês')
    .max(12, 'Durabilidade deve ser no máximo 12 meses'),
  ativo: z.boolean().default(true),
});

type PlanFormData = z.infer<typeof planSchema>;

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: any;
  onPlanSaved: () => void;
}

export function PlanDialog({ open, onOpenChange, plan, onPlanSaved }: PlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!plan;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  const tipoCobranca = watch('tipoCobranca');
  const ativo = watch('ativo');
  const durabilidadeMeses = watch('durabilidadeMeses');
  const unlimited = watch('unlimited');

  useEffect(() => {
    if (plan) {
      reset({
        nome: plan.nome,
        limiteListasAtivas: plan.limiteListasAtivas?.toString() || '',
        unlimited: plan.unlimited || false,
        tipoCobranca: plan.tipoCobranca,
        valor: plan.valor,
        durabilidadeMeses: plan.durabilidadeMeses || 1,
        ativo: plan.ativo,
      });
    } else {
      reset({
        nome: '',
        limiteListasAtivas: '',
        unlimited: false,
        tipoCobranca: 'fixo',
        valor: 0,
        durabilidadeMeses: 1,
        ativo: true,
      });
    }
  }, [plan, reset]);

  const onSubmit = async (data: PlanFormData) => {
    setLoading(true);

    try {
      const submitData = {
        ...data,
        limiteListasAtivas: data.unlimited || data.limiteListasAtivas === '' ? null : parseInt(data.limiteListasAtivas!),
      };

      const url = isEditing ? `/api/plans/${plan._id}` : '/api/plans';
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
        throw new Error(errorData.error || 'Erro ao salvar plano');
      }

      toast.success(isEditing ? 'Plano atualizado com sucesso' : 'Plano criado com sucesso');
      onPlanSaved();
    } catch (error: any) {
      console.error('Save plan error:', error);
      toast.error(error.message || 'Erro ao salvar plano');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Plano' : 'Novo Plano'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Altere as informações do plano de cobrança'
              : 'Preencha as informações do novo plano de cobrança'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Plano</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Plano Básico"
            />
            {errors.nome && (
              <p className="text-sm text-red-600">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
            <Select value={tipoCobranca} onValueChange={(value) => setValue('tipoCobranca', value as 'fixo' | 'por_lista')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de cobrança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixo">Valor Fixo por Período</SelectItem>
                <SelectItem value="por_lista">Valor por Lista Ativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durabilidadeMeses">Durabilidade do Plano (meses)</Label>
            <Select value={durabilidadeMeses?.toString()} onValueChange={(value) => setValue('durabilidadeMeses', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a durabilidade" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => (
                  <SelectItem key={mes} value={mes.toString()}>
                    {mes} {mes === 1 ? 'mês' : 'meses'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.durabilidadeMeses && (
              <p className="text-sm text-red-600">{errors.durabilidadeMeses.message}</p>
            )}
          </div>

          {tipoCobranca === 'por_lista' && (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="unlimited"
                  checked={unlimited}
                  onCheckedChange={(checked) => setValue('unlimited', checked)}
                />
                <Label htmlFor="unlimited">Listas ilimitadas</Label>
              </div>

              {!unlimited && (
                <div className="space-y-2">
                  <Label htmlFor="limiteListasAtivas">Limite de Listas Ativas</Label>
                  <Input
                    id="limiteListasAtivas"
                    type="number"
                    {...register('limiteListasAtivas')}
                    placeholder="Digite o limite de listas"
                    min="1"
                  />
                  {errors.limiteListasAtivas && (
                    <p className="text-sm text-red-600">{errors.limiteListasAtivas.message}</p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="valor">
              Valor (R$) - {tipoCobranca === 'fixo' ? `por ${durabilidadeMeses || 1} mês(es)` : 'por lista ativa'}
            </Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              {...register('valor', { valueAsNumber: true })}
              placeholder="0,00"
            />
            {errors.valor && (
              <p className="text-sm text-red-600">{errors.valor.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
            <Label htmlFor="ativo">Plano ativo</Label>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Atualizar' : 'Criar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}