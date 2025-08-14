'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Palette, Menu, Settings, Eye, Tv, Film, Monitor } from 'lucide-react';
import { toast } from 'sonner';

const layoutSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
    background: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
  }),
  logoUrl: z.string().url('URL inválida'),
  backgroundImageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  menuSections: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Nome obrigatório').max(50),
    icon: z.string().min(1, 'Ícone obrigatório'),
    type: z.enum(['tv', 'movies', 'series']),
    enabled: z.boolean(),
    order: z.number(),
  })).length(3, 'Deve ter exatamente 3 seções'),
  settings: z.object({
    showSearch: z.boolean(),
    showExpiration: z.boolean(),
    showTime: z.boolean(),
    showLogo: z.boolean(),
    defaultLanguage: z.enum(['pt', 'en', 'es']),
    menuPosition: z.enum(['top', 'left', 'bottom']),
  }),
});

type LayoutFormData = z.infer<typeof layoutSchema>;

interface LayoutEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  serverName: string;
}

const iconOptions = [
  { value: 'tv', label: 'TV', icon: Tv },
  { value: 'movies', label: 'Filmes', icon: Film },
  { value: 'series', label: 'Séries', icon: Monitor },
];

const defaultMenuSections = [
  { id: 'tv', name: 'TV', icon: 'tv', type: 'tv' as const, enabled: true, order: 0 },
  { id: 'movies', name: 'Filmes', icon: 'movies', type: 'movies' as const, enabled: true, order: 1 },
  { id: 'series', name: 'Séries', icon: 'series', type: 'series' as const, enabled: true, order: 2 },
];

