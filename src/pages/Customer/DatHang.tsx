import React, { useState } from "react";
import { X, Minus, Plus, Tag } from "lucide-react";
import { Link } from "react-router-dom";

/* ================= TYPES ================= */

type CartItem = {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
};

type PromoCode = {
    code: string;
    discount: number; // percentage
};

/* ================= COMPONENT ================= */

export default function ShippingCart() {
    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            id: "1",
            name: "Vali lớn",
            image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mb3vu5jmpl93c0_tn",
            price: 50000,
            quantity: 1,
        },
        {
            id: "2",
            name: "Thùng carton lớn",
            image: "https://tse1.explicit.bing.net/th/id/OIP.y7M0WX55tjlI94xGdT_oLAHaFZ?rs=1&pid=ImgDetMain&o=7&rm=3",
            price: 50000,
            quantity: 2,
        },
    ]);

    const [promoCode, setPromoCode] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New item form state
    const [newItem, setNewItem] = useState({
        name: "",
        weight: "",
        quantity: "",
        note: "",
        images: [] as string[],
    });

    // Mock promo codes
    const validPromoCodes: PromoCode[] = [
        { code: "GIAM10", discount: 10 },
        { code: "GIAM20", discount: 20 },
    ];

    // Calculate totals
    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const calculateDiscount = () => {
        if (!appliedPromo) return 0;
        return (calculateSubtotal() * appliedPromo.discount) / 100;
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscount();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "decimal",
            minimumFractionDigits: 0,
        }).format(amount) + "đ";
    };

    const updateQuantity = (id: string, change: number) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, quantity: Math.max(1, item.quantity + change) }
                    : item
            )
        );
    };

    const removeItem = (id: string) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const applyPromoCode = () => {
        const promo = validPromoCodes.find(
            (p) => p.code.toUpperCase() === promoCode.toUpperCase()
        );
        if (promo) {
            setAppliedPromo(promo);
            setPromoCode("");
        } else {
            alert("Mã khuyến mãi không hợp lệ!");
        }
    };

    const clearHistory = () => {
        setCartItems([]);
        setAppliedPromo(null);
    };

    const updateLatest = () => {
        setIsModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
            setNewItem(prev => ({
                ...prev,
                images: [...prev.images, ...imageUrls]
            }));
        }
    };

    const removeImage = (index: number) => {
        setNewItem(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSaveNewItem = () => {
        if (!newItem.name || !newItem.weight || !newItem.quantity) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
            return;
        }

        const newCartItem: CartItem = {
            id: Date.now().toString(),
            name: newItem.name,
            image: newItem.images[0] || "/api/placeholder/80/80",
            price: 50000, // Default price
            quantity: parseInt(newItem.quantity) || 1,
        };

        setCartItems(prev => [...prev, newCartItem]);

        // Reset form
        setNewItem({
            name: "",
            weight: "",
            quantity: "",
            note: "",
            images: [],
        });

        setIsModalOpen(false);
        alert("Đã thêm hàng hóa thành công!");
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
            {/* Background Layers */}
            <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.93)_34%,rgba(255,255,255,0.64)_56%,rgba(255,255,255,0.16)_78%,rgba(255,255,255,0)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#f3ece5] to-[#ece7e2]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-[#ece7e2]" />

            {/* Bus Animation */}
            <div className="pointer-events-none absolute top-[18%] right-[0%] z-10 w-[66%] max-w-[860px] md:top-[9%] md:w-[62%]">
                <div className="bus-aero-overlay absolute inset-[-16%] z-0">
                    <span className="bus-cloud bus-cloud-1 absolute left-[-10%] top-[-10%] h-[28%] w-[68%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.74)_0%,rgba(255,255,255,0.25)_54%,rgba(255,255,255,0)_100%)] blur-[30px]" />
                    <span className="bus-cloud bus-cloud-2 absolute left-[-20%] top-[28%] h-[26%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0.2)_54%,rgba(255,255,255,0)_100%)] blur-[24px]" />
                    <span className="bus-cloud bus-cloud-3 absolute right-[-16%] top-[34%] h-[26%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.64)_0%,rgba(255,255,255,0.18)_54%,rgba(255,255,255,0)_100%)] blur-[24px]" />
                    <span className="bus-cloud bus-cloud-4 absolute left-[-16%] top-[66%] h-[30%] w-[58%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.24)_54%,rgba(255,255,255,0)_100%)] blur-[28px]" />
                    <span className="bus-cloud bus-cloud-5 absolute right-[-4%] top-[70%] h-[28%] w-[54%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.64)_0%,rgba(255,255,255,0.2)_54%,rgba(255,255,255,0)_100%)] blur-[26px]" />
                    <span className="bus-cloud bus-cloud-6 absolute left-[4%] top-[90%] h-[16%] w-[72%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.56)_0%,rgba(255,255,255,0.14)_54%,rgba(255,255,255,0)_100%)] blur-[24px]" />
                </div>

                <div className="bus-aero-trail absolute right-[-14%] top-[30%] z-0 h-[54%] w-[46%]">
                    <span className="bus-tail-cloud bus-tail-cloud-1 absolute right-[10%] top-[14%] h-[42%] w-[34%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.48)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
                    <span className="bus-tail-cloud bus-tail-cloud-2 absolute right-[28%] top-[28%] h-[38%] w-[32%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.4)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
                    <span className="bus-tail-cloud bus-tail-cloud-3 absolute right-[12%] top-[50%] h-[34%] w-[30%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.36)_54%,rgba(255,255,255,0)_100%)] blur-[10px]" />
                    <span className="bus-tail-cloud bus-tail-cloud-4 absolute right-[38%] top-[20%] h-[26%] w-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.32)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
                    <span className="bus-tail-cloud bus-tail-cloud-5 absolute right-[44%] top-[42%] h-[24%] w-[22%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.74)_0%,rgba(255,255,255,0.3)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
                    <span className="bus-tail-cloud bus-tail-cloud-6 absolute right-[24%] top-[44%] h-[26%] w-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.38)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
                    <span className="bus-tail-cloud bus-tail-cloud-7 absolute right-[18%] top-[64%] h-[22%] w-[22%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0.34)_54%,rgba(255,255,255,0)_100%)] blur-[9px]" />
                </div>

                <div className="bus-bob relative z-10">
                    <img
                        src="/images/bus7.png"
                        alt="Bus overlay"
                        className="w-full object-contain block relative"
                        style={{
                            imageRendering: "auto",
                            filter:
                                "drop-shadow(0 24px 28px rgba(15,23,42,0.28)) drop-shadow(0 0 22px rgba(255,255,255,0.5))",
                        }}
                    />

                    <div className="pointer-events-none absolute inset-0">
                        <div className="bus-front-left-passenger">
                            <img
                                src="/images/loxe1.png"
                                alt="Front passenger"
                                className="bus-front-left-passenger-img"
                            />
                        </div>
                        <div className="bus-driver-fit">
                            <img
                                src="/images/1me1.png"
                                alt="Driver"
                                className="bus-driver-fit-img"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative z-20 mx-auto flex min-h-[280px] w-full max-w-[1240px] items-center px-4 pb-8 pt-24 md:min-h-[380px] lg:min-h-[420px] lg:pt-20">
                <div className="page-enter-copy relative isolate -ml-8 max-w-[760px] space-y-6 sm:-ml-14 lg:-ml-24">
                    <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 h-[360px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.46)_34%,rgba(255,255,255,0.18)_56%,rgba(255,255,255,0)_78%)] blur-[26px]" />
                    <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 h-[300px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(248,250,252,0.46)_0%,rgba(248,250,252,0.14)_58%,rgba(248,250,252,0)_84%)] blur-[18px]" />
                    <h1 className="hero-title relative z-10 py-1 text-[48px] font-black leading-[1.05] tracking-[-0.03em] text-[#0d142a] sm:text-[58px] lg:text-[72px]">
                        <span className="hero-title-line block whitespace-nowrap">
                            Tìm và đặt ngay
                        </span>
                        <span className="hero-title-line mt-2 block whitespace-nowrap">
                            những chuyến xe
                        </span>
                        <span className="hero-title-line mt-2 block whitespace-nowrap font-extrabold italic">
                            <span className="text-[#0d142a]">thật</span>{" "}
                            <span className="hero-title-shimmer">Dễ Dàng</span>
                        </span>
                    </h1>
                    <p className="relative z-10 max-w-[510px] text-base leading-relaxed text-[#475569] lg:text-lg">
                        Đặt vé mọi lúc mọi nơi, đi vững ngàn hành trình đa dạng và dịch vụ
                        chất lượng cao nhất.
                    </p>
                </div>
            </div>

            {/* Gradient bridge — merge hero → content seamlessly */}
            <div className="relative z-30 h-44 bg-gradient-to-b from-transparent to-[#f0ebe6]" />

            {/* Main Content */}
            <div className="relative z-30 bg-[#f0ebe6] pb-12 px-4 -mt-px">
                <div className="max-w-7xl mx-auto">
                    {/* Page Title */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-black text-[#0d142a] tracking-tight">
                            Danh sách hàng gửi
                        </h2>
                        <p className="mt-2 text-sm text-[#8c6a4f]">Quản lý các món hàng bạn muốn gửi theo chuyến xe</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cart Items Section */}
                        <div className="lg:col-span-2 space-y-5">
                            <div className="rounded-[14px] border border-[#f2e5d8] bg-white/95 shadow-[0_8px_30px_-12px_rgba(251,146,60,0.25)] backdrop-blur overflow-hidden">
                                {/* Table Header - ẩn trên mobile */}
                                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-gradient-to-r from-[#fff8f1] to-[#fff3e6] border-b border-[#f2e5d8]">
                                    <div className="col-span-5 text-[11px] font-bold text-[#c89463] uppercase tracking-wider">Hàng hóa</div>
                                    <div className="col-span-2 text-[11px] font-bold text-[#c89463] uppercase tracking-wider text-center">Giá</div>
                                    <div className="col-span-3 text-[11px] font-bold text-[#c89463] uppercase tracking-wider text-center">Số lượng</div>
                                    <div className="col-span-2 text-[11px] font-bold text-[#c89463] uppercase tracking-wider text-center">Tổng</div>
                                </div>

                                {/* Cart Items */}
                                <div className="divide-y divide-[#f2e5d8]/60">
                                    {cartItems.length === 0 ? (
                                        <div className="px-6 py-16 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 mb-4">
                                                <Tag className="text-[#c89463]" size={28} />
                                            </div>
                                            <p className="text-[#8c6a4f] text-base font-medium">
                                                Chưa có hàng nào trong danh sách
                                            </p>
                                        </div>
                                    ) : (
                                        cartItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="group px-5 py-4 hover:bg-[#fffaf5] transition-colors duration-200"
                                            >
                                                {/* Desktop row */}
                                                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                                    <div className="col-span-5 flex items-center gap-4">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-16 h-16 object-cover rounded-[10px] border border-[#f2e5d8] shadow-sm"
                                                        />
                                                        <span className="font-semibold text-[14px] text-[#253042]">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-center text-[14px] font-bold text-[#475569]">
                                                        {formatCurrency(item.price)}
                                                    </div>
                                                    <div className="col-span-3 flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="w-8 h-8 rounded-lg border border-[#f2e5d8] bg-white hover:bg-orange-50 text-[#c89463] flex items-center justify-center transition-colors"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-10 h-8 flex items-center justify-center text-[14px] font-bold text-[#253042] bg-[#fff8f1] border border-[#f2e5d8] rounded-lg">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="w-8 h-8 rounded-lg border border-[#f2e5d8] bg-white hover:bg-orange-50 text-[#c89463] flex items-center justify-center transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="col-span-2 flex items-center justify-center gap-2">
                                                        <span className="font-bold text-[14px] text-[#e8791c]">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </span>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Mobile card */}
                                                <div className="md:hidden flex items-start gap-3">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-16 h-16 object-cover rounded-[10px] border border-[#f2e5d8] shadow-sm flex-shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <span className="font-semibold text-[14px] text-[#253042] truncate">{item.name}</span>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="w-6 h-6 rounded-md bg-red-50 text-red-400 flex items-center justify-center flex-shrink-0"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </div>
                                                        <p className="text-[13px] text-[#8c6a4f] mt-0.5">{formatCurrency(item.price)}/món</p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <button onClick={() => updateQuantity(item.id, -1)}
                                                                    className="w-7 h-7 rounded-md border border-[#f2e5d8] bg-white text-[#c89463] flex items-center justify-center">
                                                                    <Minus size={13} />
                                                                </button>
                                                                <span className="w-8 h-7 flex items-center justify-center text-[13px] font-bold text-[#253042] bg-[#fff8f1] border border-[#f2e5d8] rounded-md">
                                                                    {item.quantity}
                                                                </span>
                                                                <button onClick={() => updateQuantity(item.id, 1)}
                                                                    className="w-7 h-7 rounded-md border border-[#f2e5d8] bg-white text-[#c89463] flex items-center justify-center">
                                                                    <Plus size={13} />
                                                                </button>
                                                            </div>
                                                            <span className="font-bold text-[14px] text-[#e8791c]">
                                                                {formatCurrency(item.price * item.quantity)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="px-5 py-4 bg-gradient-to-r from-[#fff8f1] to-[#fff3e6] border-t border-[#f2e5d8] flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={clearHistory}
                                        className="px-6 py-2.5 rounded-[8px] border border-[#e8791c] text-[#e8791c] hover:bg-[#fff3e6] text-sm font-bold transition-colors"
                                    >
                                        Trở về lịch trình
                                    </button>
                                    <button
                                        onClick={updateLatest}
                                        className="px-6 py-2.5 rounded-[8px] bg-gradient-to-r from-[#f7a53a] to-[#e8791c] hover:from-[#f8af4f] hover:to-[#ef8a31] text-white text-sm font-bold shadow-[0_10px_20px_-10px_rgba(216,113,28,0.7)] transition duration-200"
                                    >
                                        Cập nhật đơn
                                    </button>
                                </div>
                            </div>

                            {/* Promo Code Section */}
                            <div className="rounded-[14px] border border-[#f2e5d8] bg-white/95 shadow-[0_8px_30px_-12px_rgba(251,146,60,0.15)] backdrop-blur p-5">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <div className="flex-1 flex items-center gap-3 bg-[#fff8f1] rounded-[8px] px-4 py-3 border border-[#f2e5d8]">
                                        <Tag className="text-[#c89463] flex-shrink-0" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Nhập mã khuyến mãi"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            className="flex-1 bg-transparent outline-none text-[14px] font-semibold text-[#253042] placeholder:text-[#c89463]"
                                        />
                                    </div>
                                    <button
                                        onClick={applyPromoCode}
                                        className="px-7 py-3 rounded-[8px] bg-gradient-to-r from-[#f7a53a] to-[#e8791c] hover:from-[#f8af4f] hover:to-[#ef8a31] text-white text-sm font-bold shadow-[0_10px_20px_-10px_rgba(216,113,28,0.7)] transition duration-200"
                                    >
                                        Áp dụng
                                    </button>
                                </div>

                                {appliedPromo && (
                                    <div className="mt-4 p-3.5 bg-green-50 border border-green-200 rounded-[8px]">
                                        <p className="text-green-700 text-sm font-semibold">
                                            Đã áp dụng mã: <span className="font-black">{appliedPromo.code}</span> - Giảm {appliedPromo.discount}%
                                        </p>
                                    </div>
                                )}

                                {/* Promo Tips */}
                                <div className="mt-3 p-3.5 bg-[#fff8f1] border border-[#f2e5d8] rounded-[8px]">
                                    <p className="text-[#c89463] text-xs font-bold mb-1 flex items-center gap-1.5">
                                        <Tag size={13} />
                                        Mã khuyến mãi khả dụng
                                    </p>
                                    <p className="text-[13px] text-[#8c6a4f]">
                                        Thử các mã: <span className="font-bold text-[#e8791c]">GIAM10</span>, <span className="font-bold text-[#e8791c]">GIAM20</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Section */}
                        <div className="lg:col-span-1">
                            <div className="rounded-[14px] border border-[#f2e5d8] bg-white/95 shadow-[0_8px_30px_-12px_rgba(251,146,60,0.25)] backdrop-blur p-6 sticky top-8">
                                <h2 className="text-xl font-black text-[#0d142a] mb-5">
                                    Tổng tiền
                                </h2>

                                <div className="space-y-3.5 mb-6">
                                    {/* Subtotal */}
                                    <div className="flex items-center justify-between pb-3 border-b border-[#f2e5d8]">
                                        <span className="text-sm text-[#8c6a4f]">Chi phí</span>
                                        <span className="text-sm font-bold text-[#253042]">
                                            {formatCurrency(calculateSubtotal())}
                                        </span>
                                    </div>

                                    {/* Discount */}
                                    {appliedPromo && (
                                        <div className="flex items-center justify-between pb-3 border-b border-[#f2e5d8]">
                                            <span className="text-sm text-green-600">
                                                Khuyến mãi ({appliedPromo.discount}%)
                                            </span>
                                            <span className="text-sm font-bold text-green-600">
                                                -{formatCurrency(calculateDiscount())}
                                            </span>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-base font-bold text-[#0d142a]">
                                            Tổng tiền:
                                        </span>
                                        <span className="text-xl font-black text-[#e8791c]">
                                            {formatCurrency(calculateTotal())}
                                        </span>
                                    </div>
                                </div>

                                {/* Checkout Button */}
                                <Link to="/chitietdathang" className="block w-full">
                                    <button
                                        type="button"
                                        className="w-full min-h-[52px] rounded-[8px] bg-gradient-to-r from-[#f7a53a] to-[#e8791c] hover:from-[#f8af4f] hover:to-[#ef8a31] text-white font-black text-base shadow-[0_18px_30px_-14px_rgba(216,113,28,0.95)] transition duration-200"
                                    >
                                        Thanh toán
                                    </button>
                                </Link>

                                {/* Additional Info */}
                                <div className="mt-5 p-3.5 bg-[#fff8f1] rounded-[8px] border border-[#f2e5d8]">
                                    <p className="text-xs text-[#c89463] text-center font-semibold">
                                        Miễn phí vận chuyển cho đơn hàng trên 200.000đ
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for adding new item */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[16px] shadow-[0_24px_60px_-16px_rgba(15,23,42,0.3)] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#f2e5d8]">
                        {/* Modal header */}
                        <div className="sticky top-0 bg-white border-b border-[#f2e5d8] px-6 py-4 flex items-center justify-between rounded-t-[16px] z-10">
                            <h3 className="text-xl font-black text-[#0d142a]">Cập nhật hàng hóa</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-9 h-9 rounded-lg bg-[#fff3e6] hover:bg-[#ffe8cc] text-[#c89463] flex items-center justify-center transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Tên hàng hóa */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#c89463] uppercase tracking-wider mb-1.5">
                                    Tên hàng hóa <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-[8px] border border-[#f2e5d8] bg-[#fff8f1] focus:border-[#e8791c] focus:bg-white focus:outline-none transition-colors text-[14px] font-semibold text-[#253042] placeholder:text-[#c89463]"
                                    placeholder="Nhập tên hàng hóa"
                                />
                            </div>

                            {/* Cân nặng và Số lượng */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#c89463] uppercase tracking-wider mb-1.5">
                                        Cân nặng <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.weight}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, weight: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-[8px] border border-[#f2e5d8] bg-[#fff8f1] focus:border-[#e8791c] focus:bg-white focus:outline-none transition-colors text-[14px] font-semibold text-[#253042] placeholder:text-[#c89463]"
                                        placeholder="Nhập cân nặng"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#c89463] uppercase tracking-wider mb-1.5">
                                        Số lượng <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-[8px] border border-[#f2e5d8] bg-[#fff8f1] focus:border-[#e8791c] focus:bg-white focus:outline-none transition-colors text-[14px] font-semibold text-[#253042] placeholder:text-[#c89463]"
                                        placeholder="Nhập số lượng"
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* Thêm hình ảnh */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#c89463] uppercase tracking-wider mb-1.5">
                                    Hình ảnh <span className="text-red-400">*</span>
                                </label>
                                <div className="space-y-3">
                                    {newItem.images.length > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                            {newItem.images.map((img, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={img}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-20 h-20 object-cover rounded-[10px] border border-[#f2e5d8] shadow-sm"
                                                    />
                                                    <button
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] border border-[#e8791c] text-[#e8791c] hover:bg-[#fff3e6] text-sm font-bold transition-colors cursor-pointer">
                                        <Plus size={16} />
                                        Thêm ảnh
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Chú thích */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#c89463] uppercase tracking-wider mb-1.5">
                                    Chú thích (tùy chọn)
                                </label>
                                <textarea
                                    value={newItem.note}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, note: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-[8px] border border-[#f2e5d8] bg-[#fff8f1] focus:border-[#e8791c] focus:bg-white focus:outline-none transition-colors resize-none text-[14px] text-[#253042] placeholder:text-[#c89463]"
                                    rows={3}
                                    placeholder="Nhập ghi chú về hàng hóa..."
                                />
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="sticky bottom-0 bg-gradient-to-r from-[#fff8f1] to-[#fff3e6] border-t border-[#f2e5d8] px-6 py-4 flex justify-end gap-3 rounded-b-[16px]">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-[8px] border border-[#e8791c] text-[#e8791c] hover:bg-[#fff3e6] text-sm font-bold transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveNewItem}
                                className="px-7 py-2.5 rounded-[8px] bg-gradient-to-r from-[#f7a53a] to-[#e8791c] hover:from-[#f8af4f] hover:to-[#ef8a31] text-white text-sm font-bold shadow-[0_10px_20px_-10px_rgba(216,113,28,0.7)] transition duration-200"
                            >
                                Cập nhật đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .page-enter-copy {
          opacity: 0;
          will-change: transform, opacity;
          animation: page-fade-up 1.08s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.2s;
        }

        .hero-title-line {
          opacity: 0;
          transform: translateY(14px);
          animation: hero-title-reveal 1.12s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .hero-title-line:nth-child(1) {
          animation-delay: 0.36s;
        }

        .hero-title-line:nth-child(2) {
          animation-delay: 0.54s;
        }

        .hero-title-line:nth-child(3) {
          animation-delay: 0.72s;
        }

        .hero-title-shimmer {
          color: #ff7a1b;
          display: inline-block;
          line-height: 1.12;
          padding-bottom: 0.14em;
          background-image: repeating-linear-gradient(
            100deg,
            #ff7a1b 0px,
            #ff7a1b 120px,
            #ff9226 185px,
            #ffb347 260px,
            #ff9226 335px,
            #ff7a1b 400px,
            #e8791c 520px
          );
          background-size: 520px 100%;
          background-position: 0 50%;
          background-repeat: repeat;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow:
            0 1px 0 rgba(255, 181, 88, 0.36),
            0 2px 0 rgba(234, 121, 27, 0.38),
            0 4px 0 rgba(178, 76, 16, 0.3),
            0 10px 16px rgba(94, 40, 9, 0.22);
          -webkit-text-stroke: 0.26px rgba(136, 57, 12, 0.26);
          filter: saturate(1.16) contrast(1.12) brightness(1.06);
          animation: hero-title-shimmer-soft 5.8s linear infinite;
          will-change: background-position;
        }

        .bus-bob {
          animation: bus-bob 1.9s cubic-bezier(0.36, 0.06, 0.29, 0.97) infinite;
          transform-origin: 56% 74%;
          will-change: transform;
        }

        .bus-aero-overlay {
          transform: rotate(12deg);
          transform-origin: 22% 50%;
        }

        .bus-cloud {
          animation: bus-cloud-drift 1.75s ease-out infinite;
          will-change: transform, opacity;
        }

        .bus-cloud-1 { animation-delay: 0.06s; animation-duration: 1.95s; }
        .bus-cloud-2 { animation-delay: 0.26s; animation-duration: 1.55s; }
        .bus-cloud-3 { animation-delay: 0.42s; animation-duration: 1.58s; }
        .bus-cloud-4 { animation-delay: 0.62s; animation-duration: 1.84s; }
        .bus-cloud-5 { animation-delay: 0.78s; animation-duration: 1.72s; }
        .bus-cloud-6 { animation-delay: 0.94s; animation-duration: 1.6s; }

        .bus-aero-trail {
          transform: rotate(12deg);
          transform-origin: 22% 50%;
        }

        .bus-tail-cloud {
          animation: bus-trail-cloud 1.55s ease-out infinite;
          will-change: transform, opacity;
        }

        .bus-tail-cloud-1 { animation-delay: 0.06s; }
        .bus-tail-cloud-2 { animation-delay: 0.32s; }
        .bus-tail-cloud-3 { animation-delay: 0.54s; }
        .bus-tail-cloud-4 { animation-delay: 0.76s; }
        .bus-tail-cloud-5 { animation-delay: 0.9s; animation-duration: 1.7s; }
        .bus-tail-cloud-6 { animation-delay: 0.22s; animation-duration: 1.45s; }
        .bus-tail-cloud-7 { animation-delay: 0.48s; animation-duration: 1.55s; }

        .bus-driver-fit {
          position: absolute;
          left: 26.3%; top: 30.7%;
          width: 11.6%; height: 15.8%;
          overflow: hidden;
          clip-path: polygon(8% 1%, 96% 5%, 100% 95%, 22% 98%, 2% 56%);
          transform: perspective(760px) rotateY(-12deg) rotate(-0.55deg);
          transform-origin: 54% 50%;
          box-shadow: inset 0 -14px 16px rgba(2, 6, 23, 0.28);
          animation: bus-driver-settle 1.9s cubic-bezier(0.36, 0.06, 0.29, 0.97) infinite;
        }

        .bus-front-left-passenger {
          position: absolute;
          left: 48.4%; top: 26.2%;
          width: 11.6%; height: 15.6%;
          overflow: hidden;
          clip-path: polygon(18% 2%, 94% 6%, 98% 95%, 10% 97%, 4% 52%);
          transform: perspective(760px) rotateY(14deg) rotate(0.7deg);
          transform-origin: 50% 50%;
          box-shadow: inset 0 -14px 16px rgba(2, 6, 23, 0.34);
          animation: bus-driver-settle 2s cubic-bezier(0.36, 0.06, 0.29, 0.97) infinite;
          z-index: 1;
        }

        .bus-front-left-passenger-img {
          position: absolute;
          left: 2%; top: 3%;
          width: 130%; height: 166%;
          object-fit: cover;
          object-position: center 10%;
          filter: saturate(0.8) contrast(1.05) brightness(0.88);
          opacity: 0.93;
          transform: scaleX(-1) rotate(-2deg);
          animation: bus-passenger-idle 1.8s ease-in-out infinite;
        }

        .bus-driver-fit-img {
          position: absolute;
          left: -2%; top: 3%;
          width: 95%; height: 112%;
          object-fit: cover;
          object-position: center 8%;
          filter: saturate(0.82) contrast(1.08) brightness(0.9);
          opacity: 0.95;
          transform: scaleX(-1) rotate(5deg);
          animation: bus-driver-idle 1.65s ease-in-out infinite;
          z-index: 1;
        }

        @keyframes bus-bob {
          0%, 100% { transform: translateY(0) rotate(-0.35deg); }
          32% { transform: translateY(-4px) rotate(0.12deg); }
          62% { transform: translateY(-8px) rotate(0.24deg); }
          82% { transform: translateY(2px) rotate(-0.16deg); }
        }

        @keyframes bus-cloud-drift {
          0% { opacity: 0.2; transform: translateX(-18px) scale(0.84); }
          36% { opacity: 0.76; }
          100% { opacity: 0; transform: translateX(172px) scale(1.3); }
        }

        @keyframes bus-trail-cloud {
          0% { opacity: 0.62; transform: translateX(-6px) scale(0.78); }
          34% { opacity: 0.96; }
          100% { opacity: 0; transform: translateX(92px) scale(1.22); }
        }

        @keyframes bus-driver-settle {
          0%, 100% { transform: perspective(760px) rotateY(-12deg) rotate(-0.55deg) translateY(0); }
          34% { transform: perspective(760px) rotateY(-12deg) rotate(-0.4deg) translateY(-1px); }
          68% { transform: perspective(760px) rotateY(-12deg) rotate(-0.75deg) translateY(1px); }
        }

        @keyframes bus-driver-idle {
          0%, 100% { transform: scaleX(-1) rotate(5deg) translateY(0); }
          28% { transform: scaleX(-1) rotate(4.1deg) translateY(-1px); }
          62% { transform: scaleX(-1) rotate(5.9deg) translateY(1px); }
          82% { transform: scaleX(-1) rotate(4.6deg) translateY(0); }
        }

        @keyframes bus-passenger-idle {
          0%, 100% { transform: scaleX(-1) rotate(-2deg) translateY(0); }
          34% { transform: scaleX(-1) rotate(-1.3deg) translateY(-1px); }
          72% { transform: scaleX(-1) rotate(-2.6deg) translateY(1px); }
        }

        @keyframes page-fade-up {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes hero-title-reveal {
          0% { opacity: 0; transform: translateY(14px); filter: blur(3px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes hero-title-shimmer-soft {
          0% { background-position: 0 50%; }
          100% { background-position: -520px 50%; }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
        </div>
    );
}