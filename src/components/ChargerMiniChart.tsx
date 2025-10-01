import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ChargerDailyData } from '@/hooks/useChargerStats';

interface ChargerMiniChartProps {
  data: ChargerDailyData[];
  dataKey: 'sessions' | 'revenue';
  color?: string;
}

export const ChargerMiniChart = ({ data, dataKey, color = '#86efac' }: ChargerMiniChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-12 flex items-center justify-center text-xs opacity-50">
        Sem dados
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
