// Utility to clean up localStorage on app initialization

export function initializeStorageCleanup() {
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Calculate approximate storage usage
    let totalSize = 0;
    keys.forEach(key => {
      const value = localStorage.getItem(key) || '';
      totalSize += key.length + value.length;
    });
    
    // If storage is over 80% full (assuming ~5MB limit), clean up
    const approximateLimit = 5 * 1024 * 1024; // 5MB
    const usagePercent = (totalSize / approximateLimit) * 100;
    
    console.log(`localStorage usage: ~${usagePercent.toFixed(2)}% (${(totalSize / 1024).toFixed(2)}KB)`);
    
    if (usagePercent > 80) {
      console.warn('localStorage usage is high, cleaning up old data...');
      
      // Remove non-essential data
      const nonEssentialPatterns = [
        'debug',
        'temp',
        'cache',
        'old',
      ];
      
      keys.forEach(key => {
        const lowerKey = key.toLowerCase();
        if (nonEssentialPatterns.some(pattern => lowerKey.includes(pattern))) {
          try {
            localStorage.removeItem(key);
            console.log(`Removed non-essential key: ${key}`);
          } catch (error) {
            console.error(`Failed to remove ${key}:`, error);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error during storage initialization cleanup:', error);
  }
}
