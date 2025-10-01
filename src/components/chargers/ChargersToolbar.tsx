import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChargersToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const ChargersToolbar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ChargersToolbarProps) => {
  const statusOptions = [
    { value: "all", label: "Todos", color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
    { value: "available", label: "Disponível", color: "bg-green-100 text-green-700 hover:bg-green-200" },
    { value: "in_use", label: "Em Uso", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    { value: "maintenance", label: "Manutenção", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
    { value: "offline", label: "Offline", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  ];

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou localização..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 backdrop-blur-sm bg-background/95 border-green-200/50 focus:border-green-400"
        />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtrar:</span>
        </div>
        {statusOptions.map((option) => (
          <Badge
            key={option.value}
            variant={statusFilter === option.value ? "default" : "outline"}
            className={`cursor-pointer transition-all duration-200 ${
              statusFilter === option.value
                ? "bg-green-500 text-white hover:bg-green-600"
                : option.color
            }`}
            onClick={() => onStatusFilterChange(option.value)}
          >
            {option.label}
          </Badge>
        ))}
        {statusFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusFilterChange("all")}
            className="text-xs"
          >
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
};
