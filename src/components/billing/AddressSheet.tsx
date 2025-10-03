import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { applyCEPMask } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";

interface AddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    street_address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  onSave: (data: {
    street_address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  }) => void;
  isSaving?: boolean;
}

export const AddressSheet = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  isSaving,
}: AddressSheetProps) => {
  const { toast } = useToast();
  const [zipCode, setZipCode] = useState(initialData?.zip_code || "");
  const [streetAddress, setStreetAddress] = useState(initialData?.street_address || "");
  const [number, setNumber] = useState(initialData?.number || "");
  const [complement, setComplement] = useState(initialData?.complement || "");
  const [neighborhood, setNeighborhood] = useState(initialData?.neighborhood || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [state, setState] = useState(initialData?.state || "");
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  useEffect(() => {
    if (open) {
      setZipCode(initialData?.zip_code || "");
      setStreetAddress(initialData?.street_address || "");
      setNumber(initialData?.number || "");
      setComplement(initialData?.complement || "");
      setNeighborhood(initialData?.neighborhood || "");
      setCity(initialData?.city || "");
      setState(initialData?.state || "");
    }
  }, [open, initialData]);

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCEPMask(e.target.value);
    setZipCode(masked);

    const cleaned = masked.replace(/\D/g, '');
    if (cleaned.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setStreetAddress(data.logradouro || "");
          setNeighborhood(data.bairro || "");
          setCity(data.localidade || "");
          setState(data.uf || "");
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado e tente novamente.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching CEP:", error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleSave = () => {
    if (!zipCode.trim() || !streetAddress.trim() || !number.trim() || 
        !neighborhood.trim() || !city.trim() || !state.trim()) {
      return;
    }
    
    const cleanedZipCode = zipCode.replace(/\D/g, '');
    onSave({
      zip_code: cleanedZipCode,
      street_address: streetAddress,
      number,
      complement: complement || undefined,
      neighborhood,
      city,
      state,
    });
  };

  const isValid = zipCode.replace(/\D/g, '').length === 8 && 
                  streetAddress.trim() && 
                  number.trim() && 
                  neighborhood.trim() && 
                  city.trim() && 
                  state.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
        <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Endereço</SheetTitle>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">CEP</Label>
            <Input
              id="zipCode"
              value={zipCode}
              onChange={handleZipCodeChange}
              placeholder="00000-000"
              maxLength={9}
              disabled={isLoadingCep}
            />
            {isLoadingCep && (
              <p className="text-xs text-muted-foreground">Buscando CEP...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="streetAddress">Rua</Label>
            <Input
              id="streetAddress"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Digite o nome da rua"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Nº"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Apto, bloco..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Digite o bairro"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="w-full mt-6"
          >
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
