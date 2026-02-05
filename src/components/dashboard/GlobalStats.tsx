import { component$ } from "@builder.io/qwik";
import KPICard from "./KPICard";
import { LuDollarSign } from "@qwikest/icons/lucide";
interface Props {
    stats: any;
}

export default component$(({ stats }: Props) => {

    return (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard title="TỔNG DOANH THU" value={stats ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalNetRevenue) : '₫0'} isPrimary={true} />
            <KPICard title="TRƯỚC CHIẾT KHẤU" value={stats ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalListRevenue) : '₫0'} isPrimary={false} colorClass="bg-indigo-500"/>
        </div>
    )
}) 