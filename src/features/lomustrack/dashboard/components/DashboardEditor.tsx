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
  DragStartEvent,
  useDraggable,
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
import { WidgetType } from "../types/widget";

export interface DashboardConfig {
  activeCards: string[];
  availableCards: string[];
}

const DEFAULT_CONFIG: DashboardConfig = {
  activeCards: ["kpis", "revenueChart", "paymentMethodChart", "topCampaigns", "hourlySalesChart", "salesByCountry"],
  availableCards: [],
};

const ALL_CARDS = ["kpis", "revenueChart", "paymentMethodChart", "topCampaigns", "hourlySalesChart", "salesByCountry"];

const CARD_LABELS: Record<string, { title: string; category: string; widgetType: WidgetType }> = {
  kpis: {
    title: "Resumo (KPIs)",
    category: "general",
    widgetType: WidgetType.KPI,
  },
  revenueChart: {
    title: "Faturamento Líquido",
    category: "charts",
    widgetType: WidgetType.REVENUE_CHART,
  },
  paymentMethodChart: {
    title: "Meios de Pagamento",
    category: "charts",
    widgetType: WidgetType.PAYMENT_METHOD_CHART,
  },
  hourlySalesChart: {
    title: "Vendas por Horário",
    category: "charts",
    widgetType: WidgetType.HOURLY_SALES_CHART,
  },
  salesByCountry: {
    title: "Vendas por País",
    category: "charts",
    widgetType: WidgetType.SALES_BY_COUNTRY,
  },
  topCampaigns: {
    title: "Top Campanhas",
    category: "rankings",
    widgetType: WidgetType.TOP_CAMPAIGNS,
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
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function SortableCardItem({ id, isActive, onClick, onDragStart, onDragEnd }: SortableCardItemProps) {
  const sortable = useSortable({ id, disabled: !isActive });
  const draggable = useDraggable({ id: `draggable-${id}`, disabled: isActive });

  const {
    attributes: sortAttributes,
    listeners: sortListeners,
    setNodeRef: setSortNodeRef,
    transform: sortTransform,
    transition: sortTransition,
    isDragging: isSortDragging,
  } = sortable;

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragNodeRef,
    transform: dragTransform,
    isDragging: isDragDragging,
  } = draggable;

  const isDragging = isSortDragging || isDragDragging;
  const transform = isActive ? sortTransform : dragTransform;
  const transition = isActive ? sortTransition : undefined;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardInfo = CARD_LABELS[id];

  const handleDragStart = () => {
    if (onDragStart) onDragStart();
  };

  const handleDragEnd = () => {
    if (onDragEnd) onDragEnd();
  };

  // Use sortable for active cards, draggable for inactive cards
  const ref = isActive ? setSortNodeRef : setDragNodeRef;
  const attributes = isActive ? sortAttributes : dragAttributes;
  const listeners = isActive ? sortListeners : {
    ...dragListeners,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  };

  return (
    <div
      ref={ref}
      style={style}
      {...attributes}
      {...listeners}
      onClick={!isActive ? onClick : undefined}
      className={`flex items-center gap-2 px-3 py-2.5 rounded transition-colors ${
        isActive 
          ? "cursor-grab active:cursor-grabbing text-foreground hover:bg-accent" 
          : "cursor-grab active:cursor-grabbing text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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
  onAddWidget?: (widgetType: WidgetType) => void;
}

export function DashboardEditor({ open, onOpenChange, config, onConfigChange, onAddWidget }: DashboardEditorProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    charts: true,
    rankings: true,
  });
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
  const [draggedWidgetType, setDraggedWidgetType] = useState<WidgetType | null>(null);

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

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = event.active.id.toString().replace("draggable-", "");
    const cardInfo = CARD_LABELS[cardId];
    if (cardInfo && !localConfig.activeCards.includes(cardId)) {
      setIsDraggingFromSidebar(true);
      setDraggedWidgetType(cardInfo.widgetType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Check if dragging from sidebar
    if (isDraggingFromSidebar && draggedWidgetType) {
      // Emit to parent to add widget
      if (onAddWidget) {
        onAddWidget(draggedWidgetType);
      }
      setIsDraggingFromSidebar(false);
      setDraggedWidgetType(null);
      return;
    }

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
            {isDraggingFromSidebar && (
              <SheetDescription className="text-primary">
                Arraste para o dashboard →
              </SheetDescription>
            )}
          </SheetHeader>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
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
                                onDragStart={() => {
                                  const cardInfo = CARD_LABELS[cardId];
                                  if (cardInfo && !isActive) {
                                    setIsDraggingFromSidebar(true);
                                    setDraggedWidgetType(cardInfo.widgetType);
                                  }
                                }}
                                onDragEnd={() => {
                                  setIsDraggingFromSidebar(false);
                                  setDraggedWidgetType(null);
                                }}
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
