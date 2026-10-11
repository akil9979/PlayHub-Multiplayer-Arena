import React from "react";

interface GameListProps {
  onSelect: (gameId: string) => void;
}

interface GameItem {
  id: string;
  title: string;
  description: string;
  available: boolean;
  players: string;
  icon: React.ReactNode;
}

const GAMES: GameItem[] = [
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    description: "Live 1v1 turn-based battle",
    available: true,
    players: "1v1 Online",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <path d="M4.5 4.5l3 3M7.5 4.5l-3 3" />
        <circle cx="18" cy="6" r="1.5" />
      </svg>
    ),
  },
  {
    id: "connect-four",
    title: "Connect Four",
    description: "Drop tokens & align 4 in a row",
    available: false,
    players: "1v1 Online",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
        <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
        <circle cx="16.5" cy="7.5" r="1.5" fill="currentColor" />
        <circle cx="7.5" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="16.5" cy="12" r="1.5" fill="currentColor" />
        <circle cx="7.5" cy="16.5" r="1.5" fill="currentColor" />
        <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
        <circle cx="16.5" cy="16.5" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "chess",
    title: "Chess",
    description: "Timed multiplayer chess matches",
    available: false,
    players: "1v1 Online",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21H5v-2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2z" />
        <path d="M17 18H7a3 3 0 0 1-3-3v-2c0-1.5 1-3 2.5-3.5L8 9V6a3 3 0 0 1 3-3h1a4 4 0 0 1 4 4v2l1.5 2c1.5.5 2.5 2 2.5 3.5v2a3 3 0 0 1-3 3z" />
        <circle cx="11.5" cy="7.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "battleship",
    title: "Battleship",
    description: "Tactical naval fleet coordinates",
    available: false,
    players: "1v1 Online",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 18l2 3h16l2-3-4-4H6l-4 4z" />
        <path d="M6 14l2-6h8l2 6" />
        <line x1="12" y1="4" x2="12" y2="8" />
        <line x1="10" y1="5" x2="14" y2="5" />
      </svg>
    ),
  },
];

export default function GameList({ onSelect }: GameListProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {GAMES.map((game) => {
          if (game.available) {
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => onSelect(game.id)}
                className="group flex flex-col justify-between text-left rounded-xl border border-[#27272a] bg-[#0a0a0b] p-4 sm:p-5 transition-colors hover:border-[#3f3f46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b] min-h-[44px] cursor-pointer"
              >
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#27272a] bg-[#18181b] text-[#22c55e]">
                      {game.icon}
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#22c55e]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                      Playable
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#fafafa]">
                      {game.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex w-full items-center justify-between border-t border-[#27272a] pt-3 text-xs text-[#71717a]">
                  <span>{game.players}</span>
                  <span className="font-semibold text-[#22c55e] group-hover:translate-x-0.5 transition-transform motion-reduce:transform-none">
                    Play Now →
                  </span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={game.id}
              type="button"
              disabled
              aria-disabled="true"
              className="flex flex-col justify-between text-left rounded-xl border border-[#27272a] bg-[#0a0a0b] p-4 sm:p-5 opacity-60 cursor-not-allowed select-none min-h-[44px]"
            >
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#27272a] bg-[#18181b] text-[#71717a]">
                    {game.icon}
                  </div>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    Coming soon
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#a1a1aa]">
                    {game.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#71717a] leading-relaxed">
                    {game.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex w-full items-center justify-between border-t border-[#27272a] pt-3 text-xs text-[#71717a]">
                <span>{game.players}</span>
                <span className="text-[11px] text-[#71717a]">In development</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
