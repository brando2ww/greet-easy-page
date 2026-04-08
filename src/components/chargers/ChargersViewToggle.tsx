import { LayoutGrid, List, BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ViewMode = "cards" | "list" | "analytics";

interface ChargersViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ChargersViewToggle = ({ view, onViewChange }: ChargersViewToggleProps) => {
  return (
    <Tabs value={view} onValueChange={(v) => onViewChange(v as ViewMode)}>
      <TabsList className="bg-primary/5 backdrop-blur-sm">
        <TabsTrigger value="cards" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Cards</span>
        </TabsTrigger>
        <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">Lista</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Analytics</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
