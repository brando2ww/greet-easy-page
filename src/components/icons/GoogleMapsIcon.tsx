import googleMapsLogo from '@/assets/google-maps-logo.png';

interface GoogleMapsIconProps {
  size?: number;
  className?: string;
}

export const GoogleMapsIcon = ({ size = 40, className = '' }: GoogleMapsIconProps) => {
  return (
    <img 
      src={googleMapsLogo} 
      alt="Google Maps" 
      width={size} 
      height={size}
      className={className}
    />
  );
};
