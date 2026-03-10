import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { Card } from '@/components/ui/card';
import type { DashboardStats } from '@/types/domain';

export function AccuracyChart({ items }: { items: DashboardStats['playerAccuracy'] }) {
  return (
    <Card eyebrow="Accuracy" title="Player hit rate">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="displayName" stroke="#97a3b6" tickLine={false} axisLine={false} />
            <YAxis stroke="#97a3b6" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0e1117',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />
            <Bar dataKey="podiumHitRate" fill="#ff5a1f" radius={[10, 10, 0, 0]} />
            <Bar dataKey="top10HitRate" fill="#3dd9b3" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
