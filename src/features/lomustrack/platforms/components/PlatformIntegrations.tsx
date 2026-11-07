import { useEffect, useState } from "react";
import { RiCloudLine, RiFileCopyLine, RiDeleteBinLine, RiKey2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/services/api";

interface ApiCredential {
  id: number;
  name: string;
  token?: string;
  token_prefix?: string;
  created_at?: string;
  last_used_at?: string | null;
  active: boolean;
}

function CredentialModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (input: { name: string }) => Promise<ApiCredential>;
}) {
  const [name, setName] = useState("");
  const [created, setCreated] = useState<ApiCredential | null>(null);
  const [copied, setCopied] = useState(false);

  const close = (value: boolean) => {
    if (!value) {
      setName("");
      setCreated(null);
      setCopied(false);
    }
    onOpenChange(value);
  };

  const create = async () => {
    if (!name.trim()) return;
    const credential = await onCreated({ name: name.trim() });
    setCreated(credential);
  };

  const copy = async () => {
    if (!created?.token) return;
    await navigator.clipboard.writeText(created.token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        {!created ? (
          <>
            <DialogHeader>
              <DialogTitle>Criar Credencial de API</DialogTitle>
              <DialogDescription>
                Use esta credencial para integrar outras ferramentas ao LomusTrack.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="credential-name">Nome</Label>
              <Input
                id="credential-name"
                placeholder="Nome da Credencial"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={!name.trim()} className="w-full">
                Criar Credencial
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Credencial criada com sucesso <span aria-label="sucesso">✅</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">ATENÇÃO!</p>
                <p className="mt-3">
                  O token abaixo só ficará visível neste momento.
                  <br />
                  Salve-o em um lugar seguro:
                </p>
              </div>
              <div className="space-y-2">
                <Label>API Token</Label>
                <div className="flex gap-2">
                  <Input value={created.token} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copy} title="Copiar token">
                    <RiFileCopyLine className="size-4" />
                  </Button>
                </div>
                {copied && <p className="text-xs text-emerald-600">Token copiado.</p>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => close(false)} className="w-full">
                Finalizar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PlatformIntegrations({
  onDeleteCredential,
}: {
  onDeleteCredential?: (id: string) => void;
}) {
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<ApiCredential[]>("/platforms/credentials")
      .then(setCredentials)
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false));
  }, []);

  const createCredential = async (input: { name: string }) => {
    const created = await apiRequest<ApiCredential>("/platforms/credentials", {
      method: "POST",
      body: { name: input.name },
    });
    setCredentials((current) => [created, ...current]);
    return created;
  };
  const deleteCredential = async (id: number) => {
    await apiRequest(`/platforms/credentials/${id}`, { method: "DELETE" });
    setCredentials((current) => current.filter((credential) => credential.id !== id));
    onDeleteCredential?.(String(id));
  };

  return (
    <>
      <div className="grid gap-6">
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="border-b py-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <RiCloudLine className="size-5" />
              Credenciais de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <p className="text-sm text-muted-foreground">
              Adicione credenciais de API para integrar com outras ferramentas:
            </p>
            {loading && <p className="text-sm text-muted-foreground">Carregando credenciais...</p>}
            {credentials.length > 0 && (
              <div className="space-y-2">
                {credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{credential.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {credential.active ? "Ativado" : "Desativado"} · {credential.token_prefix}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void deleteCredential(credential.id)}
                      title="Excluir credencial"
                    >
                      <RiDeleteBinLine className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={() => setCredentialOpen(true)} className="gap-1.5">
              <RiKey2Line className="size-4" />
              Adicionar Credencial
            </Button>
          </CardContent>
        </Card>
      </div>
      <CredentialModal
        open={credentialOpen}
        onOpenChange={setCredentialOpen}
        onCreated={createCredential}
      />
    </>
  );
}
