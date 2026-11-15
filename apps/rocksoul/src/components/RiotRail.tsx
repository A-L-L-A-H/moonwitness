import React from "react";
import { GitBranch, Home, ListChecks, RadioTower, Swords } from "lucide-react";

export interface RiotRailProps {
  page: string;
  onNavigate: (page: any) => void;
  onSwitchboard: () => void;
}

export default function RiotRail({ page, onNavigate, onSwitchboard }: RiotRailProps) {
  const items = [
    { id: "deck", label: "DECK", icon: <Home size={20} strokeWidth={2.4} /> },
    { id: "pit", label: "PIT", icon: <ListChecks size={20} strokeWidth={2.4} /> },
    { id: "git", label: "GIT", icon: <GitBranch size={20} strokeWidth={2.4} /> },
    { id: "war-room", label: "WAR ROOM", icon: <Swords size={20} strokeWidth={2.4} /> },
    { id: "noise", label: "NOISE", icon: <RadioTower size={20} strokeWidth={2.4} /> },
  ];
  return (
    <aside className="riot-rail">
      <div className="rail-mark">
        <span className="mark-skull">R</span>
        <span className="rail-brand">DX</span>
      </div>
      <nav className="rail-nav" aria-label="Main navigation">
        {items.map((item) => (
          <button
            key={item.id}
            className={`rail-item ${page === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="rail-bottom">
        <button className="switchboard" onClick={onSwitchboard} title="Open command switchboard">
          <RadioTower size={17} />
          <span>
            RIOT
            <br />
            SWITCH
          </span>
          <b>↘</b>
        </button>
        <div className="rail-sticker">
          ROCK
          <br />
          SOUL
        </div>
        <span className="rail-version">LOCAL BUILD / 0.1</span>
      </div>
    </aside>
  );
}
