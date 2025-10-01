import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import speedLogo from "@/assets/speed_logo_01.png";

export default function Estacoes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { t } = useTranslation();

  const filterChips = [
    t('stations.all'),
    t('stations.fast'),
    t('stations.available')
  ];

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const header = (
    <div className="p-4 space-y-3">
      <div className="flex justify-start mb-2">
        <img 
          src={speedLogo} 
          alt="Speed Charger" 
          className="h-12"
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
            key={chip}
            variant={activeFilters.includes(chip) ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-4 py-2"
            onClick={() => toggleFilter(chip)}
          >
            {chip}
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <ResponsiveLayout mobileHeader={header} showBottomNav>
      <div className="h-[calc(100vh-240px)] bg-muted flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('stations.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('stations.mapPlaceholder')}
          </p>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
