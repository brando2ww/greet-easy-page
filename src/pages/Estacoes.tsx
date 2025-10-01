import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import speedLogo from "@/assets/speed_logo_01.png";
import { StationsMap } from "@/components/map/StationsMap";
import { useChargers } from "@/hooks/useChargers";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import { cn } from "@/lib/utils";

export default function Estacoes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { t } = useTranslation();
  const { data: chargers, isLoading } = useChargers();

  const filterChips = [
    { key: 'all', label: t('stations.all') },
    { key: 'available', label: t('stations.available') },
    { key: 'fast', label: t('stations.fast') },
  ];

  const toggleFilter = (filterKey: string) => {
    setActiveFilters(prev =>
      prev.includes(filterKey)
        ? prev.filter(f => f !== filterKey)
        : [...prev, filterKey]
    );
  };

  // Filter chargers based on search and active filters
  const filteredChargers = useMemo(() => {
    if (!chargers) return [];

    let filtered = chargers;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (charger) =>
          charger.name.toLowerCase().includes(query) ||
          charger.location.toLowerCase().includes(query)
      );
    }

    // Apply status filters
    if (activeFilters.length > 0 && !activeFilters.includes('all')) {
      filtered = filtered.filter((charger) => {
        if (activeFilters.includes('available')) {
          return charger.status === 'available';
        }
        if (activeFilters.includes('fast')) {
          return charger.power >= 50;
        }
        return true;
      });
    }

    return filtered;
  }, [chargers, searchQuery, activeFilters]);

  const header = (
    <div className="p-4 space-y-3">
      <div className="flex justify-start mb-2">
        <img 
          src={speedLogo} 
          alt="Speed Charger" 
          className="h-16"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('stations.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Button size="icon" variant="outline" className="h-11 w-11">
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterChips.map((chip) => (
          <Badge
            key={chip.key}
            variant={activeFilters.includes(chip.key) ? "default" : "outline"}
            className={cn(
              "cursor-pointer whitespace-nowrap px-4 py-2 transition-colors",
              activeFilters.includes(chip.key) 
                ? "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white border-green-500" 
                : "hover:bg-green-50 dark:hover:bg-green-950"
            )}
            onClick={() => toggleFilter(chip.key)}
          >
            {chip.label}
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <ResponsiveLayout mobileHeader={header} showBottomNav>
      <div className="h-full flex flex-col">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredChargers.length === 0 ? (
          <div className="h-full bg-muted flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('stations.noChargers')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('stations.tryDifferentFilters')}
              </p>
            </div>
          </div>
        ) : (
          <StationsMap chargers={filteredChargers} mapboxToken={MAPBOX_TOKEN} />
        )}
      </div>
    </ResponsiveLayout>
  );
}
