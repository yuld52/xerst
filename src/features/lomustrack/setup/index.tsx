import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "@/lib/import-navigation";
import { createAdmin } from "@/services/auth";
import { getInviteInfo, completeInvite } from "@/services/users";
import { InviteSetupForm } from "./invite-form";
import { AuthForm } from "@/components/ui/auth-form";
import toast from "react-hot-toast";

export default function SetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{
    name: string;
    role: string;
    email?: string | null;
  } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteError, setInviteError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Auto-redirect to login after 5s when invite is invalid
  useEffect(() => {
    if (!inviteError) return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/login", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [inviteError, navigate]);

  // Load invite info if token present
  useEffect(() => {
    if (!inviteToken) return;
    setInviteLoading(true);
    getInviteInfo(inviteToken)
      .then(setInviteInfo)
      .catch((err) => setInviteError(err instanceof Error ? err.message : "Convite inválido"))
      .finally(() => setInviteLoading(false));
  }, [inviteToken]);

  // Regular setup (owner / sign up)
  const handleSetup = async (data: {
    name?: string;
    email: string;
    password?: string;
    confirmPassword?: string;
  }) => {
    if (!data.password) {
      setError("Senha é obrigatória");
      toast.error("Senha é obrigatória");
      return;
    }
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      setError("As senhas não coincidem");
      toast.error("As senhas não coincidem");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await createAdmin({
        name: data.name || data.email.split("@")[0],
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword || data.password,
      });
      toast.success("Conta criada com sucesso!");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Invite setup
  const handleInvite = async (data: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    setError("");
    setLoading(true);
    try {
      await completeInvite(inviteToken!, {
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
      });
      navigate(inviteInfo?.role === "superadmin" ? "/admin-login" : "/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  if (inviteToken) {
    if (inviteLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
        </div>
      );
    }
    if (inviteError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="rounded-xl border border-border bg-card shadow-2xl p-6 text-center space-y-3 max-w-md w-full">
            <p className="text-destructive font-medium">{inviteError}</p>
            <p className="text-muted-foreground text-sm">
              Redirecionando para o login em{" "}
              <span className="text-foreground font-medium">{redirectCountdown}s</span>...
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <InviteSetupForm
            name={inviteInfo?.name ?? ""}
            role={inviteInfo?.role ?? ""}
            lockedEmail={inviteInfo?.email ?? undefined}
            onSubmit={handleInvite}
            error={error}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      mode="signup"
      onSubmit={handleSetup}
      loading={loading}
      error={error}
    />
  );
}
