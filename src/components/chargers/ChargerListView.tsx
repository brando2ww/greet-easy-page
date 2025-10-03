import { Edit, Trash2, QrCode } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChargerStats } from "@/hooks/useChargerStats";
import { Skeleton } from "@/components/ui/skeleton";

interface Charger {
  id: string;
  name: string;
  location: string;
  status: "available" | "in_use" | "maintenance" | "offline";
  power: number;
  connector_type: string;
  price_per_kwh: number;
  latitude: number | null;
  longitude: number | null;
  serial_number: string | null;
  partner_client_id: string | null;
  ocpp_charge_point_id: string | null;
  ocpp_protocol_status: string | null;
  last_heartbeat: string | null;
  firmware_version: string | null;
  ocpp_vendor: string | null;
  ocpp_model: string | null;
  created_at: string;
  updated_at: string;
}

interface ChargerListViewProps {
  chargers: Charger[];
  onEdit: (charger: Charger) => void;
  onDelete: (charger: Charger) => void;
  onViewQRCode?: (charger: Charger) => void;
}

const statusConfig = {
  available: { label: "Disponível", class: "bg-green-100 text-green-700" },
  in_use: { label: "Em Uso", class: "bg-blue-100 text-blue-700" },
  maintenance: { label: "Manutenção", class: "bg-yellow-100 text-yellow-700" },
  offline: { label: "Offline", class: "bg-red-100 text-red-700" },
};

const ChargerRow = ({
  charger,
  onEdit,
  onDelete,
  onViewQRCode,
}: {
  charger: Charger;
  onEdit: (charger: Charger) => void;
  onDelete: (charger: Charger) => void;
  onViewQRCode?: (charger: Charger) => void;
}) => {
  const { data: stats, isLoading } = useChargerStats(charger.id);
  const config = statusConfig[charger.status as keyof typeof statusConfig] || statusConfig.available;

  return (
    <TableRow className="hover:bg-green-50/50 transition-colors">
      <TableCell>
        <div>
          <div className="font-semibold">{charger.name}</div>
          <div className="text-sm text-muted-foreground">{charger.location}</div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={config.class}>{config.label}</Badge>
      </TableCell>
      <TableCell className="text-center">{charger.power} kW</TableCell>
      <TableCell className="text-center">{charger.connector_type}</TableCell>
      <TableCell className="text-center">
        {charger.serial_number || "-"}
      </TableCell>
      <TableCell className="text-center">
        R$ {charger.price_per_kwh.toFixed(2)}
      </TableCell>
      <TableCell className="text-center">
        {isLoading ? (
          <Skeleton className="h-6 w-16 mx-auto" />
        ) : stats ? (
          `${stats.utilizationRate.toFixed(0)}%`
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-center">
        {isLoading ? (
          <Skeleton className="h-6 w-20 mx-auto" />
        ) : stats ? (
          `R$ ${stats.totalRevenue.toFixed(0)}`
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-center">
        {isLoading ? (
          <Skeleton className="h-6 w-12 mx-auto" />
        ) : stats ? (
          stats.sessionsCount
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {onViewQRCode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewQRCode(charger)}
              className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
              title="Ver QR Code"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(charger)}
            className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(charger)}
            className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const ChargerListView = ({ chargers, onEdit, onDelete, onViewQRCode }: ChargerListViewProps) => {
  return (
    <div className="rounded-lg border border-green-200/50 overflow-hidden backdrop-blur-sm bg-background/95">
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50 hover:bg-green-50">
            <TableHead className="font-bold">Carregador</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="font-bold text-center">Potência</TableHead>
            <TableHead className="font-bold text-center">Tipo</TableHead>
            <TableHead className="font-bold text-center">Nº Serial</TableHead>
            <TableHead className="font-bold text-center">Preço/kWh</TableHead>
            <TableHead className="font-bold text-center">Utilização</TableHead>
            <TableHead className="font-bold text-center">Receita (7d)</TableHead>
            <TableHead className="font-bold text-center">Sessões (7d)</TableHead>
            <TableHead className="font-bold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chargers.map((charger) => (
            <ChargerRow
              key={charger.id}
              charger={charger}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewQRCode={onViewQRCode}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
