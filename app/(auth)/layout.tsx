// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Layout simples SEM SIDEBAR para login/cadastro/callback
  return <>{children}</>
}