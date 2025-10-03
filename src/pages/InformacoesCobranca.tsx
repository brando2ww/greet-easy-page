import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useBillingInfo } from "@/hooks/useBillingInfo";
import { PersonalInfoSheet } from "@/components/billing/PersonalInfoSheet";
import { AddressSheet } from "@/components/billing/AddressSheet";
import { maskCPF, formatAddress } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

const InformacoesCobranca = () => {
  const navigate = useNavigate();
  const {
    billingInfo,
    isLoading,
    updatePersonalInfo,
    updateAddress,
    isUpdatingPersonalInfo,
    isUpdatingAddress,
  } = useBillingInfo();

  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);

  const handlePersonalInfoSave = (data: { full_name: string; cpf: string }) => {
    updatePersonalInfo(data, {
      onSuccess: () => {
        setPersonalInfoOpen(false);
      },
    });
  };

  const handleAddressSave = (data: {
    street_address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  }) => {
    updateAddress(data, {
      onSuccess: () => {
        setAddressOpen(false);
      },
    });
  };

  return (
    <>
      <ResponsiveLayout
        mobileHeader={
          <div className="flex items-center gap-3 p-4 border-b bg-background">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/perfil")}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Informações de cobrança</h1>
          </div>
        }
      >
        <div className="p-4 space-y-6 pb-24">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Informe os dados para efetuar recargas em estações pagas
            </p>
            <p className="text-xs text-muted-foreground">
              É necessário preencher todas as informações para realizar pagamentos.
            </p>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <>
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setPersonalInfoOpen(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Informações pessoais</p>
                          <p className="text-xs text-muted-foreground">
                            {billingInfo?.full_name && billingInfo?.cpf
                              ? `${billingInfo.full_name} - ${maskCPF(billingInfo.cpf)}`
                              : "Adicione seu nome e CPF"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setAddressOpen(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Endereço</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {billingInfo?.street_address
                              ? formatAddress({
                                  street_address: billingInfo.street_address,
                                  number: billingInfo.number,
                                  complement: billingInfo.complement,
                                  neighborhood: billingInfo.neighborhood,
                                  city: billingInfo.city,
                                  state: billingInfo.state,
                                })
                              : "Adicione seu endereço completo"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </ResponsiveLayout>

      <PersonalInfoSheet
        open={personalInfoOpen}
        onOpenChange={setPersonalInfoOpen}
        initialData={billingInfo || undefined}
        onSave={handlePersonalInfoSave}
        isSaving={isUpdatingPersonalInfo}
      />

      <AddressSheet
        open={addressOpen}
        onOpenChange={setAddressOpen}
        initialData={billingInfo || undefined}
        onSave={handleAddressSave}
        isSaving={isUpdatingAddress}
      />
    </>
  );
};

export default InformacoesCobranca;
