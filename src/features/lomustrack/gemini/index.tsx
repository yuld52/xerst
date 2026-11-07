import { useState } from "react";
import { RiGlobalLine, RiInformationLine } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiInstructionsModal } from "./components/AiInstructionsModal";
import { useAiInstructions } from "@/hooks/useAiInstructions";

export default function GeminiPage() {
  const { instructions, save: saveInstructions } = useAiInstructions();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <RiGlobalLine className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">OpenRouter</h1>
            <p className="text-sm text-muted-foreground">
              IA centralizada para todas as contas da Lomus
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setInstructionsOpen(true)}>
          Instruções da IA
        </Button>
      </div>
      <Card className="max-w-3xl border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiGlobalLine className="size-5 text-primary" />
            Uma única API para toda a plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Todas as contas e usuários usam a mesma chave OpenRouter configurada pela Lomus. Não são
            usadas chaves individuais por cliente.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>OpenRouter</Badge>
            <Badge variant="secondary">Modelo global: OPENROUTER_MODEL</Badge>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <RiInformationLine className="mt-0.5 size-4 shrink-0" />
            <span>
              Configure OPENROUTER_API_KEY e OPENROUTER_MODEL no servidor. A chave nunca é exposta
              no navegador.
            </span>
          </div>
        </CardContent>
      </Card>
      <AiInstructionsModal
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        instructions={instructions}
        onSave={saveInstructions}
      />
    </div>
  );
}
