import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";

interface SetupFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => void;
  error: string;
  loading: boolean;
}

export function SetupForm({ onSubmit, error, loading }: SetupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, password, confirmPassword });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xl">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">Configuração Inicial</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="setup-name" className="text-gray-700">
            Nome
          </Label>
          <Input
            id="setup-name"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="setup-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-password" className="text-gray-700">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="setup-password"
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
          <Label htmlFor="setup-confirm" className="text-gray-700">
            Confirmar Senha
          </Label>
          <div className="relative">
            <Input
              id="setup-confirm"
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
