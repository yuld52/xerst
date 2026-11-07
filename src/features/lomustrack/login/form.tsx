import React, { useState } from "react";
import { Input } from "@/components/ui/input-field";
import { Button } from "@/components/ui/action-button";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
  error: string;
  loading: boolean;
}

export function LoginForm({ onSubmit, error, loading }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email"
        id="login-email"
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Senha</label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center font-medium">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full py-3 text-base" isLoading={loading}>
        Entrar
      </Button>
    </form>
  );
}
