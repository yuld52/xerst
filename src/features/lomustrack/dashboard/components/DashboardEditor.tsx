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
}

function SortableCardItem({ id, isActive }: SortableCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

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
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "shadow-lg" : ""
      } ${isActive ? "bg-primary/10 border-primary" : "bg-card"}`}
    >
      <RiDraggable className="size-5 text-muted-foreground" />
      
      <span className="font-medium text-sm flex-1">{cardInfo.title}</span>
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
        
        // If dragging within activeCards, reorder
        if (prev.activeCards.includes(activeId) && prev.activeCards.includes(overId)) {
          const oldIndex = prev.activeCards.indexOf(activeId);
          const newIndex = prev.activeCards.indexOf(overId);
          const newActiveCards = arrayMove(prev.activeCards, oldIndex, newIndex);
          
          return { ...prev, activeCards: newActiveCards };
        }
        
        // If dragging from available to active
        if (prev.availableCards.includes(activeId) && prev.activeCards.includes(overId)) {
          const newAvailableCards = prev.availableCards.filter(id => id !== activeId);
          const targetIndex = prev.activeCards.indexOf(overId);
          const newActiveCards = [...prev.activeCards];
          newActiveCards.splice(targetIndex, 0, activeId);
          
          return {
            activeCards: newActiveCards,
            availableCards: newAvailableCards,
          };
        }
        
        // If dragging from active to available (remove from dashboard)
        if (prev.activeCards.includes(activeId) && prev.availableCards.includes(overId)) {
          const newActiveCards = prev.activeCards.filter(id => id !== activeId);
          const newAvailableCards = [...prev.availableCards, activeId];
          
          return {
            activeCards: newActiveCards,
            availableCards: newAvailableCards,
          };
        }
        
        return prev;
      });
    }
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
      <SheetContent side="right" className="w-[90%] md:w-[500px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Métricas Disponíveis</SheetTitle>
          <SheetDescription>
            Arraste os cards para adicionar ao dashboard ou reordenar
          </SheetDescription>
        </SheetHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {/* Active Cards Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary">No Dashboard</h3>
              <SortableContext
                items={localConfig.activeCards}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 min-h-[100px] p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
                  {localConfig.activeCards.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Arraste cards aqui para adicionar ao dashboard
                    </p>
                  ) : (
                    localConfig.activeCards.map((cardId) => (
                      <SortableCardItem
                        key={cardId}
                        id={cardId}
                        isActive={true}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>

            {/* Available Cards by Category */}
            {CATEGORIES.map((category) => {
              const cards = getCardsForCategory(category.id);
              const availableCardsInCategory = cards.filter(id => localConfig.availableCards.includes(id));
              
              if (availableCardsInCategory.length === 0) return null;

              return (
                <Collapsible
                  key={category.id}
                  open={openSections[category.id]}
                  onOpenChange={() => toggleSection(category.id)}
                >
                  <div className="space-y-2">
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold hover:text-primary transition-colors">
                      <span>{category.title}</span>
                      {openSections[category.id] ? (
                        <RiArrowUpSLine className="size-5" />
                      ) : (
                        <RiArrowDownSLine className="size-5" />
                      )}
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-2">
                      <SortableContext
                        items={availableCardsInCategory}
                        strategy={verticalListSortingStrategy}
                      >
                        {availableCardsInCategory.map((cardId) => (
                          <SortableCardItem
                            key={cardId}
                            id={cardId}
                            isActive={false}
                          />
                        ))}
                      </SortableContext>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </DndContext>

        {/* Footer Actions */}
        <div className="mt-8 space-y-3">
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Salvar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
