import { component$ } from "@builder.io/qwik";
import { LuChevronLeft, LuChevronRight } from "@qwikest/icons/lucide";
interface Props {
    total: number;
    limit: {value:number};
    page: {value: number};
}
export default component$(({ total, page, limit }: Props) => {
    const totalPages = Math.max(1, Math.ceil(total / limit.value));
    const currentPage = Math.min(page.value, totalPages);
    const visiblePages = new Set<number>([1, totalPages]);

    for (let p = currentPage - 1; p <= currentPage + 1; p++) {
        if (p > 1 && p < totalPages) {
            visiblePages.add(p);
        }
    }

    const sortedPages = [...visiblePages].sort((a, b) => a - b);
    const paginationItems: Array<number | string> = [];

    sortedPages.forEach((pageNumber, index) => {
        if (index > 0 && pageNumber - sortedPages[index - 1] > 1) {
            paginationItems.push(`ellipsis-${pageNumber}`);
        }
        paginationItems.push(pageNumber);
    });

    return (
        <div class="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-2 text-sm text-gray-600">
                <span>Hiển thị</span>
                    <select
                        value={limit.value}
                        onChange$={(e) => {
                            limit.value = Number((e.target as HTMLSelectElement).value);
                            page.value = 1;
                        }}
                        class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <span>trên {total} đơn</span>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-1">
                <button
                    disabled={currentPage <= 1}
                    onClick$={() => page.value = currentPage - 1}
                    class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <LuChevronLeft class="h-4 w-4" />
                    Trước
                </button>
                {paginationItems.map((item) => {
                    if (typeof item === "string") {
                        return <span key={item} class="px-2 py-2 text-sm text-gray-400">...</span>;
                    }

                    return (
                        <button
                            key={item}
                            onClick$={() => page.value = item}
                            class={`min-w-10 rounded-lg border px-3 py-2 text-sm transition-colors ${item === currentPage ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            {item}
                        </button>
                    );
                })}
                <button
                    disabled={currentPage >= totalPages}
                    onClick$={() => page.value = currentPage + 1}
                    class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Sau
                    <LuChevronRight class="h-4 w-4" />
                </button>
            </div>
        </div>
    )
})
