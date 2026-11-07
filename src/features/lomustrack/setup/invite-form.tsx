import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";

interface InviteSetupFormProps {
  name: string;
  role: string;
  onSubmit: (data: { email: string; password: string; confirmPassword: string }) => void;
  error: string;
  loading: boolean;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  viewer: "Visualizador",
};

export function InviteSetupForm({ name, role, onSubmit, error, loading }: InviteSetupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password, confirmPassword });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Criar sua conta</h2>
        <Badge variant="outline" className="border-gray-300 text-[10px] text-gray-600">
          {roleLabels[role] ?? role}
        </Badge>
      </div>

      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
        <p className="text-xs text-gray-500">Você foi convidado como</p>
        <p className="text-sm font-medium text-gray-900">{name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-password" className="text-gray-700">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="invite-password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              {showPassword ? (
                <RiEyeOffLine className="size-4" />
              ) : (
                <RiEyeLine className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-confirm" className="text-gray-700">
            Confirmar Senha
          </Label>
          <div className="relative">
            <Input
              id="invite-confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              {showConfirm ? <RiEyeOffLine className="size-4" /> : <RiEyeLine className="size-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando..." : "Criar Conta"}
        </Button>
      </form>
    </div>
  );
}
