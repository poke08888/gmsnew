import { component$ } from '@builder.io/qwik';
import KPICard from './KPICard';
interface Props {
    stats: any[]
}

export default component$(({ stats }: Props) => {
    return (
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
                <>
                    <KPICard title={`Kênh ${stat.channelName} doanh thu`} value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stat.totalNetRevenue)} />
                    <KPICard title={`Kênh ${stat.channelName} order`} value={stat.totalOrders} />
                    <KPICard title={`Kênh ${stat.channelName} số lượng`} value={stat.totalQty} />
                </>
            ))}
        </div>
    )
})