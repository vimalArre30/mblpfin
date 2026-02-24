import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "navy";
}

export default function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  const base = "rounded-2xl p-8 transition-shadow duration-200";
  const variants = {
    default: "bg-white border border-border shadow-sm hover:shadow-md",
    navy: "bg-navy text-white",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
