import { $, component$, useSignal } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { LuMessageSquare, LuSend } from "@qwikest/icons/lucide";
import { connectDB } from "~/libs/db";
import { verifyJWT } from "~/services/hash.service";
import { Partner } from "~/models/partner.model";
import { User } from "~/models/user.model";
interface Props {
    notes: any[],
    partnerId?: string,
}

const addNote = server$(async function(partnerId: string, content: string) {
    const session = this.sharedMap.get('session');
    if (!session) return { success: false, message: "Unauthorized" };

    const user = await User.findOne({ _id: session.user._id });
    if (!user) return { success: false, message: "Unauthorized" };

    await connectDB();
    const now = new Date();

    await Partner.updateOne(
        { _id: partnerId },
        { $push: { notes: { date: now, content, userId: user._id} } })
    
    return { success: true  };

})

export default component$(({ notes, partnerId }: Props) => {
    const message = useSignal("")
    const addingNote = $(async () => {
        if (message.value.trim() === "" || !partnerId) return;
        await addNote(partnerId, message.value);
        message.value = "";
        window.location.reload();
    })
    return (
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full max-h-[800px]">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <LuMessageSquare class="w-5 h-5 text-indigo-600" />
                    Ghi Chú Sales
                </h3>
            </div>

            <div class="flex-1 overflow-auto p-4 space-y-4 min-h-[300px]">
                {notes.map((note: any) => (
                    <div key={note.userId} class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p class="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        <div class="mt-2 flex justify-between items-center text-xs text-gray-400">
                            <span class="font-medium text-indigo-600">{note.userName}</span>
                            <span>{new Date(note.date).toLocaleDateString('vi-VN')} {new Date(note.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                ))}
                {notes.length === 0 && (
                    <div class="text-center text-gray-400 mt-10 italic">Chưa có ghi chú nào.</div>
                )}
            </div>

            <div class="p-4 border-t border-gray-100 bg-gray-50">
                <div class="flex gap-2">
                    <textarea 
                        bind:value={message}
                        placeholder="Nhập ghi chú chăm sóc khách hàng..."
                        class="flex-1 rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                    />
                    <button onClick$={addingNote} class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 flex items-center justify-center transition-colors">
                        <LuSend class="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
})