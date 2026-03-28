import React, { useState } from "react";
import { Package } from "lucide-react";

/* ================= TYPES ================= */

type OrderItem = {
    id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
};

type PaymentMethod = "cash" | "recipient" | "banking";

/* ================= COMPONENT ================= */

export default function CheckoutPage() {
    const [orderItems] = useState<OrderItem[]>([
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

    const [formData, setFormData] = useState({
        lastName: "",
        firstName: "",
        fullName: "",
        address: "",
        city: "",
        district: "",
        email: "",
        phone: "",
        notes: "",
    });

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
    const discount = 0.1; // 10%

    const calculateSubtotal = () => {
        return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const calculateShippingFee = () => {
        return 150000;
    };

    const calculateDiscount = () => {
        return calculateSubtotal() * discount;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShippingFee() - calculateDiscount();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "decimal",
            minimumFractionDigits: 0,
        }).format(amount) + "đ";
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        // Validate required fields
        if (!formData.lastName || !formData.firstName || !formData.address || !formData.phone) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
            return;
        }

        alert("Đặt đơn thành công!");
    };

    const handleReset = () => {
        setFormData({
            lastName: "",
            firstName: "",
            fullName: "",
            address: "",
            city: "",
            district: "",
            email: "",
            phone: "",
            notes: "",
        });
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
            <div className="relative z-20 mx-auto flex min-h-[520px] w-full max-w-[1240px] items-center px-4 pb-16 pt-24 lg:min-h-[580px] lg:pt-20">
                <div className="page-enter-copy relative isolate -ml-8 max-w-[760px] space-y-6 sm:-ml-14 lg:-ml-24">
                    <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 h-[360px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.46)_34%,rgba(255,255,255,0.18)_56%,rgba(255,255,255,0)_78%)] blur-[26px]" />
                    <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 h-[300px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(248,250,252,0.46)_0%,rgba(248,250,252,0.14)_58%,rgba(248,250,252,0)_84%)] blur-[18px]" />
                    <h1 className="hero-title relative z-10 py-1 text-[48px] font-black leading-[1.05] tracking-[-0.03em] text-[#0d142a] sm:text-[58px] lg:text-[72px]">
                        <span className="hero-title-line block whitespace-nowrap">
                            Hoàn tất đơn hàng
                        </span>
                        <span className="hero-title-line mt-2 block whitespace-nowrap">
                            và nhận hàng
                        </span>
                        <span className="hero-title-line mt-2 block whitespace-nowrap font-extrabold italic">
                            <span className="text-[#0d142a]">một cách</span>{" "}
                            <span className="hero-title-shimmer">An Toàn</span>
                        </span>
                    </h1>
                    <p className="relative z-10 max-w-[510px] text-base leading-relaxed text-[#475569] lg:text-lg">
                        Điền thông tin chi tiết để chúng tôi có thể giao hàng đến đúng địa chỉ và đúng người nhận.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-30 min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-100 py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Thông tin Người nhận / Nơi Nhận */}
                            <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-100/50 p-8">
                                <h2 className="text-2xl font-black text-slate-800 mb-6">
                                    Thông tin Người nhận / Nơi Nhận
                                </h2>

                                <div className="space-y-4">
                                    {/* Họ và Tên */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Họ T
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                placeholder="Nhập họ"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Tên
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                placeholder="Nhập tên"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Chỉ tiết (không bắt buộc)
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                placeholder=""
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Địa chỉ nhận hàng */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Địa chỉ nhận hàng
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Nhập địa chỉ cụ thể của nơi nhận"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Tỉnh/Thành phố và Quận/Huyện */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Tỉnh / Thành phố
                                            </label>
                                            <select
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none transition-colors appearance-none bg-white"
                                            >
                                                <option value="">Select</option>
                                                <option value="hcm">TP. Hồ Chí Minh</option>
                                                <option value="hanoi">Hà Nội</option>
                                                <option value="danang">Đà Nẵng</option>
                                                <option value="cantho">Cần Thơ</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Quận / Huyện
                                            </label>
                                            <select
                                                name="district"
                                                value={formData.district}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none transition-colors appearance-none bg-white"
                                            >
                                                <option value="">Selects</option>
                                                <option value="q1">Quận 1</option>
                                                <option value="q2">Quận 2</option>
                                                <option value="q3">Quận 3</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Email và Số điện thoại */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Email (không bắt buộc)
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Email"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Số điện thoại
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="Số điện thoại người nhận"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin chi tiết */}
                            <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-100/50 p-8">
                                <h2 className="text-2xl font-black text-slate-800 mb-6">
                                    Thông tin chi tiết
                                </h2>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Ghi chú thêm chi tiết nhận hàng
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="Chi tiết tên thường gọi, địa chỉ nhận hàng, số điện thoại dự phòng,....."
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                                        rows={6}
                                    />
                                </div>

                                <button
                                    onClick={handleReset}
                                    className="mt-4 px-6 py-3 rounded-xl border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold transition-colors"
                                >
                                    Trở lại
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-100/50 p-6 sticky top-8">
                                <h2 className="text-xl font-black text-slate-800 mb-6">
                                    Tổng quan đơn hàng
                                </h2>

                                {/* Order Items */}
                                <div className="space-y-4 mb-6">
                                    {orderItems.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded-xl border-2 border-orange-200"
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 text-sm">
                                                    {item.name} x{item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-800">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Price Summary */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Chi phí:</span>
                                        <span className="font-bold text-slate-800">
                                            {formatCurrency(calculateSubtotal())}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm pb-3 border-b border-slate-200">
                                        <span className="text-slate-600">Khuyến mãi:</span>
                                        <span className="font-bold text-slate-800">
                                            {Math.round(discount * 100)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-lg font-bold text-slate-800">Tổng tiền:</span>
                                        <span className="text-2xl font-black text-orange-600">
                                            {formatCurrency(calculateTotal())}
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="mb-6">
                                    <h3 className="text-base font-black text-slate-800 mb-4">
                                        Payment Method
                                    </h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cash"
                                                checked={paymentMethod === "cash"}
                                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                                className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-slate-700">
                                                Người gửi thanh toán bằng tiền mặt
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="recipient"
                                                checked={paymentMethod === "recipient"}
                                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                                className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-slate-700">
                                                Người nhận thanh toán
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="banking"
                                                checked={paymentMethod === "banking"}
                                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                                className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-slate-700">Banking</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Place Order Button */}
                                <button
                                    onClick={handleSubmit}
                                    className="w-full py-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Package size={20} />
                                    Đặt đơn
                                </button>

                            </div>
                        </div>
                    </div>
                </div>

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
        </div>
    );
}