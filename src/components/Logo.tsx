import { Link } from "@tanstack/react-router";
import logo from "@/assets/replix-logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`}>
      <img src={logo} alt="Replix.ai" className="h-7 sm:h-8 w-auto" />
    </Link>
  );
}
