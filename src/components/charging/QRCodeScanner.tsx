import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Headset, Zap, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRCodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onError?: (error: string) => void;
  onManualClick: () => void;
  isLoading?: boolean;
}

export const QRCodeScanner = ({ onScanSuccess, onError, onManualClick, isLoading }: QRCodeScannerProps) => {
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasFlashSupport, setHasFlashSupport] = useState(false);

  useEffect(() => {
    const initScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length === 0) {
          onError?.("Nenhuma câmera disponível");
          return;
        }

        // Check for flash support
        const capabilities = await navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            stream.getTracks().forEach(track => track.stop());
            return capabilities;
          });

        setHasFlashSupport(!!(capabilities as any).torch);

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            onScanSuccess(decodedText);
            html5QrCode.stop();
          },
          (errorMessage) => {
            // Silent error handling for continuous scanning
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error("Error initializing scanner:", err);
        onError?.("Erro ao inicializar câmera. Verifique as permissões.");
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScanSuccess, onError]);

  const toggleFlash = async () => {
    if (!hasFlashSupport) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      const track = stream.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !isFlashOn } as any]
      });
      setIsFlashOn(!isFlashOn);
    } catch (err) {
      console.error("Flash toggle error:", err);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
      {/* Scanner container */}
      <div id="qr-reader" className="w-full h-full" />

      {/* Header Overlay - Instructions */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6 pb-12 pointer-events-none">
        <h1 className="text-xl font-bold text-white mb-3">Iniciar carga</h1>
        <div className="space-y-1 text-sm text-white/90">
          <p><span className="font-semibold">1.</span> Conecte o plug no seu veículo</p>
          <p><span className="font-semibold">2.</span> Aponte a câmera para o QR Code</p>
        </div>
      </div>

      {/* Overlay with frame */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="flex items-center justify-center w-full h-full">
          <div className="relative w-64 h-64">
            {/* Corner borders */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg" />
            
            {/* Scanning animation */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-1 bg-primary animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="absolute top-6 left-0 right-0 flex justify-between px-6 z-20 pointer-events-auto">
        <Button
          variant="secondary"
          size="icon"
          className="bg-black/50 hover:bg-black/70 backdrop-blur-sm border-white/20"
          onClick={() => window.open('https://suporte.example.com', '_blank')}
        >
          <Headset className="w-5 h-5 text-white" />
        </Button>

        {hasFlashSupport && (
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "bg-black/50 hover:bg-black/70 backdrop-blur-sm border-white/20",
              isFlashOn && "bg-primary/50 hover:bg-primary/70"
            )}
            onClick={toggleFlash}
          >
            {isFlashOn ? (
              <Zap className="w-5 h-5 text-white" />
            ) : (
              <ZapOff className="w-5 h-5 text-white" />
            )}
          </Button>
        )}
      </div>

      {/* Bottom Manual Input Button */}
      <div className="absolute bottom-20 left-0 right-0 z-20 px-6 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pointer-events-none">
        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 text-lg bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm pointer-events-auto"
          onClick={onManualClick}
          disabled={isLoading}
        >
          Inserir código da estação
        </Button>
      </div>
    </div>
  );
};
