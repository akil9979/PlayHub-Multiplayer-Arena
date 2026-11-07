import type { ReactNode } from "react";
import { ArrowRight, Crown, Grid3X3, Layers, Ship } from "lucide-react";

interface GameListProps {
  onSelect: (gameId: string) => void;
}

interface GameItem {
  id: string;
  title: string;
  description: string;
  available: boolean;
  players: string;
  icon: ReactNode;
}

const GAMES: GameItem[] = [
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    description: "Live 1v1 turn-based battle",
    available: true,
    players: "1v1 Online",
    icon: <Grid3X3 className="w-5 h-5 text-accent" />,
  },
  {
    id: "connect-four",
    title: "Connect Four",
    description: "Drop tokens & align 4 in a row",
    available: false,
    players: "1v1 Online",
    icon: <Layers className="w-5 h-5 text-zinc-400" />,
  },
  {
    id: "chess",
    title: "Chess",
    description: "Timed multiplayer chess matches",
    available: false,
    players: "1v1 Online",
    icon: <Crown className="w-5 h-5 text-zinc-400" />,
  },
  {
    id: "battleship",
    title: "Battleship",
    description: "Tactical naval fleet coordinates",
    available: false,
    players: "1v1 Online",
    icon: <Ship className="w-5 h-5 text-zinc-400" />,
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
                className="group flex flex-col justify-between text-left rounded-2xl border border-emerald-500/30 bg-[#121217] p-5 transition-all duration-150 hover:border-emerald-500/50 hover:bg-[#14141a] hover:shadow-[0_8px_30px_-6px_rgba(34,197,94,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] cursor-pointer"
              >
                <div className="space-y-3.5 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/30">
                      {game.icon}
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Playable
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-display">
                      {game.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex w-full items-center justify-between border-t border-zinc-800/80 pt-3 text-xs text-zinc-500">
                  <span>{game.players}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-accent group-hover:translate-x-0.5 transition-transform motion-reduce:transform-none">
                    <span>Play Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
              className="flex flex-col justify-between text-left rounded-2xl border border-zinc-800/80 bg-[#101014] p-5 opacity-60 cursor-not-allowed select-none min-h-[44px]"
            >
              <div className="space-y-3.5 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-[#16161c]">
                    {game.icon}
                  </div>
                  <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    Coming soon
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-zinc-300 font-display">
                    {game.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    {game.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex w-full items-center justify-between border-t border-zinc-800/80 pt-3 text-xs text-zinc-600">
                <span>{game.players}</span>
                <span className="text-[11px] text-zinc-500">In development</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
