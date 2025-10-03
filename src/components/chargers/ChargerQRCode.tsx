import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, Copy, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ChargerQRCodeProps {
  chargerId: string;
  chargerName: string;
  chargerLocation: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChargerQRCode = ({
  chargerId,
  chargerName,
  chargerLocation,
  open,
  onOpenChange,
}: ChargerQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (open && canvasRef.current) {
      // Gerar QR code no canvas
      QRCode.toCanvas(
        canvasRef.current,
        chargerId,
        {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) {
            console.error("Erro ao gerar QR code:", error);
            toast({
              title: "Erro",
              description: "Não foi possível gerar o QR code",
              variant: "destructive",
            });
          }
        }
      );

      // Gerar data URL para download
      QRCode.toDataURL(chargerId, { width: 500, margin: 2 })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error("Erro ao gerar data URL:", err);
        });
    }
  }, [open, chargerId, toast]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qrcode-${chargerName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download iniciado",
      description: "QR code baixado com sucesso",
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir janela de impressão",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${chargerName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              max-width: 500px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
              color: #1a1a1a;
            }
            .location {
              font-size: 16px;
              color: #666;
              margin-bottom: 30px;
            }
            img {
              max-width: 100%;
              height: auto;
              border: 2px solid #22c55e;
              padding: 15px;
              border-radius: 8px;
            }
            .instructions {
              margin-top: 30px;
              font-size: 14px;
              color: #666;
              text-align: left;
            }
            .id {
              font-family: monospace;
              font-size: 12px;
              color: #999;
              margin-top: 20px;
              word-break: break-all;
            }
            @media print {
              body {
                min-height: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${chargerName}</h1>
            <div class="location">${chargerLocation}</div>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="instructions">
              <strong>Como usar:</strong>
              <ol>
                <li>Abra o aplicativo Speed</li>
                <li>Toque em "Iniciar Carga"</li>
                <li>Escaneie este QR code</li>
                <li>Aguarde a conexão e inicie o carregamento</li>
              </ol>
            </div>
            <div class="id">ID: ${chargerId}</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast({
      title: "Impressão iniciada",
      description: "Janela de impressão aberta",
    });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(chargerId).then(() => {
      toast({
        title: "Copiado!",
        description: "ID do carregador copiado para a área de transferência",
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-green-600" />
            QR Code do Carregador
          </DialogTitle>
          <DialogDescription>
            Escaneie este QR code para iniciar o carregamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do carregador */}
          <div className="space-y-1 text-center">
            <h3 className="font-semibold text-lg">{chargerName}</h3>
            <p className="text-sm text-muted-foreground">{chargerLocation}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-green-200">
            <canvas ref={canvasRef} />
          </div>

          {/* ID do carregador */}
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">
              ID do Carregador
            </div>
            <div className="font-mono text-sm break-all">{chargerId}</div>
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="gap-2"
              disabled={!qrDataUrl}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Baixar</span>
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
              disabled={!qrDataUrl}
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyId}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copiar ID</span>
            </Button>
          </div>

          {/* Instruções */}
          <div className="bg-green-50 rounded-lg p-4 text-sm space-y-2">
            <div className="font-semibold text-green-900">
              Como usar:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-green-800">
              <li>Abra o aplicativo Speed</li>
              <li>Toque em "Iniciar Carga"</li>
              <li>Escaneie este QR code ou insira o código manualmente</li>
              <li>Aguarde a conexão e inicie o carregamento</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
