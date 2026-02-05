import { component$ } from '@builder.io/qwik';
interface ErrorProps {
    error : any;
}
export default component$(({ error }: ErrorProps) => {
    if (error.value == "") return null;
    return (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Lỗi!</strong>
            <span class="block sm:inline"> {error.value}</span>
        </div>
    );
});