import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import speedLogo from "@/assets/nexcharge-logo-new.png";
import { StationsMap } from "@/components/map/StationsMap";
import { useChargers } from "@/hooks/useChargers";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import { cn } from "@/lib/utils";

export default function Estacoes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const { t } = useTranslation();
  const { data: chargers, isLoading, error, refetch } = useChargers();

  // Debug logging
  console.log('[Estacoes] Render state:', { 
    isLoading, 
    chargersCount: chargers?.length ?? 0,
    error: error?.message,
    hasMapboxToken: !!MAPBOX_TOKEN
  });

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
    <div className="p-4">
      <div className="flex justify-start">
        <img 
          src={speedLogo} 
          alt="Speed Charger" 
          className="h-10"
        />
      </div>
    </div>
  );

  const floatingControls = (
    <div className="absolute top-4 left-4 right-4 z-10 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('stations.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-background/90 backdrop-blur-sm shadow-lg border-0"
          />
        </div>
        <Button size="icon" variant="outline" className="h-11 w-11 bg-background/90 backdrop-blur-sm shadow-lg border-0">
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterChips.map((chip) => (
          <Badge
            key={chip.key}
            variant={activeFilters.includes(chip.key) ? "default" : "outline"}
            className={cn(
              "cursor-pointer whitespace-nowrap px-4 py-2 transition-colors shadow-md",
              activeFilters.includes(chip.key) 
                ? "bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground border-primary" 
                : "bg-background/90 backdrop-blur-sm hover:bg-primary/5 dark:hover:bg-primary/10"
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
    <ResponsiveLayout mobileHeader={header} showBottomNav noBorder>
      <div className="h-full flex flex-col relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center flex-col gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('stations.loading')}</p>
          </div>
        ) : error ? (
          <div className="h-full bg-muted flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('common.error')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error.message}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                {t('common.retry')}
              </Button>
            </div>
          </div>
        ) : filteredChargers.length === 0 ? (
          <div className="h-full bg-muted flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('stations.noChargers')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('stations.tryDifferentFilters')}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                {t('common.retry')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {floatingControls}
            <StationsMap chargers={filteredChargers} mapboxToken={MAPBOX_TOKEN} />
          </>
        )}
      </div>
    </ResponsiveLayout>
  );
}
