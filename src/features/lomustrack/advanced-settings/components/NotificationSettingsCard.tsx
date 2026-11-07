import { RiArrowRightLine, RiNotification3Line } from "@remixicon/react";
import { useNavigate } from "@/lib/import-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationSettingsCard() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RiNotification3Line className="size-5 text-primary" />
          <CardTitle>Configurações de notificações</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure notificações de vendas e relatórios em uma página dedicada.
        </p>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/notification-settings")}
        >
          Abrir configurações
          <RiArrowRightLine className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
