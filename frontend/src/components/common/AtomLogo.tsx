interface AtomLogoProps {
  className?: string;
  variant?: "primary" | "white";
}

const AtomLogo = ({ className = "w-9 h-9", variant = "primary" }: AtomLogoProps) => {
  const fillColor = variant === "white" ? "fill-white" : "fill-primary";
  const strokeColor = variant === "white" ? "stroke-white" : "stroke-primary";
  const strokeWidth = variant === "white" ? "5" : "3";
  const nucleusRadius = variant === "white" ? "10" : "8";
  
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Center nucleus */}
      <circle cx="50" cy="50" r={nucleusRadius} className={fillColor} />
      
      {/* Orbital rings */}
      <ellipse
        cx="50"
        cy="50"
        rx="40"
        ry="16"
        className={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="40"
        ry="16"
        className={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        transform="rotate(60 50 50)"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="40"
        ry="16"
        className={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        transform="rotate(-60 50 50)"
      />
    </svg>
  );
};

export default AtomLogo;
