import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CheckoutFields({
  url,
  setUrl,
  platform,
  setPlatform,
  name,
  setName,
}: {
  url: string;
  setUrl: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  name: string;
  setName: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Nome do Checkout</Label>
        <Input
          id="edit-name"
          placeholder="Ex: Checkout Principal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-url">URL do Checkout</Label>
        <Input
          id="edit-url"
          placeholder="https://pay.hotmart.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label>Plataforma</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hotmart">Hotmart</SelectItem>
            <SelectItem value="api">API</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function NonCheckoutFields({
  externalId,
  setExternalId,
  name,
  setName,
}: {
  externalId: string;
  setExternalId: (v: string) => void;
  name: string;
  setName: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-external-id">ID Externo</Label>
        <Input
          id="edit-external-id"
          placeholder="Ex: R3A674"
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-name">Nome</Label>
        <Input
          id="edit-name"
          placeholder="Ex: E-book Receitas"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </div>
  );
}
