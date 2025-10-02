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
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
      {/* Scanner container - Full viewport */}
      <div id="qr-reader" className="absolute inset-0 w-full h-full" style={{ minHeight: '100vh', minWidth: '100vw' }} />

      {/* Header Overlay - Instructions */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 via-black/30 to-transparent pb-20 pointer-events-none" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-white">Escaneie o QR Code</h1>
          <button 
            className="text-white/90 hover:text-white transition-colors flex items-center gap-1.5 text-sm pointer-events-auto"
            onClick={() => window.open('https://suporte.example.com', '_blank')}
          >
            <Headset className="w-4 h-4" />
            <span>Ajuda</span>
          </button>
        </div>
        <p className="text-sm text-white/80">Posicione o código no centro da tela</p>
      </div>

      {/* Overlay with frame */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-72 h-72">
          {/* Corner borders with glow */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-[3px] border-l-[3px] border-white rounded-tl-xl shadow-lg shadow-white/20" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-[3px] border-r-[3px] border-white rounded-tr-xl shadow-lg shadow-white/20" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[3px] border-l-[3px] border-white rounded-bl-xl shadow-lg shadow-white/20" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[3px] border-r-[3px] border-white rounded-br-xl shadow-lg shadow-white/20" />
          
          {/* Scanning animation line */}
          {isScanning && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-lg shadow-primary/50" />
            </div>
          )}
          
          {/* Center guide */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </div>

      {/* Flash Control Button - Top Right */}
      {hasFlashSupport && (
        <div className="absolute right-6 z-20 pointer-events-auto" style={{ top: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-top)))' }}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 rounded-full w-12 h-12 transition-all",
              isFlashOn && "bg-primary/40 border-primary/50"
            )}
            onClick={toggleFlash}
          >
            {isFlashOn ? (
              <Zap className="w-5 h-5 text-white" />
            ) : (
              <ZapOff className="w-5 h-5 text-white/90" />
            )}
          </Button>
        </div>
      )}

      {/* Bottom Manual Input Button */}
      <div className="absolute left-0 right-0 z-40 px-6 bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-20 pointer-events-none" style={{ bottom: 'calc(max(7rem, calc(7rem + env(safe-area-inset-bottom))) + 50px)' }}>
        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 text-base font-medium bg-transparent text-white border-2 border-white/40 hover:bg-white/10 hover:border-white/60 backdrop-blur-md pointer-events-auto mb-2 transition-all rounded-full"
          onClick={onManualClick}
          disabled={isLoading}
        >
          Inserir código manualmente
        </Button>
      </div>
    </div>
  );
};
