import { Providers } from "@/components/providers";

export default function ConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Providers>{children}</Providers>;
}
