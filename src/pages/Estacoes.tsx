import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import speedLogo from "@/assets/nexcharge-logo-new.png";
import { StationsMap } from "@/components/map/StationsMap";
import { useChargers } from "@/hooks/useChargers";
import { MAPBOX_TOKEN } from "@/config/mapbox";

export default function Estacoes() {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();
  const { data: chargers, isLoading, error, refetch } = useChargers();

  const filteredChargers = useMemo(() => {
    if (!chargers) return [];
    if (!searchQuery) return chargers;
    const query = searchQuery.toLowerCase();
    return chargers.filter(
      (charger) =>
        charger.name.toLowerCase().includes(query) ||
        charger.location.toLowerCase().includes(query)
    );
  }, [chargers, searchQuery]);

  const header = (
    <div className="px-4 pt-1 pb-1 overflow-hidden">
      <div className="flex justify-center">
        <img 
          src={speedLogo} 
          alt="Speed Charger" 
          className="h-12"
        />
      </div>
    </div>
  );

  const floatingControls = (
    <div className="absolute top-10 left-4 right-4 z-10">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('stations.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-background/90 backdrop-blur-sm shadow-lg border-0 rounded-full"
          />
        </div>
        <Button size="icon" variant="outline" className="h-11 w-11 bg-background/90 backdrop-blur-sm shadow-lg border-0 rounded-full">
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
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
