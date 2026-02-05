import { component$ } from "@builder.io/qwik";
import { LuSearch } from "@qwikest/icons/lucide";

interface Props {
    searchText: any
}
export default component$(({searchText}: Props) => {

    return (
        <div class="relative">
            <input 
                bind:value={searchText.text}
                type="text" 
                placeholder="Tìm Tên hoặc SKU..."
                class="pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"

            />
            <LuSearch class="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>
    )
})