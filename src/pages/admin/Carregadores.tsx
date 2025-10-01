import { useTranslation } from 'react-i18next';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Zap, 
  MapPin, 
  Edit, 
  Trash2,
  Battery,
  Activity,
  WrenchIcon
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const chargerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  location: z.string().min(1, 'Localização é obrigatória'),
  power: z.string().min(1, 'Potência é obrigatória'),
  connector_type: z.string().min(1, 'Tipo de conector é obrigatório'),
  status: z.enum(['available', 'in_use', 'maintenance', 'offline']),
  price_per_kwh: z.string().min(1, 'Preço é obrigatório'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type ChargerFormData = z.infer<typeof chargerSchema>;

type Charger = {
  id: string;
  name: string;
  location: string;
  power: number;
  connector_type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  price_per_kwh: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

const Carregadores = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCharger, setEditingCharger] = useState<Charger | null>(null);
  const [deletingChargerId, setDeletingChargerId] = useState<string | null>(null);

  const form = useForm<ChargerFormData>({
    resolver: zodResolver(chargerSchema),
    defaultValues: {
      name: '',
      location: '',
      power: '',
      connector_type: '',
      status: 'available',
      price_per_kwh: '',
      latitude: '',
      longitude: '',
    },
  });

  const { data: chargers = [], isLoading } = useQuery({
    queryKey: ['chargers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chargers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Charger[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChargerFormData) => {
      const { error } = await supabase.from('chargers').insert({
        name: data.name,
        location: data.location,
        power: parseFloat(data.power),
        connector_type: data.connector_type,
        status: data.status,
        price_per_kwh: parseFloat(data.price_per_kwh),
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargers'] });
      toast({
        title: t('common.success'),
        description: t('admin.chargerAdded'),
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: 'Erro ao adicionar carregador',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ChargerFormData) => {
      if (!editingCharger) return;
      const { error } = await supabase
        .from('chargers')
        .update({
          name: data.name,
          location: data.location,
          power: parseFloat(data.power),
          connector_type: data.connector_type,
          status: data.status,
          price_per_kwh: parseFloat(data.price_per_kwh),
          latitude: data.latitude ? parseFloat(data.latitude) : null,
          longitude: data.longitude ? parseFloat(data.longitude) : null,
        })
        .eq('id', editingCharger.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargers'] });
      toast({
        title: t('common.success'),
        description: t('admin.chargerUpdated'),
      });
      setDialogOpen(false);
      setEditingCharger(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: 'Erro ao atualizar carregador',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chargers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargers'] });
      toast({
        title: t('common.success'),
        description: t('admin.chargerDeleted'),
      });
      setDeleteDialogOpen(false);
      setDeletingChargerId(null);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: 'Erro ao excluir carregador',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ChargerFormData) => {
    if (editingCharger) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (charger: Charger) => {
    setEditingCharger(charger);
    form.reset({
      name: charger.name,
      location: charger.location,
      power: charger.power.toString(),
      connector_type: charger.connector_type,
      status: charger.status,
      price_per_kwh: charger.price_per_kwh.toString(),
      latitude: charger.latitude?.toString() || '',
      longitude: charger.longitude?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingChargerId(id);
    setDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingCharger(null);
    form.reset();
    setDialogOpen(true);
  };

  const filteredChargers = chargers.filter((charger) => {
    const matchesSearch =
      charger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      charger.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || charger.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: chargers.length,
    available: chargers.filter((c) => c.status === 'available').length,
    in_use: chargers.filter((c) => c.status === 'in_use').length,
    maintenance: chargers.filter((c) => c.status === 'maintenance').length,
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: t('admin.available'), className: 'bg-green-500/10 text-green-600 border-green-500/20' },
      in_use: { label: t('admin.inUse'), className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      maintenance: { label: t('admin.maintenance'), className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      offline: { label: t('admin.offline'), className: 'bg-red-500/10 text-red-600 border-red-500/20' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getChargerCardStyle = (status: string) => {
  if (status === 'available') {
    return {
      card: 'bg-gradient-to-br from-green-300 to-lime-400 border-transparent shadow-xl hover:shadow-2xl hover:scale-[1.02]',
      text: 'text-white',
      iconColor: 'text-white',
      badge: 'bg-white/20 text-white border-white/30',
    };
  }
    return {
      card: 'bg-white border-gray-200 shadow-md hover:shadow-lg',
      text: 'text-foreground',
      iconColor: 'text-green-500 opacity-60',
      badge: 'bg-gray-100 text-gray-700 border-gray-200',
    };
  };

  return (
    <ResponsiveLayout showBottomNav>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/10">
        <div className="container mx-auto px-4 pt-6 pb-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('admin.chargers')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {stats.total} {stats.total === 1 ? 'carregador' : 'carregadores'} cadastrados
              </p>
            </div>
            <Button onClick={handleAddNew} className="rounded-2xl" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              {t('admin.addCharger')}
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder={t('admin.searchChargers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-2xl text-base"
              />
            </div>
          </div>

          {/* Unified Statistics Card */}
          <Card className="mb-6 rounded-3xl border-green-200 shadow-lg bg-gradient-to-br from-green-50 via-lime-50 to-emerald-50 animate-fade-in">
            <CardContent className="pt-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Zap className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-4xl font-bold text-foreground mb-1">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.totalChargers')}</p>
                </div>
                <div className="text-center">
                  <Battery className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-4xl font-bold text-green-600 mb-1">{stats.available}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.availableChargers')}</p>
                </div>
                <div className="text-center">
                  <Activity className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                  <p className="text-4xl font-bold text-blue-600 mb-1">{stats.in_use}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.chargersInUse')}</p>
                </div>
                <div className="text-center">
                  <WrenchIcon className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-4xl font-bold text-yellow-600 mb-1">{stats.maintenance}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.chargersInMaintenance')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {[
              { value: 'all', label: t('admin.allStatus') },
              { value: 'available', label: t('admin.available') },
              { value: 'in_use', label: t('admin.inUse') },
              { value: 'maintenance', label: t('admin.maintenance') },
              { value: 'offline', label: t('admin.offline') },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`px-6 py-2.5 rounded-full transition-all whitespace-nowrap font-medium text-sm ${
                  statusFilter === status.value
                    ? 'bg-gradient-to-r from-green-300 to-lime-400 text-white shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* Chargers List */}
          {isLoading ? (
            <Card className="rounded-3xl border-primary/20 shadow-lg animate-fade-in">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t('common.loading')}</p>
              </CardContent>
            </Card>
          ) : filteredChargers.length === 0 ? (
            <Card className="rounded-3xl border-primary/20 shadow-lg animate-fade-in">
              <CardContent className="py-12 text-center">
                <Zap className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  {chargers.length === 0 ? t('admin.noChargersYet') : t('admin.noChargersFound')}
                </p>
                {chargers.length === 0 && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('admin.addFirstCharger')}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChargers.map((charger) => {
                const cardStyle = getChargerCardStyle(charger.status);
                return (
                  <Card
                    key={charger.id}
                    className={`rounded-3xl transition-all duration-300 animate-fade-in ${cardStyle.card}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <Zap className={`h-16 w-16 ${cardStyle.iconColor}`} />
                        <Badge className={cardStyle.badge}>{getStatusBadge(charger.status)}</Badge>
                      </div>
                      <CardTitle className={`text-2xl ${cardStyle.text}`}>{charger.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className={`flex items-center text-sm ${cardStyle.text}`}>
                        <MapPin className="h-5 w-5 mr-2" />
                        <span>{charger.location}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className={`mb-1 ${cardStyle.text} opacity-80`}>Potência</p>
                          <p className={`font-semibold text-base ${cardStyle.text}`}>{charger.power} kW</p>
                        </div>
                        <div>
                          <p className={`mb-1 ${cardStyle.text} opacity-80`}>Preço</p>
                          <p className={`font-semibold text-base ${cardStyle.text}`}>
                            R$ {Number(charger.price_per_kwh).toFixed(2)}/kWh
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm mb-1 ${cardStyle.text} opacity-80`}>Conector</p>
                        <p className={`font-semibold ${cardStyle.text}`}>{charger.connector_type}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant={charger.status === 'available' ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => handleEdit(charger)}
                          className="flex-1 rounded-xl"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant={charger.status === 'available' ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => handleDelete(charger.id)}
                          className="text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCharger ? t('admin.editCharger') : t('admin.addCharger')}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do carregador
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.chargerName')}</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.location')}</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="power"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.power')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price_per_kwh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.pricePerKwh')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="connector_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.connectorType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CCS">CCS</SelectItem>
                        <SelectItem value="CHAdeMO">CHAdeMO</SelectItem>
                        <SelectItem value="Type 2">Type 2</SelectItem>
                        <SelectItem value="Type 1">Type 1</SelectItem>
                        <SelectItem value="Tesla">Tesla</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.status')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">{t('admin.available')}</SelectItem>
                        <SelectItem value="in_use">{t('admin.inUse')}</SelectItem>
                        <SelectItem value="maintenance">{t('admin.maintenance')}</SelectItem>
                        <SelectItem value="offline">{t('admin.offline')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.latitude')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="any" className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.longitude')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="any" className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl"
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? t('common.loading') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingChargerId && deleteMutation.mutate(deletingChargerId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResponsiveLayout>
  );
};

export default Carregadores;