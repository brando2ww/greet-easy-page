import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Plus, Edit, Trash2, Building2, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const clientSchema = z.object({
  company_name: z.string().min(1, 'Nome da empresa é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface Client extends ClientFormValues {
  id: string;
  created_at: string;
  updated_at: string;
}

const Clientes = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      company_name: '',
      email: '',
      phone: '',
      cnpj: '',
      address: '',
      city: '',
      state: '',
    },
  });

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('company_name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch chargers count per client
  const { data: chargersCounts = {} } = useQuery({
    queryKey: ['clients-chargers-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chargers')
        .select('partner_client_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((charger) => {
        if (charger.partner_client_id) {
          counts[charger.partner_client_id] = (counts[charger.partner_client_id] || 0) + 1;
        }
      });
      
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          company_name: values.company_name,
          email: values.email,
          phone: values.phone || null,
          cnpj: values.cnpj || null,
          address: values.address || null,
          city: values.city || null,
          state: values.state || null,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: t('admin.clientAdded') });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ 
        title: t('common.error'), 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: ClientFormValues & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: t('admin.clientUpdated') });
      setIsDialogOpen(false);
      setEditingClient(null);
      form.reset();
    },
    onError: (error) => {
      toast({ 
        title: t('common.error'), 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-chargers-count'] });
      toast({ title: t('admin.clientDeleted') });
      setClientToDelete(null);
    },
    onError: (error) => {
      toast({ 
        title: t('common.error'), 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const onSubmit = (values: ClientFormValues) => {
    if (editingClient) {
      updateMutation.mutate({ ...values, id: editingClient.id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      company_name: client.company_name,
      email: client.email,
      phone: client.phone || '',
      cnpj: client.cnpj || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    form.reset();
  };

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeClientsCount = Object.keys(chargersCounts).length;

  return (
    <ResponsiveLayout showBottomNav>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 pt-6 pb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('admin.clients')}
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie clientes parceiros
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
              <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('admin.newClient')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingClient ? t('admin.editClient') : t('admin.newClient')}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('admin.companyName')} *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nome da Empresa" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('admin.email')} *</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="email@empresa.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('admin.phone')}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(00) 00000-0000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('admin.cnpj')}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="00.000.000/0000-00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t('admin.address')}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Rua, número, complemento" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('admin.city')}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Cidade" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('admin.state')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('admin.selectState')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {brazilianStates.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-violet-600 hover:bg-violet-700"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {editingClient ? t('admin.update') : t('admin.create')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('admin.totalClients')}
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('admin.activeClients')}
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeClientsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Com carregadores instalados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('admin.searchClients')}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Clients List */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.clientList')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('common.loading')}
                </p>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {searchTerm ? t('admin.noClientsFound') : t('admin.noClientsYet')}
                  </p>
                  {!searchTerm && (
                    <p className="text-sm text-muted-foreground">
                      {t('admin.addFirstClient')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{client.company_name}</h3>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{client.email}</p>
                          {client.phone && <p>{client.phone}</p>}
                          {(client.city || client.state) && (
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {client.city}{client.city && client.state && ', '}{client.state}
                            </p>
                          )}
                          <p className="text-xs text-violet-600 font-medium">
                            {chargersCounts[client.id] || 0} {t('admin.chargersInstalled').toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setClientToDelete(client)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.confirmDeleteClient')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteClientDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete && deleteMutation.mutate(clientToDelete.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResponsiveLayout>
  );
};

export default Clientes;