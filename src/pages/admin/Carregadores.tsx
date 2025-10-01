import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ChargersHeader } from "@/components/chargers/ChargersHeader";
import { ChargersToolbar } from "@/components/chargers/ChargersToolbar";
import { ChargersViewToggle, ViewMode } from "@/components/chargers/ChargersViewToggle";
import { ChargerCardModern } from "@/components/chargers/ChargerCardModern";
import { ChargerListView } from "@/components/chargers/ChargerListView";
import { ChargerAnalyticsView } from "@/components/chargers/ChargerAnalyticsView";

const chargerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  location: z.string().min(1, "Localização é obrigatória"),
  power: z.string().min(1, "Potência é obrigatória"),
  connector_type: z.string().min(1, "Tipo de conector é obrigatório"),
  status: z.enum(["available", "in_use", "maintenance", "offline"]),
  price_per_kwh: z.string().min(1, "Preço é obrigatório"),
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
  status: "available" | "in_use" | "maintenance" | "offline";
  price_per_kwh: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

const Carregadores = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCharger, setEditingCharger] = useState<Charger | null>(null);
  const [deletingCharger, setDeletingCharger] = useState<Charger | null>(null);

  const form = useForm<ChargerFormData>({
    resolver: zodResolver(chargerSchema),
    defaultValues: {
      name: "",
      location: "",
      power: "",
      connector_type: "",
      status: "available",
      price_per_kwh: "",
      latitude: "",
      longitude: "",
    },
  });

  const { data: chargers = [], isLoading } = useQuery({
    queryKey: ["chargers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chargers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Charger[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChargerFormData) => {
      const { error } = await supabase.from("chargers").insert({
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
      queryClient.invalidateQueries({ queryKey: ["chargers"] });
      toast({
        title: t("common.success"),
        description: "Carregador adicionado com sucesso",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: "Erro ao adicionar carregador",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ChargerFormData) => {
      if (!editingCharger) return;
      const { error } = await supabase
        .from("chargers")
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
        .eq("id", editingCharger.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chargers"] });
      toast({
        title: t("common.success"),
        description: "Carregador atualizado com sucesso",
      });
      setIsDialogOpen(false);
      setEditingCharger(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: "Erro ao atualizar carregador",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chargers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chargers"] });
      toast({
        title: t("common.success"),
        description: "Carregador excluído com sucesso",
      });
      setDeletingCharger(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: "Erro ao excluir carregador",
        variant: "destructive",
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
      latitude: charger.latitude?.toString() || "",
      longitude: charger.longitude?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingCharger) {
      deleteMutation.mutate(deletingCharger.id);
    }
  };

  const handleAddNew = () => {
    setEditingCharger(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const filteredChargers = chargers.filter((charger) => {
    const matchesSearch =
      charger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      charger.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || charger.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: chargers?.length || 0,
    available: chargers?.filter((c) => c.status === "available").length || 0,
    inUse: chargers?.filter((c) => c.status === "in_use").length || 0,
    maintenance: chargers?.filter((c) => c.status === "maintenance").length || 0,
  };

  const globalUtilization = stats.total > 0 ? (stats.inUse / stats.total) * 100 : 0;

  return (
    <ResponsiveLayout
      mobileHeader={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Carregadores</h1>
            <p className="text-sm text-muted-foreground">
              {stats.total} carregadores no total
            </p>
          </div>
          <Button onClick={handleAddNew} size="icon" className="bg-green-500 hover:bg-green-600">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      }
      showBottomNav={true}
    >
      <div className="space-y-6 pb-6 px-4 md:px-6 animate-fade-in">
        {/* Header Desktop */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Carregadores
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os carregadores da rede
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2 bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all">
            <Plus className="h-5 w-5" />
            Adicionar Carregador
          </Button>
        </div>

        {/* Header com estatísticas */}
        <ChargersHeader stats={stats} globalUtilization={globalUtilization} />

        {/* Toolbar: Busca e Filtros */}
        <ChargersToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Toggle de visualização */}
        <div className="flex items-center justify-between">
          <ChargersViewToggle view={viewMode} onViewChange={setViewMode} />
          <p className="text-sm text-muted-foreground">
            {filteredChargers.length} {filteredChargers.length === 1 ? 'carregador' : 'carregadores'}
          </p>
        </div>

        {/* Conteúdo baseado na vista */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando carregadores...</p>
          </div>
        ) : filteredChargers.length === 0 ? (
          <div className="text-center py-12 backdrop-blur-sm bg-background/95 border border-green-200/50 rounded-lg">
            <p className="text-muted-foreground">Nenhum carregador encontrado</p>
            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-2"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                {filteredChargers.map((charger, index) => (
                  <div
                    key={charger.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-fade-in"
                  >
                    <ChargerCardModern
                      charger={charger}
                      onEdit={handleEdit}
                      onDelete={(charger) => setDeletingCharger(charger)}
                    />
                  </div>
                ))}
              </div>
            )}

            {viewMode === "list" && (
              <div className="animate-fade-in">
                <ChargerListView
                  chargers={filteredChargers}
                  onEdit={handleEdit}
                  onDelete={(charger) => setDeletingCharger(charger)}
                />
              </div>
            )}

            {viewMode === "analytics" && (
              <div className="animate-fade-in">
                <ChargerAnalyticsView chargers={filteredChargers} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCharger ? "Editar Carregador" : "Adicionar Carregador"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <FormLabel>Potência (kW)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" />
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
                      <FormLabel>Preço/kWh (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
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
                    <FormLabel>Tipo de Conector</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="in_use">Em Uso</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
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
                      <FormLabel>Latitude (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="any" />
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
                      <FormLabel>Longitude (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="any" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-500 hover:bg-green-600">
                  {editingCharger ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCharger} onOpenChange={() => setDeletingCharger(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o carregador "{deletingCharger?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResponsiveLayout>
  );
};

export default Carregadores;
