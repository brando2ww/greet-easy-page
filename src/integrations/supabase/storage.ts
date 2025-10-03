import { toast } from "@/hooks/use-toast";

const STORAGE_PREFIX = 'sb-';

// Custom storage adapter with error handling
export const customStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        
        // Try to clean up old Supabase data
        cleanupSupabaseStorage();
        
        // Try again after cleanup
        try {
          localStorage.setItem(key, value);
          console.log('Successfully saved after cleanup');
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError);
          toast({
            title: "Armazenamento Cheio",
            description: "Por favor, limpe os dados do navegador em Configurações.",
            variant: "destructive",
          });
          throw retryError;
        }
      } else {
        console.error('Error writing to localStorage:', error);
        throw error;
      }
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

// Clean up old Supabase storage data
function cleanupSupabaseStorage() {
  try {
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
    
    console.log(`Found ${supabaseKeys.length} Supabase storage keys`);
    
    // Keep only the most recent auth token, remove everything else
    const authTokenKey = supabaseKeys.find(key => key.includes('auth-token'));
    
    supabaseKeys.forEach(key => {
      if (key !== authTokenKey) {
        try {
          localStorage.removeItem(key);
          console.log(`Removed: ${key}`);
        } catch (error) {
          console.error(`Failed to remove ${key}:`, error);
        }
      }
    });
    
    toast({
      title: "Limpeza Realizada",
      description: "Dados antigos foram removidos do armazenamento.",
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Check storage space and perform preventive cleanup if needed
export function checkAndCleanupStorage() {
  try {
    // Test if we can write to localStorage
    const testKey = '__storage_test__';
    const testValue = 'x'.repeat(1024); // 1KB test
    
    try {
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage is near capacity, performing cleanup...');
        cleanupSupabaseStorage();
      }
    }
  } catch (error) {
    console.error('Error checking storage:', error);
  }
}
