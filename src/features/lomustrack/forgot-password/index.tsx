import { useState } from "react";
import { useNavigate } from "@/lib/import-navigation";
import { requestPasswordReset } from "@/services/auth";
import toast from "react-hot-toast";
import { AuthForm, type AuthFormData } from "@/components/ui/auth-form";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (data: AuthFormData) => {
    setError("");
    setLoading(true);

    try {
      const res = await requestPasswordReset(data.email);
      setSuccessMessage(res.message || "Instruções enviadas para o seu e-mail!");
      toast.success("Instruções enviadas para o seu e-mail!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao solicitar recuperação de senha";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      mode="forgot-password"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      successMessage={successMessage}
    />
  );
}
