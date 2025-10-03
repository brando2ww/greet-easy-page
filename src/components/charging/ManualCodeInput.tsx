import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

interface ManualCodeInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => void;
  isLoading?: boolean;
}

export const ManualCodeInput = ({ open, onOpenChange, onSubmit, isLoading }: ManualCodeInputProps) => {
  const [code, setCode] = useState("");

  const handleValueChange = (value: string) => {
    setCode(value);
    // Auto-submit quando completar 6 dígitos
    if (value.length === 6) {
      onSubmit(value);
    }
  };

  // Limpar código ao fechar
  useEffect(() => {
    if (!open) {
      setCode("");
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-6 pb-8">
        <DrawerHeader className="text-center px-0 pt-6 pb-8">
          <DrawerTitle className="text-xl font-semibold">
            Digite o código da estação
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="flex flex-col items-center space-y-8">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={handleValueChange}
            pattern="^[0-9]+$"
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-12 h-14 text-xl rounded-lg" />
              <InputOTPSlot index={1} className="w-12 h-14 text-xl rounded-lg" />
              <InputOTPSlot index={2} className="w-12 h-14 text-xl rounded-lg" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} className="w-12 h-14 text-xl rounded-lg" />
              <InputOTPSlot index={4} className="w-12 h-14 text-xl rounded-lg" />
              <InputOTPSlot index={5} className="w-12 h-14 text-xl rounded-lg" />
            </InputOTPGroup>
          </InputOTP>
          
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary/80 hover:bg-transparent text-base font-medium"
            onClick={() => onOpenChange(false)}
          >
            Voltar
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
