

## Add Cost Estimate Per Hour to Charger Details

### What Changes
Below the "R$ 0,80/kWh" price line, add an estimate showing how much 1 hour of charging costs at that charger, based on its power output.

Formula: `estimatedCostPerHour = charger.power * charger.pricePerKwh`

Example for a 7 kW charger at R$ 0,80/kWh: **~R$ 5,60/h**

### Technical Change

**File: `src/components/map/ChargerDetailsDrawer.tsx` (lines 193-205)**

Add a line below the price showing the hourly estimate:

```typescript
{/* Price */}
<div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
    <span className="text-sm font-semibold text-green-600">R$</span>
  </div>
  <div>
    <p className="text-xs text-muted-foreground">
      {t('stations.pricePerKwh')}
    </p>
    <p className="text-sm font-medium">
      R$ {charger.pricePerKwh.toFixed(2)}/kWh
    </p>
    <p className="text-xs text-muted-foreground mt-0.5">
      Estimativa (1h): ~R$ {(charger.power * charger.pricePerKwh).toFixed(2)}
    </p>
  </div>
</div>
```

This gives users immediate clarity on actual cost, reducing confusion between "per kWh" and "per hour".

