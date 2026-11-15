import React from "react";
import { Activity, ChevronDown, Command, FolderGit2, Settings2 } from "lucide-react";
import { CrimsonCrownSvg } from "./ui/RocksoulVectors";
import type { Repository } from "../lib/contracts";

export interface TopbarProps {
  repositories: Repository[];
  selectedRepository: string;
  onRepositoryChange: (repositoryId: string) => void;
  onCommand: () => void;
  onSettings: () => void;
}

export default function Topbar({
  repositories,
  selectedRepository,
  onRepositoryChange,
  onCommand,
  onSettings,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <CrimsonCrownSvg className="brand-crown-img" />
        <span>
          ROCKSOUL <b>- DX</b>
        </span>
        <small>MAKE TOOLS. BREAK RULES. SHIP CHAOS.</small>
      </div>
      <div className="topbar-context">
        <div className="context-chip">
          <FolderGit2 size={15} />
          <span>
            WORKSPACE: <b>PRIVATE / LOCAL</b>
          </span>
          <ChevronDown size={13} />
        </div>
        <label className="context-chip repo-picker">
          <GitBranchIcon />
          <select
            aria-label="Selected repository"
            value={selectedRepository}
            onChange={(e) => onRepositoryChange(e.target.value)}
          >
            <option value="">NO REPOSITORY SELECTED</option>
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.name}
              </option>
            ))}
          </select>
          <ChevronDown size={13} />
        </label>
        <span className="local-pill">
          <i /> LOCAL MODE
        </span>
      </div>
      <div className="topbar-actions">
        <Activity size={18} className="system-pulse" />
        <button className="shortcut" onClick={onCommand}>
          <Command size={14} /> CTRL + K
        </button>
        <button className="icon-button" aria-label="Settings" onClick={onSettings}>
          <Settings2 size={19} />
        </button>
        <div className="avatar">RS</div>
      </div>
    </header>
  );
}

function GitBranchIcon() {
  return <FolderGit2 size={15} />;
}
