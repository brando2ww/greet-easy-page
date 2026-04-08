import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Plus, Info, Settings, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChargersHeader } from "@/components/chargers/ChargersHeader";
import { ChargersToolbar } from "@/components/chargers/ChargersToolbar";
import { ChargersViewToggle, ViewMode } from "@/components/chargers/ChargersViewToggle";
import { ChargerCardModern } from "@/components/chargers/ChargerCardModern";
import { ChargerListView } from "@/components/chargers/ChargerListView";
import { ChargerAnalyticsView } from "@/components/chargers/ChargerAnalyticsView";
import { ChargerQRCode } from "@/components/chargers/ChargerQRCode";
import { applyCEPMask } from "@/utils/formatters";
import { fetchAddressFromCEP, fetchCoordinatesFromAddress } from "@/utils/geocoding";

const chargerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  capacity: z.string().min(1, "Capacidade é obrigatória"),
  client_id: z.string().optional(),
  serial_number: z.string().min(1, "Número Serial é obrigatório"),
  ocpp_charge_point_id: z.string()
    .regex(/^[0-9]{6}$/, "O código OCPP deve ter exatamente 6 números"),
  postal_code: z.string()
    .regex(/^\d{5}-?\d{3}$/, "CEP deve estar no formato XXXXX-XXX")
    .optional(),
  address_number: z.string().optional(),
  location: z.string().min(1, "Localização é obrigatória"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type ChargerFormData = z.infer<typeof chargerSchema>;

type Charger = {
  id: string;
  name: string;
  location: string;
  connector_type: string;
  power: number;
  status: "available" | "in_use" | "maintenance" | "offline";
  price_per_kwh: number;
  latitude: number | null;
  longitude: number | null;
  serial_number: string | null;
  partner_client_id: string | null;
  ocpp_charge_point_id: string | null;
  ocpp_protocol_status: string | null;
  last_heartbeat: string | null;
  firmware_version: string | null;
  ocpp_vendor: string | null;
  ocpp_model: string | null;
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
  const [qrCodeCharger, setQrCodeCharger] = useState<Charger | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  const [addressFilled, setAddressFilled] = useState(false);
  const [coordinatesFilled, setCoordinatesFilled] = useState(false);

  const form = useForm<ChargerFormData>({
    resolver: zodResolver(chargerSchema),
    defaultValues: {
      name: "",
      type: "",
      capacity: "",
      client_id: "",
      serial_number: "",
      ocpp_charge_point_id: "",
      postal_code: "",
      address_number: "",
      location: "",
      latitude: "",
      longitude: "",
    },
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, city, state")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: chargers = [], isLoading } = useQuery({
    queryKey: ["chargers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chargers")
        .select("id, name, location, connector_type, power, status, price_per_kwh, latitude, longitude, serial_number, partner_client_id, ocpp_charge_point_id, ocpp_protocol_status, last_heartbeat, firmware_version, ocpp_vendor, ocpp_model, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Charger[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChargerFormData) => {
      const { error } = await supabase.from("chargers").insert({
        name: data.name,
        connector_type: data.type,
        power: parseFloat(data.capacity),
        partner_client_id: data.client_id || null,
        serial_number: data.serial_number || null,
        ocpp_charge_point_id: data.ocpp_charge_point_id || null,
        location: data.location,
        status: 'available',
        price_per_kwh: 0.80,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chargers"] });
      toast({
        title: t("common.success"),
        description: "Carregador adicionado com sucesso",
      });
      setIsDialogOpen(false);
      
      // Buscar o carregador recém-criado e mostrar QR code
      const { data: newChargers } = await supabase
        .from("chargers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (newChargers && newChargers.length > 0) {
        setQrCodeCharger(newChargers[0] as Charger);
      }
      
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
          connector_type: data.type,
          power: parseFloat(data.capacity),
          partner_client_id: data.client_id || null,
          serial_number: data.serial_number || null,
          ocpp_charge_point_id: data.ocpp_charge_point_id || null,
          location: data.location,
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
      type: charger.connector_type,
      capacity: charger.power.toString(),
      client_id: charger.partner_client_id || "",
      serial_number: charger.serial_number || "",
      ocpp_charge_point_id: charger.ocpp_charge_point_id || "",
      postal_code: "",
      address_number: "",
      location: charger.location,
      latitude: charger.latitude?.toString() || "",
      longitude: charger.longitude?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleCEPBlur = async () => {
    const cep = form.getValues("postal_code");
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;

    setIsLoadingAddress(true);
    try {
      const addressInfo = await fetchAddressFromCEP(cep);
      if (addressInfo) {
        form.setValue("location", addressInfo.fullAddress);
        setAddressFilled(true);
        toast({
          title: "✓ CEP encontrado",
          description: "Endereço preenchido automaticamente",
        });

        // Buscar coordenadas automaticamente se tiver número
        const addressNumber = form.getValues("address_number");
        if (addressNumber) {
          await handleFetchCoordinates(addressInfo, addressNumber, cep);
        }
      } else {
        setAddressFilled(false);
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP ou preencha manualmente",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleAddressNumberChange = async () => {
    const cep = form.getValues("postal_code");
    const addressNumber = form.getValues("address_number");
    const location = form.getValues("location");

    if (!cep || !addressNumber || !location) return;

    // Extrai informações do endereço já preenchido
    const addressParts = location.split(',');
    if (addressParts.length < 3) return;

    setIsLoadingCoordinates(true);
    try {
      const addressInfo = await fetchAddressFromCEP(cep);
      if (addressInfo) {
        await handleFetchCoordinates(addressInfo, addressNumber, cep);
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadas:", error);
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  const handleFetchCoordinates = async (
    addressInfo: { street: string; city: string; state: string },
    addressNumber: string,
    cep: string
  ) => {
    setIsLoadingCoordinates(true);
    try {
      const coords = await fetchCoordinatesFromAddress(
        addressInfo.street,
        addressNumber,
        addressInfo.city,
        addressInfo.state,
        cep
      );

      if (coords) {
        form.setValue("latitude", coords.latitude.toString());
        form.setValue("longitude", coords.longitude.toString());
        setCoordinatesFilled(true);
        toast({
          title: "✓ Coordenadas calculadas",
          description: "Localização preenchida com sucesso",
        });
      } else {
        setCoordinatesFilled(false);
        toast({
          title: "Coordenadas não encontradas",
          description: "Preencha manualmente se necessário",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar coordenadas",
        description: "Não foi possível buscar as coordenadas",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  const handleDelete = () => {
    if (deletingCharger) {
      deleteMutation.mutate(deletingCharger.id);
    }
  };

  const handleAddNew = () => {
    setEditingCharger(null);
    form.reset();
    setAddressFilled(false);
    setCoordinatesFilled(false);
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
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Carregadores</h1>
          <Button onClick={handleAddNew} size="sm" className="bg-primary hover:bg-primary/90 h-9 gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="text-xs">Novo</span>
          </Button>
        </div>
      }
      showBottomNav={true}
    >
      <div className="space-y-3 md:space-y-6 pt-4 md:pt-12 pb-6 px-4 md:px-6 animate-fade-in">
        {/* Header Desktop */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Carregadores
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os carregadores da rede
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
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
        <div className="flex items-center justify-between gap-2">
          <ChargersViewToggle view={viewMode} onViewChange={setViewMode} />
          <p className="text-xs text-muted-foreground shrink-0">
            {filteredChargers.length} {filteredChargers.length === 1 ? 'carregador' : 'carregadores'}
          </p>
        </div>

        {/* Conteúdo baseado na vista */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando carregadores...</p>
          </div>
        ) : filteredChargers.length === 0 ? (
          <div className="text-center py-16 md:py-20 backdrop-blur-sm bg-background/95 border border-primary/20/50 rounded-lg">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              {searchQuery || statusFilter !== "all" ? "Nenhum resultado" : "Nenhum carregador"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 px-4">
              {searchQuery || statusFilter !== "all" 
                ? "Tente ajustar os filtros ou busca" 
                : "Adicione seu primeiro carregador"}
            </p>
            {(searchQuery || statusFilter !== "all") ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="border-primary/20"
              >
                Limpar filtros
              </Button>
            ) : (
              <Button
                onClick={handleAddNew}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar carregador
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 animate-fade-in">
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
                  onViewQRCode={(charger) => setQrCodeCharger(charger)}
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
                  onViewQRCode={(charger) => setQrCodeCharger(charger)}
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

      {/* Add/Edit Dialog - Improved UX */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingCharger ? "Editar Carregador" : "Adicionar Novo Carregador"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Seção 1: Informações Básicas */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Info className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-primary">Informações Básicas</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Carregador *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Carregador Principal A1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Conector *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AC">AC (Corrente Alternada)</SelectItem>
                              <SelectItem value="DC">DC (Corrente Contínua)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacidade (kW) *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" placeholder="Ex: 22.0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Seção 2: Identificação Técnica */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-900">Identificação Técnica</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="serial_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número Serial *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: SN-2024-001" />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Número de série do equipamento
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ocpp_charge_point_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OCPP ID (6 dígitos) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              maxLength={6}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                              placeholder="123456"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Identificador único no protocolo OCPP
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente Parceiro (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Nenhum cliente selecionado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.company_name} {client.city && client.state ? `(${client.city}/${client.state})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Associe este carregador a um cliente específico
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Seção 3: Localização */}
              <Card className="border-purple-200 bg-purple-50/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-900">Localização</h3>
                      <p className="text-xs text-purple-700 mt-1">
                        {!addressFilled && !coordinatesFilled && "Digite o CEP para buscar o endereço automaticamente"}
                        {addressFilled && !coordinatesFilled && "✓ Endereço preenchido! Adicione o número para obter coordenadas"}
                        {coordinatesFilled && "✓ Localização completa!"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                placeholder="00000-000"
                                maxLength={9}
                                onChange={(e) => {
                                  const masked = applyCEPMask(e.target.value);
                                  field.onChange(masked);
                                  setAddressFilled(false);
                                }}
                                onBlur={handleCEPBlur}
                                className={addressFilled ? "border-primary" : ""}
                              />
                              {isLoadingAddress && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-purple-600" />
                              )}
                              {addressFilled && !isLoadingAddress && (
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="123"
                              disabled={!addressFilled}
                              onBlur={handleAddressNumberChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Completo *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Será preenchido ao buscar o CEP" 
                            disabled={!addressFilled && !field.value}
                            className={addressFilled ? "border-primary" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Coordenadas GPS (preenchidas automaticamente)</span>
                      {isLoadingCoordinates && <Badge variant="outline" className="text-xs">Buscando...</Badge>}
                      {coordinatesFilled && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Latitude</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="any" 
                                  placeholder="-23.550520"
                                  className={coordinatesFilled ? "border-primary text-xs" : "text-xs"}
                                />
                              </div>
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
                            <FormLabel className="text-xs">Longitude</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="any" 
                                  placeholder="-46.633308"
                                  className={coordinatesFilled ? "border-primary text-xs" : "text-xs"}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de Ação */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setAddressFilled(false);
                    setCoordinatesFilled(false);
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCharger ? "Salvar Alterações" : "Criar Carregador"}
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

      {/* QR Code Dialog */}
      {qrCodeCharger && (
        <ChargerQRCode
          chargerId={qrCodeCharger.id}
          displayCode={qrCodeCharger.ocpp_charge_point_id || undefined}
          chargerName={qrCodeCharger.name}
          chargerLocation={qrCodeCharger.location}
          open={!!qrCodeCharger}
          onOpenChange={(open) => !open && setQrCodeCharger(null)}
        />
      )}
    </ResponsiveLayout>
  );
};

export default Carregadores;
