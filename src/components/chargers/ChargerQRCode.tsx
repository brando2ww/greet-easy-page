import { useRef } from "react";
import QRCodeSVG from "react-qr-code";
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
  displayCode?: string;
  chargerName: string;
  chargerLocation: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChargerQRCode = ({
  chargerId,
  displayCode,
  chargerName,
  chargerLocation,
  open,
  onOpenChange,
}: ChargerQRCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 500;
    canvas.height = 500;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `qrcode-${chargerName.replace(/\s+/g, "-").toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Download iniciado",
          description: "QR code baixado com sucesso",
        });
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handlePrint = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const dataUrl = "data:image/svg+xml;base64," + btoa(svgData);

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
            <img src="${dataUrl}" alt="QR Code" />
            <div class="instructions">
              <strong>Como usar:</strong>
              <ol>
                <li>Abra o aplicativo Speed</li>
                <li>Toque em "Iniciar Carga"</li>
                <li>Escaneie este QR code</li>
                <li>Aguarde a conexão e inicie o carregamento</li>
              </ol>
            </div>
            <div class="id">ID: ${displayCode || chargerId}</div>
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
    navigator.clipboard.writeText(displayCode || chargerId).then(() => {
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
          <div ref={qrRef} className="flex justify-center p-6 bg-white rounded-lg border-2 border-green-200">
            <QRCodeSVG value={chargerId} size={256} level="H" />
          </div>

          {/* ID do carregador */}
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">
              ID do Carregador
            </div>
            <div className="font-mono text-sm break-all">{displayCode || chargerId}</div>
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="gap-2 hover:bg-muted hover:text-foreground"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Baixar</span>
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2 hover:bg-muted hover:text-foreground"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyId}
              className="gap-2 hover:bg-muted hover:text-foreground"
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
