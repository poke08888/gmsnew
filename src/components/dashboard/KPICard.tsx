import { component$ } from '@builder.io/qwik';
import { LuArrowUp, LuArrowDown, LuMinus } from '@qwikest/icons/lucide';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  icon?: any;
  colorClass?: string;
  isPrimary?: boolean;
  comparison?: {
    absolute: number;
    percent: number;
    label: string;
    showCurrency?: boolean;
  };
  kpi?: {
    target: number;
    current: number;
  };
}

const KPICard = component$((props: KPICardProps) => {
  const { title, value, subValue, icon, colorClass = '', isPrimary, comparison, kpi } = props;
  const isPositive = !!comparison && comparison.absolute >= 0;

  return (
    <div class={`rounded-xl shadow-sm p-6 border flex flex-col justify-between h-full ${isPrimary ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-100'}`}>
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class={`${isPrimary ? 'text-indigo-100' : 'text-gray-500'} text-sm font-medium uppercase tracking-wider`}>{title}</h3>
          {/* <div class={`p-2 rounded-lg ${isPrimary ? 'bg-white bg-opacity-20 text-white' : `${colorClass} bg-opacity-10 text-opacity-100`}`}>
            {icon}
          </div> */}
        </div>
        <div class="flex flex-col gap-1">
          <span class={`text-2xl font-bold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>{value}</span>
          {subValue && <span class={`text-sm mt-1 ${isPrimary ? 'text-indigo-200' : 'text-gray-400'}`}>{subValue}</span>}

          {comparison && (
            <div class={`flex items-center gap-1 text-xs font-bold mt-1 ${isPrimary ? 'text-indigo-100' : ''}`}>
              {comparison.absolute === 0 ? (
                <span class={`flex items-center ${isPrimary ? 'text-white' : 'text-gray-500'}`}>
                  <LuMinus class="w-3 h-3 mr-1" /> 0%
                </span>
              ) : isPositive ? (
                <span class={`flex items-center ${isPrimary ? 'text-green-300' : 'text-green-600'}`}>
                  <LuArrowUp class="w-3 h-3 mr-1" />
                  {Math.abs(comparison.percent).toFixed(1)}%
                  ({comparison.showCurrency ? formatCurrency(Math.abs(comparison.absolute)) : Math.abs(comparison.absolute)})
                </span>
              ) : (
                <span class={`flex items-center ${isPrimary ? 'text-red-300' : 'text-red-600'}`}>
                  <LuArrowDown class="w-3 h-3 mr-1" />
                  {Math.abs(comparison.percent).toFixed(1)}%
                  ({comparison.showCurrency ? formatCurrency(Math.abs(comparison.absolute)) : Math.abs(comparison.absolute)})
                </span>
              )}
              <span class={`font-normal ml-1 opacity-80 ${isPrimary ? 'text-indigo-200' : 'text-gray-500'}`}>
                {comparison.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {kpi && (
        <div class="mt-4 pt-4 border-t border-opacity-10 border-gray-400">
          <KPIProgressBar target={kpi.target} current={kpi.current} isPrimary={isPrimary} />
        </div>
      )}
    </div>
  );
});

export default KPICard;

export const MiniComparison = component$(({ percent }: { percent: number }) => {
  if (percent === 0) return <span class="text-gray-400 text-xs flex items-center"><LuMinus class="w-3 h-3" /> 0%</span>;
  const isPositive = percent > 0;
  return (
    <span class={`text-xs flex items-center font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <LuArrowUp class="w-3 h-3" /> : <LuArrowDown class="w-3 h-3" />}
      {Math.abs(percent).toFixed(1)}%
    </span>
  );
});

export const KPIProgressBar = component$(({ target, current, showLabel = true, isPrimary = false }: { target: number; current: number; showLabel?: boolean; isPrimary?: boolean }) => {
  const kpiPercent = target > 0 ? (current / target) * 100 : 0;

  let progressColor = '';
  let trackColor = '';

  if (isPrimary) {
    progressColor = 'bg-white';
    trackColor = 'bg-indigo-800 bg-opacity-30';
  } else {
    progressColor = kpiPercent >= 100 ? 'bg-green-500' : kpiPercent >= 80 ? 'bg-blue-500' : 'bg-orange-500';
    trackColor = 'bg-gray-200';
  }

  return (
    <div class="w-full">
      {showLabel && (
        <div class={`flex justify-between items-end mb-1 ${isPrimary ? 'text-indigo-100' : ''}`}>
          <span class={`text-xs font-medium flex items-center gap-1 ${isPrimary ? 'text-indigo-200' : 'text-gray-500'}`}>
            KPI: {formatCurrency(target)}
          </span>
          <span class={`text-xs font-bold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>{kpiPercent.toFixed(1)}%</span>
        </div>
      )}
      <div class={`w-full rounded-full h-2 ${trackColor}`}>
        <div class={`${progressColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(kpiPercent, 100)}%` }}></div>
      </div>
    </div>
  );
});
