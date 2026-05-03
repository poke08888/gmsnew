import { component$, useSignal, $ } from '@builder.io/qwik';
import * as XLSX from 'xlsx';
import { LuFileSpreadsheet as FileSpreadsheet, LuUpload as UploadIcon } from '@qwikest/icons/lucide';
import { InterfaceOrderItem } from '~/types/common';

interface Props {
    file: {value: {items: InterfaceOrderItem[], rawFile: File | null}}
}

export default component$(({ file }: Props) => {

    const handleUpload = $(async (e:any) => {
        file.value = {...file.value, rawFile: e.target.files[0]};

        const data = await e.target.files[0].arrayBuffer();
        const workbook = XLSX.read(data);
        const firstWorkSheetName = workbook.SheetNames[0];
        const workSheet = workbook.Sheets[firstWorkSheetName];

        const jsonData: InterfaceOrderItem[] = XLSX.utils.sheet_to_json(workSheet, {
            range: 1,
            header: ["sku", "name", "qty", "listprice", "netprice", "grossprice"],
        });

        // sanitize numeric fields (qty, listprice, netprice, grossprice)
        const sanitized = jsonData.map((row: any) => {
            const parseNumber = (v: any) => {
                if (v === null || v === undefined || v === '') return 0;
                if (typeof v === 'number') return v;
                // remove all non-digit characters (currency symbols, spaces, dots as thousand separators, commas)
                const digits = String(v).replace(/[^0-9\-]/g, '');
                return digits === '' ? 0 : Number(digits);
            }

            return {
                ...row,
                qty: parseNumber(row.qty),
                listprice: parseNumber(row.listprice),
                netprice: parseNumber(row.netprice),
                grossprice: parseNumber(row.grossprice),
            } as InterfaceOrderItem;
        });

        file.value = {...file.value, items: sanitized};
    })

    return (
        <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">File Dữ Liệu (CSV/Excel)</label>
            <div class={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file.value.rawFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                <input type="file" id="file-upload" accept=".csv, .xlsx, .xls" class="hidden" onChange$={handleUpload}/>
                <label for="file-upload" class="cursor-pointer flex flex-col items-center justify-center">
                    {file.value.rawFile ? (
                        <>
                            <FileSpreadsheet class="w-12 h-12 text-green-600 mb-2" />
                            <span class="text-green-700 font-medium">{file.value.rawFile.name}</span>
                            <span class="text-green-500 text-xs mt-1">{(file.value.rawFile.size / 1024).toFixed(2)} KB</span>
                        </>
                    ): (
                        <>
                            <UploadIcon class="w-12 h-12 text-gray-400 mb-2" />
                            <span class="text-gray-600 font-medium">Nhấn để chọn file hoặc kéo thả vào đây</span>
                            <span class="text-gray-400 text-xs mt-1">Hỗ trợ .csv, .xlsx</span>
                        </>
                    )}
                </label>
            </div>
            <p class="text-xs text-gray-500 mt-2">* File mẫu phải bao gồm các cột: SKU, Product Name, Quantity, Unit Price, Discount %</p>
        </div>
    )
})