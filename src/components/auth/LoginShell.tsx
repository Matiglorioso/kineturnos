import { AuthPageShell } from "@/components/auth/AuthPageShell";

interface LoginShellProps {
  children: React.ReactNode;
}

export function LoginShell({ children }: LoginShellProps) {
  return <AuthPageShell>{children}</AuthPageShell>;
}
