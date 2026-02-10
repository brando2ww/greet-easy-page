

## Fix: Distance Calculation Has Swapped Coordinates

### Problem
The distance shown (e.g., 3066.3 km) is wrong because `userLocation` is stored as `[longitude, latitude]` (Mapbox convention), but the distance calculation destructures it as `[userLat, userLon]` -- the values are swapped, producing incorrect results.

### Solution
Fix the destructuring in `ChargerDetailsDrawer.tsx` to match the `[longitude, latitude]` format.

### Technical Change

**File: `src/components/map/ChargerDetailsDrawer.tsx` (line 44)**

Change:
```typescript
const [userLat, userLon] = userLocation;
```
To:
```typescript
const [userLon, userLat] = userLocation;
```

This single-line fix ensures latitude and longitude are correctly assigned, producing accurate Haversine distance calculations.

