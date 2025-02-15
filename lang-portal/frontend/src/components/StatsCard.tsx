interface StatsCardProps {
  title: string
  value: string | number
  description: string
  trend?: number
}

export default function StatsCard({ title, value, description, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className="mt-2 flex justify-between items-end">
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        {trend !== undefined && (
          <div className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 && '+'}
            {trend}%
          </div>
        )}
      </div>
    </div>
  )
} 