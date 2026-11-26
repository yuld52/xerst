import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "@/lib/import-navigation";
import { resetPassword } from "@/services/auth";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [mounted, setMounted] = useState(false);

  // Prevent any automatic redirects
  useEffect(() => {
    console.log("=== Reset Password Page Mounted ===");
    console.log("Token present:", !!token);
    console.log("Token value:", token);
    console.log("Current pathname:", window.location.pathname);
    console.log("Search params:", window.location.search);
    setMounted(true);
    
    // Garantir que não há redirecionamento automático
    return () => {
      console.log("=== Reset Password Page Unmounted ===");
    };
  }, [token]);

  // Adicionar log quando o componente renderiza
  console.log("Reset Password Page Rendering - Mounted:", mounted);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== Form Submitted ===");
    console.log("Token:", token);
    console.log("Password length:", password.length);
    console.log("Passwords match:", password === confirmPassword);
    
    if (!token) {
      setError("Token inválido ou expirado. Solicite nova recuperação.");
      toast.error("Token inválido ou expirado");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log("=== Calling resetPassword API ===");
      const res = await resetPassword(token, password, confirmPassword);
      console.log("=== API Response ===", res);
      
      setSuccessMessage(res.message || "Senha redefinida com sucesso!");
      toast.success("Senha redefinida com sucesso!");

      console.log("=== Will redirect to login in 2 seconds ===");
      setTimeout(() => {
        console.log("=== Redirecting to login now ===");
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("=== Error resetting password ===", err);
      const msg = err instanceof Error ? err.message : "Erro ao redefinir senha";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar log quando o componente renderiza
  console.log("Reset Password Page Rendering - Mounted:", mounted);

  // Aguardar montagem antes de renderizar
  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="theme-static-light relative min-h-screen bg-white py-12 px-4 text-zinc-800 selection:bg-zinc-200 flex flex-col justify-center items-center overflow-hidden"
      style={{ backgroundColor: "#ffffff" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-full max-w-xl p-6 sm:p-8 bg-white rounded-2xl border border-zinc-200 shadow-xl"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center justify-center gap-2">
          <img
            src="/brand-logo.png"
            alt="LomusTrack"
            className="size-10 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none"
            }}
          />
          <span className="text-2xl font-bold tracking-tight text-zinc-900">
            LomusTrack
          </span>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Redefinir senha
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Digite sua nova senha abaixo.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password-input"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Nova Senha
            </label>
            <input
              id="password-input"
              type="password"
              required
              minLength={6}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password-input"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Confirmar Nova Senha
            </label>
            <input
              id="confirm-password-input"
              type="password"
              required
              minLength={6}
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              disabled={loading}
            />
          </div>

          {!token && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 text-center font-medium">
              Token inválido ou expirado.{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log("=== Clicking forgot-password link ===");
                  navigate("/forgot-password");
                }}
                className="underline font-semibold cursor-pointer hover:text-amber-800"
              >
                Solicite nova recuperação
              </button>.
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 text-center font-medium animate-in fade-in">
              <p className="font-semibold">{successMessage}</p>
              <p className="text-xs text-zinc-500 font-normal mt-1">
                Redirecionando para o login...
              </p>
            </div>
          )}

          {error && error !== "Token inválido ou expirado. Solicite nova recuperação de senha." && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2.5 text-base font-medium text-white ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              <span>Redefinir senha</span>
            </button>

            <div className="text-center pt-2">
              <p className="text-sm text-zinc-500">
                Lembrou sua senha?{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("=== Clicking login link ===");
                    navigate("/login");
                  }}
                  className="text-blue-600 font-medium hover:underline hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Fazer login.
                </button>
              </p>
            </div>
          </div>
        </form>

        {/* Terms */}
        <p className="mt-8 text-center text-xs text-zinc-500">
          Ao prosseguir, você concorda com nossos{" "}
          <a href="#" className="text-blue-600 hover:underline hover:text-blue-700">
            Termos & Condições
          </a>{" "}
          e{" "}
          <a href="#" className="text-blue-600 hover:underline hover:text-blue-700">
            Política de Privacidade
          </a>
          .
        </p>
      </motion.div>

      {/* Background */}
      <div
        className="absolute right-0 top-0 z-0 size-[50vw] max-w-[600px] pointer-events-none opacity-80"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(30 58 138 / 0.12)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(100% 100% at 100% 0%, rgba(255,255,255,0), rgba(255,255,255,1))",
          }}
        />
      </div>
    </div>
  );
}