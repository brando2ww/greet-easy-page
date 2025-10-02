import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";

interface ManualCodeInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => void;
  isLoading?: boolean;
}

export const ManualCodeInput = ({ open, onOpenChange, onSubmit, isLoading }: ManualCodeInputProps) => {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code.trim());
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Código da Estação</SheetTitle>
          <SheetDescription>
            Digite o código que está no carregador
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <Input
            placeholder="Ex: CHG-001"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="text-lg h-12"
            autoFocus
            disabled={isLoading}
          />
          
          <Button 
            type="submit" 
            className="w-full h-12 text-lg" 
            disabled={!code.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
