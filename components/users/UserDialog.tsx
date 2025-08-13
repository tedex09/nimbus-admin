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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const userSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('Email deve ser válido')
    .toLowerCase(),
  senha: z.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .optional(),
  ativo: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
  onUserSaved: () => void;
}

export function UserDialog({ open, onOpenChange, user, onUserSaved }: UserDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const ativo = watch('ativo');

  useEffect(() => {
    if (user) {
      reset({
        nome: user.nome,
        email: user.email,
        senha: '',
        ativo: user.ativo,
      });
    } else {
      reset({
        nome: '',
        email: '',
        senha: '',
        ativo: true,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);

    try {
      // Se estiver editando e senha estiver vazia, não enviar senha
      const submitData = { ...data };
      if (isEditing && !submitData.senha) {
        delete submitData.senha;
      }

      const url = isEditing ? `/api/users/${user._id}` : '/api/users';
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
        throw new Error(errorData.error || 'Erro ao salvar usuário');
      }

      toast.success(isEditing ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso');
      onUserSaved();
    } catch (error: any) {
      console.error('Save user error:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Altere as informações do dono de servidor'
              : 'Preencha as informações do novo dono de servidor'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="João Silva"
            />
            {errors.nome && (
              <p className="text-sm text-red-600">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="joao@exemplo.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">
              {isEditing ? 'Nova Senha (deixe vazio para manter atual)' : 'Senha'}
            </Label>
            <Input
              id="senha"
              type="password"
              {...register('senha')}
              placeholder={isEditing ? 'Digite nova senha...' : 'Digite a senha...'}
            />
            {errors.senha && (
              <p className="text-sm text-red-600">{errors.senha.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
            <Label htmlFor="ativo">Usuário ativo</Label>
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