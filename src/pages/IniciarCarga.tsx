import { useState } from "react";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { QRCodeScanner } from "@/components/charging/QRCodeScanner";
import { ManualCodeInput } from "@/components/charging/ManualCodeInput";
import { useChargerValidation } from "@/hooks/useChargerValidation";

export default function IniciarCarga() {
  const [showManualInput, setShowManualInput] = useState(false);
  const { validateAndStartSession, isLoading } = useChargerValidation();

  const handleScanSuccess = (code: string) => {
    validateAndStartSession(code);
  };

  const handleManualSubmit = (code: string) => {
    validateAndStartSession(code);
    setShowManualInput(false);
  };

  const header = (
    <div className="p-4 border-b">
      <h1 className="text-xl font-bold mb-3">Iniciar carga</h1>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p><span className="font-semibold text-foreground">1.</span> Conecte o plug no seu veículo</p>
        <p><span className="font-semibold text-foreground">2.</span> Aponte a câmera para o QR Code</p>
      </div>
    </div>
  );

  return (
    <ResponsiveLayout mobileHeader={header} showBottomNav>
      <div className="flex flex-col h-full p-4 space-y-4">
        {/* Scanner Area */}
        <div className="flex-1 min-h-[400px]">
          <QRCodeScanner 
            onScanSuccess={handleScanSuccess}
            onError={(error) => console.error('Scanner error:', error)}
          />
        </div>

        {/* Manual Input Button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 text-lg"
          onClick={() => setShowManualInput(true)}
          disabled={isLoading}
        >
          Inserir código da estação
        </Button>

        {/* Manual Input Sheet */}
        <ManualCodeInput
          open={showManualInput}
          onOpenChange={setShowManualInput}
          onSubmit={handleManualSubmit}
          isLoading={isLoading}
        />
      </div>
    </ResponsiveLayout>
  );
}
