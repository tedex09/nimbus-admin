'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Palette, 
  Menu, 
  Settings, 
  GripVertical,
  Eye,
  Tv,
  Film,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';

const layoutSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
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
  { value: 'movie', label: 'Filme', icon: Film },
  { value: 'series', label: 'Séries', icon: Monitor },
];

const defaultMenuSections = [
  { id: 'tv', name: 'TV', icon: 'tv', type: 'tv' as const, enabled: true, order: 0 },
  { id: 'movies', name: 'Filmes', icon: 'movie', type: 'movies' as const, enabled: true, order: 1 },
  { id: 'series', name: 'Séries', icon: 'series', type: 'series' as const, enabled: true, order: 2 },
];

export function LayoutEditor({ open, onOpenChange, serverId, serverName }: LayoutEditorProps) {
  const [loading, setLoading] = useState(false);
  const [loadingLayout, setLoadingLayout] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<LayoutFormData>({
    resolver: zodResolver(layoutSchema),
    defaultValues: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
      },
      logoUrl: '',
      backgroundImageUrl: '',
      menuSections: defaultMenuSections,
      settings: {
        showSearch: true,
        showExpiration: true,
        showTime: true,
        showLogo: true,
        defaultLanguage: 'pt',
      },
    },
  });

  const { fields, move } = useFieldArray({
    control,
    name: 'menuSections',
  });

  const colors = watch('colors');
  const settings = watch('settings');

  const fetchLayout = async () => {
    if (!serverId) return;

    try {
      setLoadingLayout(true);
      const response = await fetch(`/api/layout/${serverId}`);
      
      if (response.ok) {
        const layoutData = await response.json();
        reset({
          colors: layoutData.colors,
          logoUrl: layoutData.logoUrl,
          backgroundImageUrl: layoutData.backgroundImageUrl || '',
          menuSections: layoutData.menuSections || defaultMenuSections,
          settings: layoutData.settings,
        });
      }
    } catch (error) {
      console.error('Fetch layout error:', error);
    } finally {
      setLoadingLayout(false);
    }
  };

  useEffect(() => {
    if (open && serverId) {
      fetchLayout();
    }
  }, [open, serverId]);

  const onSubmit = async (data: LayoutFormData) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/layout/${serverId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar layout');
      }

      toast.success('Layout salvo com sucesso');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save layout error:', error);
      toast.error(error.message || 'Erro ao salvar layout');
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption?.icon || Tv;
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    move(fromIndex, toIndex);
    // Atualizar ordem
    const sections = watch('menuSections');
    sections.forEach((section, index) => {
      setValue(`menuSections.${index}.order`, index);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold">
            <Palette className="h-6 w-6 mr-2 text-blue-600" />
            Editor de Layout - {serverName}
          </DialogTitle>
          <DialogDescription>
            Configure a aparência e estrutura do seu servidor IPTV
          </DialogDescription>
        </DialogHeader>

        {loadingLayout ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors">Cores</TabsTrigger>
                <TabsTrigger value="branding">Marca</TabsTrigger>
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Palette className="h-5 w-5 mr-2" />
                      Esquema de Cores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          {...register('colors.primary')}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          {...register('colors.primary')}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                      {errors.colors?.primary && (
                        <p className="text-sm text-red-600">
                          {errors.colors.primary.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          {...register('colors.secondary')}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          {...register('colors.secondary')}
                          placeholder="#6B7280"
                          className="flex-1"
                        />
                      </div>
                      {errors.colors?.secondary && (
                        <p className="text-sm text-red-600">
                          {errors.colors.secondary.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="h-5 w-5 mr-2" />
                      Pré-visualização
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="p-4 rounded-lg border-2"
                      style={{ 
                        backgroundColor: '#111827',
                        borderColor: colors.primary,
                        color: '#FFFFFF'
                      }}
                    >
                      <div 
                        className="inline-block px-3 py-1 rounded text-sm font-medium mb-2"
                        style={{ backgroundColor: colors.primary }}
                      >
                        Botão Primário
                      </div>
                      <div 
                        className="inline-block px-3 py-1 rounded text-sm font-medium ml-2 mb-2"
                        style={{ backgroundColor: colors.secondary }}
                      >
                        Botão Secundário
                      </div>
                      <p className="text-white">
                        Texto de exemplo com as cores selecionadas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="branding" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Identidade Visual</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">URL do Logo *</Label>
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
                      <Label htmlFor="backgroundImageUrl">URL da Imagem de Fundo (opcional)</Label>
                      <Input
                        id="backgroundImageUrl"
                        {...register('backgroundImageUrl')}
                        placeholder="https://exemplo.com/background.jpg"
                      />
                      {errors.backgroundImageUrl && (
                        <p className="text-sm text-red-600">{errors.backgroundImageUrl.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="menu" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Menu className="h-5 w-5 mr-2" />
                      Seções do Menu (TV, Filmes, Séries)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Você pode alterar o posicionamento e ativar/desativar as seções, mas não pode excluí-las.
                    </p>
                    <AnimatePresence>
                      {fields.map((field, index) => {
                        const IconComponent = getIconComponent(field.icon);
                        return (
                          <motion.div
                            key={field.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex items-center space-x-3 p-3 border rounded-lg mb-3"
                          >
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => index > 0 && moveSection(index, index - 1)}
                                disabled={index === 0}
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => index < fields.length - 1 && moveSection(index, index + 1)}
                                disabled={index === fields.length - 1}
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                              >
                                ↓
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <IconComponent className="h-4 w-4" />
                              <Badge variant="outline">{field.type}</Badge>
                            </div>

                            <div className="flex-1">
                              <Input
                                {...register(`menuSections.${index}.name`)}
                                placeholder="Nome da seção"
                                className="text-sm"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.enabled}
                                onCheckedChange={(checked) => setValue(`menuSections.${index}.enabled`, checked)}
                              />
                              <span className="text-sm">Ativo</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Configurações de Interface
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label>Mostrar Busca</Label>
                        <Switch
                          checked={settings.showSearch}
                          onCheckedChange={(checked) => setValue('settings.showSearch', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Mostrar Vencimento da Lista</Label>
                        <Switch
                          checked={settings.showExpiration}
                          onCheckedChange={(checked) => setValue('settings.showExpiration', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Mostrar Hora</Label>
                        <Switch
                          checked={settings.showTime}
                          onCheckedChange={(checked) => setValue('settings.showTime', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Mostrar Logomarca</Label>
                        <Switch
                          checked={settings.showLogo}
                          onCheckedChange={(checked) => setValue('settings.showLogo', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Idioma Padrão</Label>
                        <Select
                          value={settings.defaultLanguage}
                          onValueChange={(value) => setValue('settings.defaultLanguage', value as 'pt' | 'en' | 'es')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pt">Português</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-3">
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
                  'Salvar Layout'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}