"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { SkinProvider } from "@moonwitness/ui";
import { ThemeBootstrap } from "./theme-bootstrap";

export function Providers({ children }: { children: ReactNode }) {
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeBootstrap />
      <RootSkinProvider>{children}</RootSkinProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function RootSkinProvider({ children }: { children: ReactNode }) {
  return <SkinProvider defaultSkin="default">{children}</SkinProvider>;
}
