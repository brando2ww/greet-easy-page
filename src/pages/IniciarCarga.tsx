import { useState } from "react";
import { QRCodeScanner } from "@/components/charging/QRCodeScanner";
import { ManualCodeInput } from "@/components/charging/ManualCodeInput";
import { useChargerValidation } from "@/hooks/useChargerValidation";
import { BottomNavigation } from "@/components/BottomNavigation";

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

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Fullscreen Scanner */}
      <QRCodeScanner
        onScanSuccess={handleScanSuccess}
        onError={(error) => console.error('Scanner error:', error)}
        onManualClick={() => setShowManualInput(true)}
        isLoading={isLoading}
      />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavigation />
      </div>

      {/* Manual Input Sheet */}
      <ManualCodeInput
        open={showManualInput}
        onOpenChange={setShowManualInput}
        onSubmit={handleManualSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
