

## Active Charging Session Page

Create a real-time charging page at `/carregamento/:sessionId` matching the reference design -- a clean, card-based mobile layout showing charging status, energy usage, cost, and a stop button.

### Layout (matching the reference image)

**Header**: Back arrow + "Charging Mode" title

**Card 1 - Status**:
- "Plug Connected" label + "Charging..." text with a charging station icon
- Green progress bar (animated)
- Large energy percentage or kWh display + "Duration" showing elapsed time

**Card 2 - Usage**:
- "Current Usage" (kWh) and "Total Spent" (R$) side by side
- Simple bar chart visualization using Recharts (already installed)
- Comparison text: "You are using X% less energy than last month"

**Stop Button**: Full-width blue/red button at the bottom -- "Stop Charging"

### Technical Details

**New file: `src/pages/Carregamento.tsx`**
- Uses `useParams()` to get `sessionId` from URL
- Uses `useLocation().state` to get charger data passed from `useChargerValidation`, with a fallback fetch via `transactionsApi.get(sessionId)` if state is missing (e.g., page refresh)
- Polls session data every 10 seconds using `useQuery` with `refetchInterval: 10000`
- Live elapsed timer via `useState` + `useEffect` with `setInterval` (updates every second)
- "Stop Charging" calls `commandsApi.stopCharge(chargerId, transactionId)`, then navigates to home on success
- Uses `ResponsiveLayout` or `MobileLayout` pattern with `BottomNavigation`
- Formats currency as BRL (R$) using existing `formatters.ts` utilities

**Updated file: `src/App.tsx`**
- Import `Carregamento` page
- Add route: `<Route path="/carregamento/:sessionId" element={<ProtectedRoute><Carregamento /></ProtectedRoute>} />`

### Data Flow

1. User starts charge on `IniciarCarga` page
2. `useChargerValidation` navigates to `/carregamento/:sessionId` with `{ charger, sessionId }` in state
3. `Carregamento` page reads state, starts polling `transactionsApi.get(sessionId)` every 10s
4. User taps "Stop Charging" -> calls `commandsApi.stopCharge()` -> navigates home
5. If session ends externally (e.g., unplug), polling detects `status: 'completed'` and shows summary

### UI Components Used
- `Button` (existing) for stop charging
- `Card` (existing) for the two content sections
- `Badge` for status indicator
- `BarChart` from Recharts for the usage visualization
- Lucide icons: `ArrowLeft`, `Zap`, `Clock`, `Battery`
- Tailwind animations for the charging pulse effect

