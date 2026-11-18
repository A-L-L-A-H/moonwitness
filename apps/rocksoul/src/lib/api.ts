import { invoke, type InvokeArgs } from "@tauri-apps/api/core";
import type { CommandArguments, CommandResult, NativeCommand } from "./contracts";
import { handlePreviewContinuityCommand } from "./preview-continuity";
import { handlePreviewWorkCommand } from "./preview-work";

export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function call<Command extends NativeCommand>(
  command: Command,
  args?: CommandArguments<Command>,
): Promise<CommandResult<Command>> {
  const commandArgs = (args ?? {}) as CommandArguments<Command>;
  if (isDesktop()) {
    return invoke(command, commandArgs as unknown as InvokeArgs) as Promise<CommandResult<Command>>;
  }

  const payload = commandArgs as Record<string, unknown>;
  const continuity = handlePreviewContinuityCommand(command, payload);
  if (continuity.handled) {
    return continuity.value as CommandResult<Command>;
  }

  const work = handlePreviewWorkCommand(command, payload);
  if (work.handled) {
    return work.value as CommandResult<Command>;
  }

  throw new Error(`Unsupported native command: ${command}`);
}
