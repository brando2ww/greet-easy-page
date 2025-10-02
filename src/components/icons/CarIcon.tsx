import carFrontIcon from "@/assets/car-front-icon.png";

interface CarIconProps {
  className?: string;
  strokeWidth?: number;
}

export const CarIcon = ({ className }: CarIconProps) => {
  return (
    <img 
      src={carFrontIcon} 
      alt="Car icon" 
      className={className}
    />
  );
};
