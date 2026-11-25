import { useState } from "react";
import { useNavigate, useSearchParams } from "@/lib/import-navigation";
import { resetPassword } from "@/services/auth";
import toast from "react-hot-toast";
import { AuthForm, type AuthFormData } from "@/components/ui/auth-form";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (data: AuthFormData) => {
    if (!token) {
      setError("Token inválido ou expirado. Solicite nova recuperação.");
      toast.error("Token inválido ou expirado");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await resetPassword(token, data.password, data.confirmPassword || data.password);
      setSuccessMessage(res.message || "Senha redefinida com sucesso!");
      toast.success("Senha redefinida com sucesso!");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao redefinir senha";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      mode="signup"
      onSubmit={handleSubmit}
      loading={loading}
      error={!token ? "Token inválido ou expirado. Solicite nova recuperação de senha." : error}
      successMessage={successMessage}
    />
  );
}