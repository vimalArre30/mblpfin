import Link from "next/link";
import { ReactNode } from "react";

interface ButtonProps {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  className?: string;
  external?: boolean;
}

export default function Button({
  href,
  variant = "primary",
  children,
  className = "",
  external = false,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-inter font-semibold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2";

  const variants = {
    primary: "bg-navy text-white hover:bg-navy-dark shadow-sm hover:shadow-md",
    secondary:
      "border-2 border-navy text-navy bg-transparent hover:bg-navy hover:text-white",
    ghost: "text-navy hover:underline underline-offset-4",
  };

  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      {...externalProps}
    >
      {children}
    </Link>
  );
}
