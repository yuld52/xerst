import { useState } from "react";
import { useNavigate, useSearchParams } from "@/lib/import-navigation";
import { verifySignupCode, resendVerificationCode } from "@/services/auth";
import toast from "react-hot-toast";
import { AuthForm, type AuthFormData } from "@/components/ui/auth-form";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  const handleVerify = async (data: AuthFormData) => {
    setError("");
    setLoading(true);

    try {
      const res = await verifySignupCode({ email, code: data.password });
      setSuccessMessage(res.message || "Email verificado!");

      if (res.access_token && res.user) {
        // Login automático
        localStorage.setItem("user", JSON.stringify(res.user));
        document.cookie = `access_token=${res.access_token}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Código inválido ou expirado";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError("");

    try {
      const res = await resendVerificationCode({ email });
      toast.success(res.message || "Novo código enviado!");
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao reenviar código";
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthForm
      mode="verify-code"
      onSubmit={handleVerify}
      loading={loading}
      error={error}
      successMessage={successMessage}
      email={email}
      onResend={handleResend}
      resending={resending}
      countdown={countdown}
    />
  );
}