interface SectionLabelProps {
  children: string;
  light?: boolean;
}

export default function SectionLabel({ children, light = false }: SectionLabelProps) {
  return (
    <p
      className={`font-inter text-xs font-semibold uppercase tracking-[0.15em] mb-3 ${
        light ? "text-blue-200" : "text-navy"
      }`}
    >
      {children}
    </p>
  );
}
