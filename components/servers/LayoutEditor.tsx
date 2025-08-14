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
  Plus, 
  Trash2, 
  GripVertical,
  Eye,
  Home,
  Film,
  Tv,
  Radio,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

const layoutSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
    background: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
    text: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
  }),
  logoUrl: z.string().url('URL inválida'),
  backgroundImageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  menuSections: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Nome obrigatório').max(50),
    icon: z.string().min(1, 'Ícone obrigatório'),
    type: z.enum(['home', 'movies', 'series', 'live', 'custom']),
    enabled: z.boolean(),
    order: z.number(),
    categoryId: z.string().optional(),
  })).min(1, 'Pelo menos uma seção é obrigatória').max(10, 'Máximo 10 seções'),
  customization: z.object({
    showCategories: z.boolean(),
    showSearch: z.boolean(),
    showFavorites: z.boolean(),
    gridColumns: z.number().min(2).max(8),
    cardStyle: z.enum(['poster', 'banner', 'list']),
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
  { value: 'home', label: 'Casa', icon: Home },
  { value: 'movie', label: 'Filme', icon: Film },
  { value: 'tv', label: 'TV', icon: Tv },
  { value: 'broadcast', label: 'Transmissão', icon: Radio },
  { value: 'star', label: 'Estrela', icon: Star },
];

const defaultMenuSections = [
  { id: 'home', name: 'Início', icon: 'home', type: 'home' as const, enabled: true, order: 0 },
  { id: 'movies', name: 'Filmes', icon: 'movie', type: 'movies' as const, enabled: true, order: 1 },
  { id: 'series', name: 'Séries', icon: 'tv', type: 'series' as const, enabled: true, order: 2 },
  { id: 'live', name: 'TV ao Vivo', icon: 'broadcast', type: 'live' as const, enabled: true, order: 3 },
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
        background: '#111827',
        text: '#FFFFFF',
        accent: '#10B981',
      },
      logoUrl: '',
      backgroundImageUrl: '',
      menuSections: defaultMenuSections,
      customization: {
        showCategories: true,
        showSearch: true,
        showFavorites: true,
        gridColumns: 4,
        cardStyle: 'poster',
      },
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'menuSections',
  });

  const colors = watch('colors');
  const customization = watch('customization');

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
          customization: layoutData.customization,
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

  const addMenuSection = () => {
    const newSection = {
      id: `custom_${Date.now()}`,
      name: 'Nova Seção',
      icon: 'star',
      type: 'custom' as const,
      enabled: true,
      order: fields.length,
      categoryId: '',
    };
    append(newSection);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption?.icon || Star;
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
                    {Object.entries(colors).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label className="capitalize">
                          {key === 'primary' ? 'Primária' : 
                           key === 'secondary' ? 'Secundária' :
                           key === 'background' ? 'Fundo' :
                           key === 'text' ? 'Texto' : 'Destaque'}
                        </Label>
                        <div className="flex space-x-2">
                          <Input
                            type="color"
                            {...register(`colors.${key as keyof typeof colors}`)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            {...register(`colors.${key as keyof typeof colors}`)}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                        {errors.colors?.[key as keyof typeof colors] && (
                          <p className="text-sm text-red-600">
                            {errors.colors[key as keyof typeof colors]?.message}
                          </p>
                        )}
                      </div>
                    ))}
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
                        backgroundColor: colors.background,
                        borderColor: colors.primary,
                        color: colors.text 
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
                        style={{ backgroundColor: colors.accent }}
                      >
                        Botão Destaque
                      </div>
                      <p style={{ color: colors.text }}>
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Menu className="h-5 w-5 mr-2" />
                      Seções do Menu
                    </CardTitle>
                    <Button type="button" onClick={addMenuSection} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Seção
                    </Button>
                  </CardHeader>
                  <CardContent>
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
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            
                            <div className="flex items-center space-x-2">
                              <IconComponent className="h-4 w-4" />
                              <Badge variant="outline">{field.type}</Badge>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                              <Input
                                {...register(`menuSections.${index}.name`)}
                                placeholder="Nome da seção"
                                className="text-sm"
                              />
                              
                              <Select
                                value={field.icon}
                                onValueChange={(value) => setValue(`menuSections.${index}.icon`, value)}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {iconOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center space-x-2">
                                        <option.icon className="h-4 w-4" />
                                        <span>{option.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.enabled}
                                  onCheckedChange={(checked) => setValue(`menuSections.${index}.enabled`, checked)}
                                />
                                <span className="text-sm">Ativo</span>
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                        <Label>Mostrar Categorias</Label>
                        <Switch
                          checked={customization.showCategories}
                          onCheckedChange={(checked) => setValue('customization.showCategories', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Mostrar Busca</Label>
                        <Switch
                          checked={customization.showSearch}
                          onCheckedChange={(checked) => setValue('customization.showSearch', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Mostrar Favoritos</Label>
                        <Switch
                          checked={customization.showFavorites}
                          onCheckedChange={(checked) => setValue('customization.showFavorites', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Colunas da Grade</Label>
                        <Select
                          value={customization.gridColumns.toString()}
                          onValueChange={(value) => setValue('customization.gridColumns', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} colunas
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Estilo dos Cards</Label>
                        <Select
                          value={customization.cardStyle}
                          onValueChange={(value) => setValue('customization.cardStyle', value as 'poster' | 'banner' | 'list')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="poster">Poster</SelectItem>
                            <SelectItem value="banner">Banner</SelectItem>
                            <SelectItem value="list">Lista</SelectItem>
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