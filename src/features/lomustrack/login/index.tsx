import { useState } from "react";
import { useNavigate } from "@/lib/import-navigation";
import { loginUser } from "@/services/auth";
import { LoginForm } from "./form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: { email: string; password: string }) => {
    setError("");
    setLoading(true);

    try {
      await loginUser(data);
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Credenciais inválidas";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-static-light min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-2xl shadow-xl border border-border">
        {/* Logo e Cabeçalho */}
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-4 shadow-md p-2.5">
            <img
              src="/brand-logo.png"
              alt="LomusTrack"
              className="h-full w-auto object-contain"
              onError={(e) => {
                // Fallback caso imagem não carregue
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">LomusTrack</h1>
          <p className="text-sm text-gray-600">Portal de Gestão e Métricas</p>
        </div>

        {/* Formulário */}
        <LoginForm onSubmit={handleSubmit} error={error} loading={loading} />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            sessionStorage.setItem("mock_mode", "true");
            navigate("/dashboard?mock=true");
          }}
        >
          Explorar demonstração
        </Button>

        {/* Link rodapé */}
        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{" "}
            <a
              href="/setup"
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
            >
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
