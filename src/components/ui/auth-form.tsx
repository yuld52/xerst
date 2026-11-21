"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"

export interface AuthFormData {
  name?: string
  email: string
  password?: string
  confirmPassword?: string
}

export interface AuthFormProps {
  mode?: "login" | "signup" | "forgot-password"
  onSubmit?: (data: AuthFormData) => void | Promise<void>
  loading?: boolean
  error?: string
  successMessage?: string
  onExploreDemo?: () => void
  onForgotPassword?: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode = "login",
  onSubmit,
  loading = false,
  error = "",
  successMessage,
  onExploreDemo,
  onForgotPassword,
}) => {
  return (
    <div className="relative min-h-screen bg-white dark:bg-zinc-950 py-12 px-4 text-zinc-800 dark:text-zinc-200 selection:bg-zinc-300 dark:selection:bg-zinc-600 flex flex-col justify-center items-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-full max-w-xl p-6 sm:p-8 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl"
      >
        <Logo />
        <Header mode={mode} />
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
    className={`rounded-md bg-gradient-to-br from-blue-500 to-blue-700 px-4 py-2.5 text-base font-medium text-zinc-50 
    ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 
    transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 disabled:opacity-50 disabled:pointer-events-none ${className}`}
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
    <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
      LomusTrack
    </span>
  </div>
)

const Header: React.FC<{ mode: "login" | "signup" | "forgot-password" }> = ({ mode }) => {
  const isLogin = mode === "login"
  const isForgotPassword = mode === "forgot-password"

  return (
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {isForgotPassword
          ? "Recuperar senha"
          : isLogin
            ? "Entre na sua conta"
            : "Crie sua conta"}
      </h1>
      {isForgotPassword && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Informe seu e-mail cadastrado para receber o link de redefinição.
        </p>
      )}
    </div>
  )
}

const FormSection: React.FC<{
  mode: "login" | "signup" | "forgot-password"
  onSubmit?: AuthFormProps["onSubmit"]
  loading: boolean
  error?: string
  successMessage?: string
  onExploreDemo?: () => void
  onForgotPassword?: () => void
}> = ({
  mode,
  onSubmit,
  loading,
  error,
  successMessage,
  onExploreDemo,
  onForgotPassword,
}) => {
  const isLogin = mode === "login"
  const isForgotPassword = mode === "forgot-password"
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit({ name, email, password, confirmPassword })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label
            htmlFor="name-input"
            className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
            bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200
            placeholder-zinc-400 dark:placeholder-zinc-500 
            ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="email-input"
          className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
        >
          Email
        </label>
        <input
          id="email-input"
          type="email"
          required
          placeholder="seu.email@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
          bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200
          placeholder-zinc-400 dark:placeholder-zinc-500 
          ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {!isForgotPassword && (
        <div>
          <div className="mb-1.5 flex items-end justify-between">
            <label
              htmlFor="password-input"
              className="block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline cursor-pointer"
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
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
            bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200
            placeholder-zinc-400 dark:placeholder-zinc-500 
            ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      )}

      {mode === "signup" && (
        <div>
          <label
            htmlFor="confirm-password-input"
            className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
            bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200
            placeholder-zinc-400 dark:placeholder-zinc-500 
            ring-1 ring-transparent transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-sm text-emerald-600 dark:text-emerald-400 text-center font-medium animate-in fade-in space-y-1">
          <p className="font-semibold">{successMessage}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
            Verifique sua caixa de entrada e spam.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400 text-center font-medium animate-in fade-in">
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
              : isLogin
                ? "Entrar na plataforma"
                : "Criar minha conta"}
          </span>
        </Button>

        {isLogin && onExploreDemo && (
          <button
            type="button"
            onClick={onExploreDemo}
            className="w-full py-2.5 px-4 text-sm font-medium rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            Explorar demonstração
          </button>
        )}

        <div className="text-center pt-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isForgotPassword ? (
              <>
                Lembrou sua senha?{" "}
                <a
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline transition-colors"
                >
                  Fazer login.
                </a>
              </>
            ) : isLogin ? (
              <>
                Não tem uma conta?{" "}
                <a
                  href="/setup"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline transition-colors"
                >
                  Criar conta.
                </a>
              </>
            ) : (
              <>
                Já possui uma conta?{" "}
                <a
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline transition-colors"
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
  <p className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
    Ao prosseguir, você concorda com nossos{" "}
    <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
      Termos & Condições
    </a>{" "}
    e{" "}
    <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
      Política de Privacidade
    </a>
    .
  </p>
)

const BackgroundDecoration: React.FC = () => {
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  return (
    <div
      className="absolute right-0 top-0 z-0 size-[50vw] max-w-[600px] pointer-events-none opacity-80"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(30 58 138 / 0.5)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isDarkTheme
            ? "radial-gradient(100% 100% at 100% 0%, rgba(9,9,11,0), rgba(9,9,11,1))"
            : "radial-gradient(100% 100% at 100% 0%, rgba(255,255,255,0), rgba(255,255,255,1))",
        }}
      />
    </div>
  )
}

export default AuthForm
