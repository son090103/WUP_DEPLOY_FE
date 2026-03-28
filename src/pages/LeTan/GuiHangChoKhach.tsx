import { useState, useRef } from "react";

interface CargoForm {
    receiverName: string;
    phone: string;
    address: string;
    cargoName: string;
    weight: string;
    quantity: string;
    note: string;
}

export default function CargoBooking() {
    const [form, setForm] = useState<CargoForm>({
        receiverName: "",
        phone: "",
        address: "",
        cargoName: "",
        weight: "",
        quantity: "",
        note: "",
    });

    const [images, setImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: keyof CargoForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImages(prev => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        console.log("Submitted:", { form, images });
        alert("Đã thêm đơn hàng thành công!");
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 md:p-8"
            style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
        >
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-extrabold text-gray-800">Gửi hàng hóa</h1>
                    <button
                        className="px-5 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-sm"
                    >
                        Trở lại
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row gap-8">

                        {/* ── Left Column ─────────────────────────────────── */}
                        <div className="flex-1 space-y-5">

                            {/* Image upload area */}
                            <div>
                                {/* Thumbnails */}
                                {images.length > 0 && (
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {images.map((img, i) => (
                                            <div key={i} className="relative group">
                                                <img
                                                    src={img}
                                                    alt={`cargo-${i}`}
                                                    className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200"
                                                />
                                                <button
                                                    onClick={() => removeImage(i)}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Default preview placeholders if no images */}
                                {images.length === 0 && (
                                    <div className="flex gap-2 mb-3">
                                        {[
                                            "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=80&h=80&fit=crop",
                                            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop",
                                            "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=80&h=80&fit=crop",
                                        ].map((src, i) => (
                                            <img
                                                key={i}
                                                src={src}
                                                alt={`sample-${i}`}
                                                className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Upload button */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-2.5 rounded-xl border-2 border-orange-400 text-orange-500 font-bold text-sm hover:bg-orange-50 transition-all"
                                >
                                    + Thêm ảnh
                                </button>
                            </div>

                            {/* Tên người nhận */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Tên người nhận <span className="text-orange-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.receiverName}
                                    onChange={e => handleChange("receiverName", e.target.value)}
                                    placeholder="Tên Người Nhận"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
                                />
                            </div>

                            {/* Số điện thoại */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Số điện thoại <span className="text-orange-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={e => handleChange("phone", e.target.value)}
                                    placeholder="0923537****"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
                                />
                            </div>

                            {/* Địa chỉ người nhận */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Địa chỉ người nhận <span className="text-orange-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={e => handleChange("address", e.target.value)}
                                    placeholder="Địa chỉ người nhận"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* ── Right Column ─────────────────────────────────── */}
                        <div className="flex-1 space-y-5">

                            {/* Tên hàng hóa */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Tên hàng hóa <span className="text-orange-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.cargoName}
                                    onChange={e => handleChange("cargoName", e.target.value)}
                                    placeholder="Tên hàng hóa"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
                                />
                            </div>

                            {/* Cân nặng + Số lượng */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Cân nặng <span className="text-orange-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={form.weight}
                                            onChange={e => handleChange("weight", e.target.value)}
                                            placeholder="14kg"
                                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Số lượng <span className="text-orange-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleChange("quantity", String(Math.max(1, parseInt(form.quantity || "1") - 1)))}
                                            className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-bold text-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition-all flex-shrink-0 flex items-center justify-center"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={form.quantity}
                                            onChange={e => handleChange("quantity", e.target.value)}
                                            placeholder="2"
                                            min={1}
                                            className="flex-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 text-center placeholder:text-gray-400"
                                        />
                                        <button
                                            onClick={() => handleChange("quantity", String(parseInt(form.quantity || "0") + 1))}
                                            className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-bold text-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition-all flex-shrink-0 flex items-center justify-center"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Chú thích */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Chú thích (lựa chọn) <span className="text-orange-500">*</span>
                                </label>
                                <textarea
                                    value={form.note}
                                    onChange={e => handleChange("note", e.target.value)}
                                    placeholder="Hàng dễ vỡ ..."
                                    rows={4}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400 resize-none"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                            >
                                Thêm đơn
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}