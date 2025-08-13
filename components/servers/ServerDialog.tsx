'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const serverSchema = z.object({
  codigo: z.string()
    .min(4, 'Código deve ter no mínimo 4 caracteres')
    .max(10, 'Código deve ter no máximo 10 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Código deve conter apenas letras e números'),
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  dns: z.string()
    .url('DNS deve ser uma URL válida'),
  logoUrl: z.string().url('Logo URL deve ser uma URL válida').optional().or(z.literal('')),
  corPrimaria: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
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
  const isEditing = !!server;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServerFormData>({
    resolver: zodResolver(serverSchema),
  });

  useEffect(() => {
    if (server) {
      reset({
        codigo: server.codigo,
        nome: server.nome,
        dns: server.dns,
        logoUrl: server.logoUrl || '',
        corPrimaria: server.corPrimaria,
      });
    } else {
      reset({
        codigo: '',
        nome: '',
        dns: '',
        logoUrl: '',
        corPrimaria: '#3B82F6',
      });
    }
  }, [server, reset]);

  const onSubmit = async (data: ServerFormData) => {
    setLoading(true);

    try {
      const url = isEditing ? `/api/servers/${server._id}` : '/api/servers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Servidor' : 'Novo Servidor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Altere as informações do servidor IPTV'
              : 'Preencha as informações do novo servidor IPTV'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código do Servidor</Label>
            <Input
              id="codigo"
              {...register('codigo')}
              placeholder="SERV001"
              disabled={isEditing} // Código não pode ser alterado após criação
              className="uppercase"
            />
            {errors.codigo && (
              <p className="text-sm text-red-600">{errors.codigo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Servidor</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Meu Servidor IPTV"
            />
            {errors.nome && (
              <p className="text-sm text-red-600">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dns">DNS/URL do Servidor</Label>
            <Input
              id="dns"
              {...register('dns')}
              placeholder="http://meuservidor.com"
            />
            {errors.dns && (
              <p className="text-sm text-red-600">{errors.dns.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL (opcional)</Label>
            <Input
              id="logoUrl"
              {...register('logoUrl')}
              placeholder="https://exemplo.com/logo.png"
            />
            {errors.logoUrl && (
              <p className="text-sm text-red-600">{errors.logoUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="corPrimaria">Cor Primária</Label>
            <div className="flex space-x-2">
              <Input
                id="corPrimaria"
                type="color"
                {...register('corPrimaria')}
                className="w-16 h-10 p-1 rounded"
              />
              <Input
                {...register('corPrimaria')}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
            {errors.corPrimaria && (
              <p className="text-sm text-red-600">{errors.corPrimaria.message}</p>
            )}
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