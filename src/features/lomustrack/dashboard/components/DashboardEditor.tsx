import { useState, useEffect } from "react";
import { RiCheckLine, RiDraggable } from "@remixicon/react";
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

const CARD_LABELS: Record<string, { title: string; description: string }> = {
  kpis: {
    title: "Resumo (KPIs)",
    description: "Cards com métricas principais: faturamento, vendas, ticket médio, etc.",
  },
  revenueChart: {
    title: "Faturamento Líquido",
    description: "Gráfico de linha com faturamento diário",
  },
  paymentMethodChart: {
    title: "Meios de Pagamento",
    description: "Distribuição por forma de pagamento",
  },
  hourlySalesChart: {
    title: "Vendas por Horário",
    description: "Gráfico de barras com vendas por hora do dia",
  },
  salesByCountry: {
    title: "Vendas por País",
    description: "Mapa interativo com vendas por localização",
  },
  topCampaigns: {
    title: "Top Campanhas",
    description: "Lista das campanhas com melhor desempenho",
  },
};

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
        <span className="font-medium">{cardInfo.title}</span>
        <span className="text-xs text-muted-foreground">
          {cardInfo.description}
        </span>
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[90%] md:w-[500px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Editar Dashboard</SheetTitle>
            <SheetDescription>
              Arraste os cards para reordenar e ative/desative os que deseja visualizar
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localConfig.order}
                strategy={verticalListSortingStrategy}
              >
                {localConfig.order.map((cardId) => (
                  <SortableCardItem
                    key={cardId}
                    id={cardId}
                    checked={localConfig[cardId as keyof DashboardConfig] as boolean}
                    onToggle={() => toggleCard(cardId as keyof DashboardConfig)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 space-y-3">
            <Button onClick={handleReset} variant="outline" className="w-full">
              Restaurar padrão
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <RiCheckLine className="size-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
  );
}
