import { useState, useEffect } from "react";
import { RiDraggable, RiArrowDownSLine, RiArrowUpSLine } from "@remixicon/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface DashboardConfig {
  activeCards: string[];
  availableCards: string[];
}

const DEFAULT_CONFIG: DashboardConfig = {
  activeCards: ["kpis", "revenueChart", "paymentMethodChart", "topCampaigns", "hourlySalesChart", "salesByCountry"],
  availableCards: [],
};

const ALL_CARDS = ["kpis", "revenueChart", "paymentMethodChart", "topCampaigns", "hourlySalesChart", "salesByCountry"];

const CARD_LABELS: Record<string, { title: string; category: string }> = {
  kpis: {
    title: "Resumo (KPIs)",
    category: "general",
  },
  revenueChart: {
    title: "Faturamento Líquido",
    category: "charts",
  },
  paymentMethodChart: {
    title: "Meios de Pagamento",
    category: "charts",
  },
  hourlySalesChart: {
    title: "Vendas por Horário",
    category: "charts",
  },
  salesByCountry: {
    title: "Vendas por País",
    category: "charts",
  },
  topCampaigns: {
    title: "Top Campanhas",
    category: "rankings",
  },
};

const CATEGORIES = [
  { id: "general", title: "Geral" },
  { id: "charts", title: "Gráficos Avançados" },
  { id: "rankings", title: "Rankings" },
];

interface SortableCardItemProps {
  id: string;
  isActive: boolean;
  onClick?: () => void;
}

function SortableCardItem({ id, isActive, onClick }: SortableCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isActive });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardInfo = CARD_LABELS[id];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isActive ? attributes : {})}
      {...(isActive ? listeners : {})}
      onClick={!isActive ? onClick : undefined}
      className={`flex items-center gap-2 px-3 py-2.5 rounded transition-colors ${
        isActive 
          ? "cursor-grab active:cursor-grabbing text-foreground hover:bg-accent" 
          : "cursor-pointer text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      } ${isDragging ? "bg-primary/20" : ""}`}
    >
      <span className="text-sm flex-1">{cardInfo.title}</span>
    </div>
  );
}

interface DashboardEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DashboardConfig;
  onConfigChange: (config: DashboardConfig) => void;
}

export function DashboardEditor({ open, onOpenChange, config, onConfigChange }: DashboardEditorProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    charts: true,
    rankings: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open) {
      setLocalConfig(config);
    }
  }, [open, config]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalConfig((prev) => {
        const activeId = active.id as string;
        const overId = over.id as string;
        
        // Only reorder within activeCards
        if (prev.activeCards.includes(activeId) && prev.activeCards.includes(overId)) {
          const oldIndex = prev.activeCards.indexOf(activeId);
          const newIndex = prev.activeCards.indexOf(overId);
          const newActiveCards = arrayMove(prev.activeCards, oldIndex, newIndex);
          
          return { ...prev, activeCards: newActiveCards };
        }
        
        return prev;
      });
    }
  };

  const handleCardClick = (cardId: string) => {
    setLocalConfig((prev) => {
      // If card is active, remove it
      if (prev.activeCards.includes(cardId)) {
        return {
          activeCards: prev.activeCards.filter(id => id !== cardId),
          availableCards: [...prev.availableCards, cardId],
        };
      }
      // If card is available, add it
      else {
        return {
          activeCards: [...prev.activeCards, cardId],
          availableCards: prev.availableCards.filter(id => id !== cardId),
        };
      }
    });
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalConfig(config);
    onOpenChange(false);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const getCardsForCategory = (categoryId: string) => {
    return ALL_CARDS.filter((cardId) => CARD_LABELS[cardId]?.category === categoryId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] overflow-y-auto p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle>Métricas Disponíveis</SheetTitle>
          </SheetHeader>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-1">
                {CATEGORIES.map((category) => {
                  const cards = getCardsForCategory(category.id);
                  
                  return (
                    <Collapsible
                      key={category.id}
                      open={openSections[category.id]}
                      onOpenChange={() => toggleSection(category.id)}
                    >
                      <div className="space-y-1">
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors text-muted-foreground">
                          {openSections[category.id] ? (
                            <RiArrowDownSLine className="size-4 mr-2" />
                          ) : (
                            <RiArrowUpSLine className="size-4 mr-2 rotate-180" />
                          )}
                          <span className="flex-1 text-left">{category.title}</span>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="space-y-1 pl-6">
                          {cards.map((cardId) => {
                            const isActive = localConfig.activeCards.includes(cardId);
                            
                            return (
                              <SortableCardItem
                                key={cardId}
                                id={cardId}
                                isActive={isActive}
                                onClick={() => handleCardClick(cardId)}
                              />
                            );
                          })}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          </DndContext>

          {/* Footer Actions */}
          <div className="p-6 pt-4 border-t mt-auto">
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
