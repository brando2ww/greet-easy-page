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
import { applyCPFMask } from "@/utils/formatters";

interface PersonalInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    full_name?: string;
    cpf?: string;
  };
  onSave: (data: { full_name: string; cpf: string }) => void;
  isSaving?: boolean;
}

export const PersonalInfoSheet = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  isSaving,
}: PersonalInfoSheetProps) => {
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [cpf, setCpf] = useState(initialData?.cpf || "");

  useEffect(() => {
    if (open) {
      setFullName(initialData?.full_name || "");
      setCpf(initialData?.cpf || "");
    }
  }, [open, initialData]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCPFMask(e.target.value);
    setCpf(masked);
  };

  const handleSave = () => {
    if (!fullName.trim() || !cpf.trim()) {
      return;
    }
    
    const cleanedCpf = cpf.replace(/\D/g, '');
    onSave({ full_name: fullName, cpf: cleanedCpf });
  };

  const isValid = fullName.trim() && cpf.replace(/\D/g, '').length === 11;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Informações pessoais</SheetTitle>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
            />
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
