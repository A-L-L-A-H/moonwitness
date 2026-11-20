"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SkinProvider } from "@moonwitness/ui";
import { stripLocalePrefix } from "@/utils/i18n";

const ProvidersMountedContext = createContext(false);

export function Providers({ children }: { children: ReactNode }) {
  const isMounted = useContext(ProvidersMountedContext);
  if (isMounted) {
    return <>{children}</>;
  }
  return <RootProvidersInner>{children}</RootProvidersInner>;
}

function RootProvidersInner({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    const onSessionChange = () => {
      void queryClient.invalidateQueries({ queryKey: ["app", "auth"] });
      void queryClient.invalidateQueries({ queryKey: ["control", "auth"] });
    };
    const onTenantChanged = () => {
      void queryClient.invalidateQueries({ refetchType: "active" });
    };
    window.addEventListener("mw:session-change", onSessionChange);
    window.addEventListener("mw:tenant-changed", onTenantChanged);
    return () => {
      window.removeEventListener("mw:session-change", onSessionChange);
      window.removeEventListener("mw:tenant-changed", onTenantChanged);
    };
  }, [queryClient]);

  return (
    <ProvidersMountedContext.Provider value={true}>
      <QueryClientProvider client={queryClient}>
        <RootSkinProvider>{children}</RootSkinProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ProvidersMountedContext.Provider>
  );
}

function RootSkinProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const cleanPath = stripLocalePrefix(pathname);
  const isSanctuaryPath =
    cleanPath === "/" ||
    cleanPath === "/scriptures" ||
    cleanPath === "/codex" ||
    cleanPath === "/mtime";

  return (
    <SkinProvider
      defaultSkin="default"
      defaultDna={isSanctuaryPath ? "01-imperium-lumen" : undefined}
      scope={isSanctuaryPath ? "local" : "document"}
      persist={!isSanctuaryPath}
    >
      {children}
    </SkinProvider>
  );
}
