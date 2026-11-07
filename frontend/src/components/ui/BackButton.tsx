import type { FC } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export interface BackButtonProps {
  label?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
}

export const BackButton: FC<BackButtonProps> = ({
  label = "Back to Dashboard",
  to,
  onClick,
  className = "",
}) => {
  const commonClasses =
    "group inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-150 py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-zinc-800/50 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  const content = (
    <>
      <ArrowLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-1 text-zinc-400 group-hover:text-accent" />
      <span>{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${commonClasses} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${commonClasses} ${className}`}>
      {content}
    </button>
  );
};
