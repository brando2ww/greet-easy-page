import wazeLogo from '@/assets/waze-logo.png';

interface WazeIconProps {
  size?: number;
  className?: string;
}

export const WazeIcon = ({ size = 40, className = '' }: WazeIconProps) => {
  return (
    <img 
      src={wazeLogo} 
      alt="Waze" 
      width={size} 
      height={size}
      className={className}
    />
  );
};
