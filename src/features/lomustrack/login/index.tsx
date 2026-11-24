import { useState } from "react";
import { useNavigate } from "@/lib/import-navigation";
import { loginUser } from "@/services/auth";
import toast from "react-hot-toast";
import { AuthForm } from "@/components/ui/auth-form";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: { email: string; password?: string }) => {
    if (!data.password) return;
    setError("");
    setLoading(true);

    try {
      await loginUser({ email: data.email, password: data.password });
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

  const handleForgotPassword = () => {
    navigate("/forgot-password");
    // Fallback garantido caso o SPA router não altere a rota
    setTimeout(() => {
      if (window.location.pathname !== "/forgot-password") {
        window.location.href = "/forgot-password";
      }
    }, 50);
  };

  return (
    <AuthForm
      mode="login"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      onForgotPassword={handleForgotPassword}
    />
  );
}
