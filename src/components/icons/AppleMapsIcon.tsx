import appleMapsLogo from '@/assets/apple-maps-logo.png';

interface AppleMapsIconProps {
  size?: number;
  className?: string;
}

export const AppleMapsIcon = ({ size = 40, className = '' }: AppleMapsIconProps) => {
  return (
    <img 
      src={appleMapsLogo} 
      alt="Apple Maps" 
      width={size} 
      height={size}
      className={className}
    />
  );
};
