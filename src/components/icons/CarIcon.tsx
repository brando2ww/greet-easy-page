interface CarIconProps {
  className?: string;
  strokeWidth?: number;
}

export const CarIcon = ({ className, strokeWidth = 1.5 }: CarIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Silhueta de carro esportivo lateral */}
      <path d="M3 16h2v2H3z" />
      <path d="M19 16h2v2h-2z" />
      <path d="M7 18h10" />
      <path d="M5 13l2-5h10l2 5" />
      <path d="M3 13h18v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3z" />
      <path d="M7 8l1-3h8l1 3" />
    </svg>
  );
};
