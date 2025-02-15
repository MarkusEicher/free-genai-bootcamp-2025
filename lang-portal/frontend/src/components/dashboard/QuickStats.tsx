interface StatsItem {
  label: string;
  value: string | number;
  change?: string;
}

interface QuickStatsProps {
  stats: StatsItem[];
}

export default function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((item, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {item.label}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {item.value}
            </dd>
            {item.change && (
              <div className="mt-2 text-sm text-gray-600">{item.change}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 