export function LayoutEditor({ open, onOpenChange, serverId, serverName }: LayoutEditorProps) {
  const [loading, setLoading] = useState(false);
  const [loadingLayout, setLoadingLayout] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<LayoutFormData>({
    resolver: zodResolver(layoutSchema),
    defaultValues: {
      colors: { primary: '#3B82F6', secondary: '#6B7280', background: '#FFFFFF' },
      logoUrl: '',
      backgroundImageUrl: '',
      menuSections: defaultMenuSections,
      settings: { 
        showSearch: true, 
        showExpiration: true, 
        showTime: true, 
        showLogo: true, 
        defaultLanguage: 'pt',
        menuPosition: 'top'
      },
    },
  });

  const { fields, move } = useFieldArray({ control, name: 'menuSections' });

  const colors = watch('colors');
  const settings = watch('settings');

  const fetchLayout = async () => {
    if (!serverId) return;
    try {
      setLoadingLayout(true);
      const res = await fetch(`/api/layout/${serverId}`);
      if (res.ok) {
        const layoutData = await res.json();
        reset({
          colors: {
            primary: layoutData.colors?.primary || '#3B82F6',
            secondary: layoutData.colors?.secondary || '#6B7280',
            background: layoutData.colors?.background || '#FFFFFF',
          },
          logoUrl: layoutData.logoUrl || '',
          backgroundImageUrl: layoutData.backgroundImageUrl || '',
          menuSections: layoutData.menuSections || defaultMenuSections,
          settings: {
            showSearch: layoutData.settings?.showSearch ?? true,
            showExpiration: layoutData.settings?.showExpiration ?? true,
            showTime: layoutData.settings?.showTime ?? true,
            showLogo: layoutData.settings?.showLogo ?? true,
            defaultLanguage: layoutData.settings?.defaultLanguage || 'pt',
            menuPosition: layoutData.settings?.menuPosition || 'top',
          },
        });
      }
    } catch (err) {
      console.error('Fetch layout error:', err);
    } finally {
      setLoadingLayout(false);
    }
  };

  useEffect(() => {
    if (open && serverId) fetchLayout();
  }, [open, serverId]);

  const onSubmit = async (data: LayoutFormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/layout/${serverId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao salvar layout');
      toast.success('Layout salvo com sucesso');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar layout');
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => iconOptions.find(opt => opt.value === iconName)?.icon || Tv;

  const moveSection = (from: number, to: number) => {
    move(from, to);
    watch('menuSections').forEach((_, idx) => {
      setValue(`menuSections.${idx}.order`, idx, { shouldDirty: true });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold">
            <Palette className="h-6 w-6 mr-2 text-blue-600" /> Editor de Layout - {serverName}
          </DialogTitle>
          <DialogDescription>Configure a aparência e estrutura do seu servidor IPTV</DialogDescription>
        </DialogHeader>

        {loadingLayout ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="colors">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors">Cores</TabsTrigger>
                <TabsTrigger value="branding">Marca</TabsTrigger>
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>

              {/* CORES */}
              <TabsContent value="colors">
                <Card>
                  <CardHeader><CardTitle>Esquema de Cores</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Cor Primária</Label>
                      <div className="flex space-x-2">
                        <Input type="color" {...register('colors.primary')} className="w-16 h-10" />
                        <Input {...register('colors.primary')} placeholder="#3B82F6" />
                      </div>
                      {errors.colors?.primary && (
                        <p className="text-sm text-red-600">{errors.colors.primary.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Cor Secundária</Label>
                      <div className="flex space-x-2">
                        <Input type="color" {...register('colors.secondary')} className="w-16 h-10" />
                        <Input {...register('colors.secondary')} placeholder="#6B7280" />
                      </div>
                      {errors.colors?.secondary && (
                        <p className="text-sm text-red-600">{errors.colors.secondary.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Cor de Fundo</Label>
                      <div className="flex space-x-2">
                        <Input type="color" {...register('colors.background')} className="w-16 h-10" />
                        <Input {...register('colors.background')} placeholder="#FFFFFF" />
                      </div>
                      {errors.colors?.background && (
                        <p className="text-sm text-red-600">{errors.colors.background.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MARCA */}
              <TabsContent value="branding">
                <Card>
                  <CardHeader><CardTitle>Identidade Visual</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL do Logo</Label>
                      <Input {...register('logoUrl')} placeholder="https://exemplo.com/logo.png" />
                      {errors.logoUrl && (
                        <p className="text-sm text-red-600">{errors.logoUrl.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Imagem de Fundo (opcional)</Label>
                      <Input {...register('backgroundImageUrl')} placeholder="https://exemplo.com/bg.jpg" />
                      {errors.backgroundImageUrl && (
                        <p className="text-sm text-red-600">{errors.backgroundImageUrl.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MENU */}
              <TabsContent value="menu">
                <Card>
                  <CardHeader><CardTitle>Seções do Menu</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <AnimatePresence>
                      {fields.map((field, idx) => {
                        const Icon = getIconComponent(field.icon);
                        return (
                          <motion.div key={field.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex flex-col gap-1">
                              <button type="button" onClick={() => moveSection(idx, idx - 1)} disabled={idx === 0} className="text-xs px-2 py-1 bg-gray-100 rounded disabled:opacity-50">↑</button>
                              <button type="button" onClick={() => moveSection(idx, idx + 1)} disabled={idx === fields.length - 1} className="text-xs px-2 py-1 bg-gray-100 rounded disabled:opacity-50">↓</button>
                            </div>
                            <Icon className="h-5 w-5" />
                            <Input {...register(`menuSections.${idx}.name`)} className="flex-1" />
                            <Controller
                              control={control}
                              name={`menuSections.${idx}.enabled`}
                              render={({ field }) => (
                                <Switch checked={field.value} onCheckedChange={(val) => field.onChange(val)} />
                              )}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CONFIGURAÇÕES */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader><CardTitle>Configurações</CardTitle></CardHeader>
                  <CardContent className="grid gap-4">
                    {[
                      { key: 'showSearch', label: 'Exibir Busca' },
                      { key: 'showExpiration', label: 'Exibir Data de Expiração' },
                      { key: 'showTime', label: 'Exibir Hora' },
                      { key: 'showLogo', label: 'Exibir Logo' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label>{label}</Label>
                        <Controller
                          control={control}
                          name={`settings.${key}` as any}
                          render={({ field }) => (
                            <Switch checked={field.value} onCheckedChange={(val) => field.onChange(val)} />
                          )}
                        />
                      </div>
                    ))}
                    
                    <div className="space-y-2">
                      <Label>Posicionamento do Menu</Label>
                      <Controller
                        control={control}
                        name="settings.menuPosition"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Superior</SelectItem>
                              <SelectItem value="left">Lateral Esquerda</SelectItem>
                              <SelectItem value="bottom">Inferior</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Idioma Padrão</Label>
                      <Controller
                        control={control}
                        name="settings.defaultLanguage"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pt">Português</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                Salvar Layout
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}