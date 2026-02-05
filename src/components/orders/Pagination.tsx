import { component$, useSignal, $ } from "@builder.io/qwik";
interface Props {
    total: number;
    limit: {value:number};
    page: {value: number};
}
export default component$(({ total, page, limit }: Props) => {
    const totalPages = Math.ceil(total / limit.value);
    // console.log('Pagination totalPages', limit.value);
    return (
        <div class="flex items-center justify-between p-4">
            <div class="flex items-center gap-2 text-sm text-gray-600">
                <span>Hiển thị</span>
                    <select value={limit.value} onChange$={(e) => limit.value = Number((e.target as HTMLSelectElement).value)} class="px-2 py-1 border rounded">
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <span>trên {total} đơn</span>
            </div>

            <div class="flex items-center gap-1">
                <button disabled={page.value <= 1} onClick$={() => page.value = page.value - 1} class="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
                {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    return (
                        <button key={p} onClick$={() => page.value = p} class={`px-3 py-1 border rounded ${p === page.value ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{p}</button>
                    );
                })}
                <button disabled={page.value >= totalPages} onClick$={() => page.value = page.value + 1} class="px-2 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
        </div>
    )
})