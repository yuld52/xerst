import { useEffect, useState } from "react";
import { RiMore2Line, RiFileCopyLine, RiCloudLine, RiPencilLine, RiDeleteBinLine, RiToggleLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/services/api";
import { toast } from "sonner";

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
  const [editCredential, setEditCredential] = useState<ApiCredential | null>(null);
  const [editName, setEditName] = useState("");
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

  const toggleCredential = async (credential: ApiCredential) => {
    try {
      await apiRequest(`/platforms/credentials/${credential.id}`, {
        method: "PATCH",
        body: { active: !credential.active },
      });
      setCredentials((current) =>
        current.map((c) => (c.id === credential.id ? { ...c, active: !c.active } : c))
      );
      toast.success(
        credential.active 
          ? "Credencial desativada com sucesso" 
          : "Credencial ativada com sucesso"
      );
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Não foi possível alterar o status da credencial"
      );
    }
  };

  const updateCredentialName = async (id: number, name: string) => {
    try {
      await apiRequest(`/platforms/credentials/${id}`, {
        method: "PATCH",
        body: { name },
      });
      setCredentials((current) => current.map((c) => (c.id === id ? { ...c, name } : c)));
      toast.success("Nome da credencial atualizado com sucesso");
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Não foi possível atualizar o nome da credencial"
      );
      throw error;
    }
  };

  const deleteCredential = async (id: number) => {
    try {
      await apiRequest(`/platforms/credentials/${id}`, { method: "DELETE" });
      setCredentials((current) => current.filter((credential) => credential.id !== id));
      onDeleteCredential?.(String(id));
      toast.success("Credencial deletada com sucesso");
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Não foi possível deletar a credencial"
      );
    }
  };

  return (
    <>
      <Card className="rounded-lg border-border/40">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/40">
          <h4 className="text-base font-semibold">Credenciais de API</h4>
          <RiCloudLine className="size-5 text-muted-foreground mb-[1px]" />
        </div>

        {/* Body */}
        <div className="pt-2 pb-0 px-5 space-y-6">
          <p className="text-sm text-muted-foreground">
            Adicione credenciais de API para integrar com outras ferramentas:
          </p>

          {loading && (
            <div className="space-y-5">
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {!loading && credentials.length > 0 && (
            <div className="space-y-5">
              {credentials.map((credential) => (
                <div key={credential.id} className="relative">
                  <div className="border border-border rounded-md px-5 py-[1.1rem] w-full">
                    <div>
                      <p className="font-bold text-sm mb-0">{credential.name}</p>
                      <div className="text-sm text-muted-foreground mt-[0.2rem]">
                        Status: {credential.active ? "Ativado" : "Desativado"}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-accent"
                          >
                            <RiMore2Line className="size-[18px]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={() => toggleCredential(credential)}
                            className="cursor-pointer"
                          >
                            <RiToggleLine className="size-4 mr-2" />
                            {credential.active ? "Desativar" : "Ativar"} Credencial de API
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditCredential(credential);
                              setEditName(credential.name);
                            }}
                            className="cursor-pointer"
                          >
                            <RiPencilLine className="size-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => void deleteCredential(credential.id)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <RiDeleteBinLine className="size-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={() => setCredentialOpen(true)} className="w-full mb-6">
            Adicionar Credencial
          </Button>
        </div>
      </Card>
      
      {/* Edit Credential Dialog */}
      <Dialog open={!!editCredential} onOpenChange={(open) => !open && setEditCredential(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Credencial</DialogTitle>
            <DialogDescription>
              Altere o nome da credencial de API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              placeholder="Nome da Credencial"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditCredential(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (editCredential && editName.trim()) {
                  try {
                    await updateCredentialName(editCredential.id, editName.trim());
                    setEditCredential(null);
                  } catch {
                    // Erro já tratado no updateCredentialName
                  }
                }
              }}
              disabled={!editName.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialModal
        open={credentialOpen}
        onOpenChange={setCredentialOpen}
        onCreated={createCredential}
      />
    </>
  );
}
