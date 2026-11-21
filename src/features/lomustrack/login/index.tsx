import { useState } from "react";
import { useNavigate } from "@/lib/import-navigation";
import { loginUser } from "@/services/auth";
import toast from "react-hot-toast";
import { AuthForm } from "@/components/ui/auth-form";

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

  const handleExploreDemo = () => {
    sessionStorage.setItem("mock_mode", "true");
    navigate("/dashboard?mock=true");
  };

  return (
    <AuthForm
      mode="login"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      onExploreDemo={handleExploreDemo}
    />
  );
}
