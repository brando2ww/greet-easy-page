import { removeBackground, loadImage } from './removeBackground';
import carFrontIcon from '@/assets/car-front-icon.png';

export const processCarIconBackground = async () => {
  try {
    // Load the car icon
    const response = await fetch(carFrontIcon);
    const blob = await response.blob();
    const imageElement = await loadImage(blob);
    
    // Remove background
    const processedBlob = await removeBackground(imageElement);
    
    // Convert to data URL for preview
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(processedBlob);
    });
  } catch (error) {
    console.error('Error processing car icon:', error);
    throw error;
  }
};
