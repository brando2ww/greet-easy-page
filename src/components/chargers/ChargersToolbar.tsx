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
    <div className="space-y-2 md:space-y-3">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 md:pl-10 h-9 md:h-10 text-sm backdrop-blur-sm bg-background/95 border-green-200/50"
        />
      </div>

      {/* Filtros - scroll horizontal no mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Filtrar:</span>
        </div>
        {statusOptions.map((option) => (
          <Badge
            key={option.value}
            variant={statusFilter === option.value ? "default" : "outline"}
            className={`cursor-pointer transition-all text-xs px-2 py-0.5 shrink-0 ${
              statusFilter === option.value
                ? "bg-green-500 text-white"
                : option.color
            }`}
            onClick={() => onStatusFilterChange(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>
    </div>
  );
};
