"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export interface AuthFormData {
  name?: string
  email: string
  password?: string
  confirmPassword?: string
}

export interface AuthFormProps {
  mode?: "login" | "signup" | "forgot-password" | "verify-code"
  onSubmit?: (data: AuthFormData) => void | Promise<void>
  loading?: boolean
  error?: string
  successMessage?: string
  onExploreDemo?: () => void
  onForgotPassword?: () => void
  // verify-code specific
  email?: string
  onResend?: () => void
  resending?: boolean
  countdown?: number
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode = "login",
  onSubmit,
  loading = false,
  error = "",
  successMessage,
  onExploreDemo,
  onForgotPassword,
  email,
}) => {
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
        <Logo />
        <Header mode={mode} email={email} />
        <FormSection
          mode={mode}
          onSubmit={onSubmit}
          loading={loading}
          error={error}
          successMessage={successMessage}
          onExploreDemo={onExploreDemo}
          onForgotPassword={onForgotPassword}
        />
        <TermsAndConditions />
      </motion.div>

      <BackgroundDecoration />
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => (
  <button
    className={`rounded-md bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2.5 text-base font-medium text-white 
    ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white 
    transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 disabled:opacity-50 disabled:pointer-events-none ${className}`}
    {...props}
  >
    {children}
  </button>
)

const Logo: React.FC = () => (
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
)

const Header: React.FC<{ mode: "login" | "signup" | "forgot-password" | "verify-code"; email?: string }> = ({ mode, email }) => {
  const isLogin = mode === "login"
  const isForgotPassword = mode === "forgot-password"
  const isVerifyCode = mode === "verify-code"

  return (
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {isForgotPassword
          ? "Recuperar senha"
          : isVerifyCode
            ? "Verificar email"
            : isLogin
              ? "Entre na sua conta"
              : "Crie sua conta"}
      </h1>
      {isForgotPassword && (
        <p className="mt-2 text-sm text-zinc-600">
          Informe seu e-mail cadastrado para receber o link de redefinição.
        </p>
      )}
      {isVerifyCode && (
        <p className="mt-2 text-sm text-zinc-600">
          Enviamos um código de 6 dígitos para <strong>{email || ""}</strong>. Verifique sua caixa de entrada e spam.
        </p>
      )}
    </div>
  )
}

const FormSection: React.FC<{
  mode: "login" | "signup" | "forgot-password" | "verify-code"
  onSubmit?: AuthFormProps["onSubmit"]
  loading: boolean
  error?: string
  successMessage?: string
  onExploreDemo?: () => void
  onForgotPassword?: () => void
  // verify-code specific
  email?: string
  onResend?: () => void
  resending?: boolean
  countdown?: number
}> = ({
  mode,
  onSubmit,
  loading,
  error,
  successMessage,
  onExploreDemo,
  onForgotPassword,
  email,
  onResend,
  resending,
  countdown,
}) => {
  const isLogin = mode === "login"
  const isForgotPassword = mode === "forgot-password"
  const isVerifyCode = mode === "verify-code"
  const [name, setName] = React.useState("")
  const [emailState, setEmailState] = React.useState(email || "")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit({ name, email: emailState, password, confirmPassword })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label
            htmlFor="name-input"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Nome Completo
          </label>
          <input
            id="name-input"
            type="text"
            required
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-zinc-300 
            bg-white px-3 py-2 text-sm text-zinc-900
            placeholder-zinc-400 
            ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="email-input"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Email
        </label>
        <input
          id="email-input"
          type="email"
          required
          placeholder="seu.email@empresa.com"
          value={emailState}
          onChange={(e) => setEmailState(e.target.value)}
          className="w-full rounded-md border border-zinc-300 
          bg-white px-3 py-2 text-sm text-zinc-900
          placeholder-zinc-400 
          ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {!isForgotPassword && !isVerifyCode && (
        <div>
          <div className="mb-1.5 flex items-end justify-between">
            <label
              htmlFor="password-input"
              className="block text-sm font-medium text-zinc-700"
            >
              Senha
            </label>
            {isLogin && (
              <a
                href="/forgot-password"
                onClick={(e) => {
                  e.preventDefault()
                  if (onForgotPassword) {
                    try {
                      onForgotPassword()
                    } catch {
                      window.location.href = "/forgot-password"
                      return
                    }
                  }
                  setTimeout(() => {
                    if (window.location.pathname !== "/forgot-password") {
                      window.location.href = "/forgot-password"
                    }
                  }, 50)
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Esqueceu a senha?
              </a>
            )}
          </div>
          <input
            id="password-input"
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-zinc-300 
            bg-white px-3 py-2 text-sm text-zinc-900
            placeholder-zinc-400 
            ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      )}

      {isVerifyCode && (
        <div>
          <label
            htmlFor="code-input"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Código de 6 dígitos
          </label>
          <input
            id="code-input"
            type="text"
            required
            maxLength={6}
            placeholder="123456"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-md border border-zinc-300 
            bg-white px-3 py-2 text-sm text-zinc-900
            placeholder-zinc-400 
            ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            text-center tracking-widest text-2xl font-mono"
            autoComplete="one-time-code"
            inputMode="numeric"
          />
        </div>
      )}

      {mode === "signup" && (
        <div>
          <label
            htmlFor="confirm-password-input"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Confirmar Senha
          </label>
          <input
            id="confirm-password-input"
            type="password"
            required
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-zinc-300 
            bg-white px-3 py-2 text-sm text-zinc-900
            placeholder-zinc-400 
            ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 text-center font-medium animate-in fade-in space-y-1">
          <p className="font-semibold">{successMessage}</p>
          <p className="text-xs text-zinc-500 font-normal">
            Verifique sua caixa de entrada e spam.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center font-medium animate-in fade-in">
          {error}
        </div>
      )}

      <div className="pt-2 space-y-3">
        <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          <span>
            {isForgotPassword
              ? successMessage
                ? "Reenviar e-mail"
                : "Enviar instruções"
              : isVerifyCode
                ? "Verificar código"
                : isLogin
                  ? "Entrar na plataforma"
                  : "Criar minha conta"}
          </span>
        </Button>

        {isLogin && onExploreDemo && (
          <button
            type="button"
            onClick={onExploreDemo}
            className="w-full py-2.5 px-4 text-sm font-medium rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            Explorar demonstração
          </button>
        )}

        <div className="text-center pt-2">
          <p className="text-sm text-zinc-500">
            {isForgotPassword ? (
              <>
                Lembrou sua senha?{" "}
                <a
                  href="/login"
                  className="text-blue-600 font-medium hover:underline hover:text-blue-700 transition-colors"
                >
                  Fazer login.
                </a>
              </>
            ) : isVerifyCode ? (
              <>
                <button
                  type="button"
                  onClick={onResend}
                  disabled={resending || countdown > 0}
                  className="text-blue-600 font-medium hover:underline hover:text-blue-700 transition-colors disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                  {countdown > 0
                    ? `Reenviar código (${countdown}s)`
                    : "Não recebeu? Reenviar código"}
                </button>
              </>
            ) : isLogin ? (
              <>
                Não tem uma conta?{" "}
                <a
                  href="/setup"
                  className="text-blue-600 font-medium hover:underline hover:text-blue-700 transition-colors"
                >
                  Criar conta.
                </a>
              </>
            ) : (
              <>
                Já possui uma conta?{" "}
                <a
                  href="/login"
                  className="text-blue-600 font-medium hover:underline hover:text-blue-700 transition-colors"
                >
                  Fazer login.
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </form>
  )
}

const TermsAndConditions: React.FC = () => (
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
)

const BackgroundDecoration: React.FC = () => {
  return (
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
  )
}

export default AuthForm
