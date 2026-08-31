import type { Cell } from "../../types/game";

interface SquareProps {
  value: Cell;
  onClick: () => void;
}

export default function Square({ value, onClick }: SquareProps) {
  return (
    <button
      onClick={onClick}
      className="
        flex h-24 w-24
        items-center justify-center
        rounded-xl
        border border-slate-700
        bg-slate-900
        text-4xl font-bold
        text-white
        shadow-sm
        transition-all duration-200
        hover:scale-[1.02]
        hover:bg-slate-800
        active:scale-95
        sm:h-28 sm:w-28
      "
    >
      {value === "circle" ? "⭕" : value === "cross" ? "❌" : ""}
    </button>
  );
}