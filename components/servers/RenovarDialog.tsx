'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const renovarSchema = z.object({
  meses: z.number().min(1, 'Mínimo 1 mês').max(12, 'Máximo 12 meses'),
});

type RenovarFormData = z.infer<typeof renovarSchema>;

interface RenovarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server?: any;
  onSuccess: () => void;
}

export function RenovarDialog({ open, onOpenChange, server, onSuccess }: RenovarDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<RenovarFormData>({
    resolver: zodResolver(renovarSchema),
    defaultValues: {
      meses: 1,
    },
  });

  const meses = watch('meses');

  const onSubmit = async (data: RenovarFormData) => {
    if (!server) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/servers/${server._id}/renovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao renovar servidor');
      }

      toast.success(`Servidor renovado por ${data.meses} mês(es) com sucesso`);
      onSuccess();
    } catch (error: any) {
      console.error('Renovar servidor error:', error);
      toast.error(error.message || 'Erro ao renovar servidor');
    } finally {
      setLoading(false);
    }
  };

  const calculateNewExpirationDate = () => {
    if (!server || !meses) return null;
    
    const currentExpiration = new Date(server.dataVencimento);
    const newExpiration = new Date(currentExpiration);
    newExpiration.setMonth(newExpiration.getMonth() + meses);
    
    return newExpiration;
  };

  const newExpirationDate = calculateNewExpirationDate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            <RotateCcw className="h-5 w-5 mr-2 text-blue-600" />
            Renovar Servidor
          </DialogTitle>
          <DialogDescription>
            Estenda o período de validade do servidor {server?.nome}
          </DialogDescription>
        </DialogHeader>

        {server && (
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Servidor:</span>
                    <Badge variant="outline" className="bg-white">
                      {server.codigo} - {server.nome}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Vencimento atual:</span>
                    <span className="text-sm font-semibold text-red-600">
                      {new Date(server.dataVencimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge variant={server.status === 'vencido' ? 'destructive' : 'secondary'}>
                      {server.status === 'ativo' ? 'Ativo' : 
                       server.status === 'vencido' ? 'Vencido' : 
                       server.status === 'pendente' ? 'Pendente' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meses" className="text-sm font-semibold text-gray-700">
                  Período de Renovação
                </Label>
                <Select 
                  value={meses.toString()} 
                  onValueChange={(value) => setValue('meses', parseInt(value))}
                >
                  <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => (
                      <SelectItem key={mes} value={mes.toString()}>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{mes} {mes === 1 ? 'mês' : 'meses'}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.meses && (
                  <p className="text-sm text-red-600">{errors.meses.message}</p>
                )}
              </div>

              {newExpirationDate && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Nova data de vencimento:</span>
                      <span className="text-sm font-bold text-green-700">
                        {newExpirationDate.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Renovando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Renovar Servidor
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}