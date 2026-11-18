"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";

export default function DynamicModelPage() {
  const params = useParams<{ model: string }>();
  const modelName = decodeURIComponent(params?.model ?? "");
  const [search, setSearch] = useState("");

  return (
    <ConsoleShellAdapter
      breadcrumb={modelName || "Model Explorer"}
      plane="creator"
      search={{
        value: search,
        onChange: setSearch,
        placeholder: `Filter ${modelName || "model"} view…`,
      }}
    >
      {modelName ? <AutoModelConsole model={modelName} /> : null}
    </ConsoleShellAdapter>
  );
}
