import { useState, useEffect } from "react";
import { RiCheckLine, RiDraggable, RiArrowDownSLine, RiArrowUpSLine } from "@remixicon/react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface DashboardConfig {
  kpis: boolean;
  revenueChart: boolean;
  paymentMethodChart: boolean;
  topCampaigns: boolean;
  hourlySalesChart: boolean;
  salesByCountry: boolean;
  order: string[];
}

const DEFAULT_CONFIG: DashboardConfig = {
  kpis: true,
  revenueChart: true,
  paymentMethodChart: true,
  topCampaigns: true,
  hourlySalesChart: true,
  salesByCountry: true,
  order: ["kpis", "revenueChart", "paymentMethodChart", "topCampaigns", "hourlySalesChart", "salesByCountry"],
};

const CARD_LABELS: Record<string, { title: string; description: string; category: string }> = {
  kpis: {
    title: "Resumo (KPIs)",
    description: "Cards com métricas principais: faturamento, vendas, ticket médio, etc.",
    category: "general",
  },
  revenueChart: {
    title: "Faturamento Líquido",
    description: "Gráfico de linha com faturamento diário",
    category: "charts",
  },
  paymentMethodChart: {
    title: "Meios de Pagamento",
    description: "Distribuição por forma de pagamento",
    category: "charts",
  },
  hourlySalesChart: {
    title: "Vendas por Horário",
    description: "Gráfico de barras com vendas por hora do dia",
    category: "charts",
  },
  salesByCountry: {
    title: "Vendas por País",
    description: "Mapa interativo com vendas por localização",
    category: "charts",
  },
  topCampaigns: {
    title: "Top Campanhas",
    description: "Lista das campanhas com melhor desempenho",
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
  checked: boolean;
  onToggle: () => void;
}

function SortableCardItem({ id, checked, onToggle }: SortableCardItemProps) {
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
      className={`flex items-center gap-2 p-3 rounded-lg border bg-card ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <RiDraggable className="size-5" />
      </div>
      
      <Label
        htmlFor={id}
        className="flex flex-col space-y-1 cursor-pointer flex-1"
      >
        <span className="font-medium text-sm">{cardInfo.title}</span>
      </Label>
      
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onToggle}
      />
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
        const oldIndex = prev.order.indexOf(active.id as string);
        const newIndex = prev.order.indexOf(over.id as string);
        const newOrder = arrayMove(prev.order, oldIndex, newIndex);
        
        return { ...prev, order: newOrder };
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

  const handleReset = () => {
    setLocalConfig(DEFAULT_CONFIG);
  };

  const toggleCard = (key: keyof DashboardConfig) => {
    setLocalConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const getCardsForCategory = (categoryId: string) => {
    return localConfig.order.filter((cardId) => CARD_LABELS[cardId]?.category === categoryId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[90%] md:w-[500px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Métricas Disponíveis</SheetTitle>
            <SheetDescription>
              Arraste os cards para reordenar e ative/desative os que deseja visualizar
            </SheetDescription>
          </SheetHeader>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-4">
              {CATEGORIES.map((category) => {
                const cards = getCardsForCategory(category.id);
                if (cards.length === 0) return null;

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
                          items={cards}
                          strategy={verticalListSortingStrategy}
                        >
                          {cards.map((cardId) => (
                            <SortableCardItem
                              key={cardId}
                              id={cardId}
                              checked={localConfig[cardId as keyof DashboardConfig] as boolean}
                              onToggle={() => toggleCard(cardId as keyof DashboardConfig)}
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
