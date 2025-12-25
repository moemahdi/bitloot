'use client';

interface ChartPayloadItem {
    fill?: string;
    [key: string]: unknown;
}

interface NeonChartTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number | string;
        dataKey: string;
        payload: ChartPayloadItem;
    }>;
    label?: string;
}

export function NeonChartTooltip({ active, payload, label }: NeonChartTooltipProps): React.ReactElement | null {
    if (active !== true || payload === undefined || payload === null || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border border-cyan-glow/30 bg-bg-secondary/90 p-3 shadow-[0_0_15px_rgba(0,217,255,0.2)] backdrop-blur-md">
            <p className="mb-2 text-sm font-medium text-text-secondary">{label}</p>
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                        className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{ backgroundColor: entry.payload.fill ?? 'hsl(var(--cyan-glow))' }}
                    />
                    <span className="text-sm font-bold text-text-primary">
                        ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
}
