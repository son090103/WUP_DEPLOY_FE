import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

type RouteCard = {
  id: number;
  tag: string;
  title: string;
  image: string;
  rows: { city: string; fare: string }[];
};

type PromoCard = {
  id: number;
  image: string;
  alt: string;
  zoomY?: number;
  position?: string;
};

const routeCards: RouteCard[] = [
  {
    id: 1,
    tag: "SL4at",
    title: "Xuat phat tu Da Lat",
    image: "/images/Image1.png",
    rows: [
      { city: "TP. HCM", fare: "280.000 vnd" },
      { city: "Da Nang", fare: "420.000 vnd" },
      { city: "Can Tho", fare: "450.000 vnd" },
    ],
  },
  {
    id: 2,
    tag: "TE. NCM",
    title: "Xuat phat tu TP. HCM",
    image: "/images/Image2.png",
    rows: [
      { city: "Da Lat", fare: "250.000 vnd" },
      { city: "Can Tho", fare: "162.000 vnd" },
      { city: "Long Xuyen", fare: "200.000 vnd" },
    ],
  },
  {
    id: 3,
    tag: "Ss Hkig",
    title: "Xuat phat tu Da Nang",
    image: "/images/image 12.png",
    rows: [
      { city: "Da Lat", fare: "430.000 vnd" },
      { city: "Buon Ma Thuot", fare: "510.000 vnd" },
      { city: "Nha Trang", fare: "390.000 vnd" },
    ],
  },
  {
    id: 4,
    tag: "NS N6",
    title: "Xuat phat tu Ha Noi",
    image: "/images/Image3.png",
    rows: [
      { city: "TP. HCM", fare: "280.000 vnd" },
      { city: "Da Nang", fare: "420.000 vnd" },
      { city: "Can Tho", fare: "450.000 vnd" },
    ],
  },
];

const promoCards: PromoCard[] = [
  { id: 1, image: "/images/km1.png", alt: "Khuyen mai 1", zoomY: 1.56, position: "50% 46%" },
  { id: 2, image: "/images/km2.png", alt: "Khuyen mai 2", zoomY: 1.46, position: "50% 46%" },
  { id: 3, image: "/images/km3.png", alt: "Khuyen mai 3", zoomY: 1.44, position: "50% 47%" },
  { id: 4, image: "/images/km4.png", alt: "Khuyen mai 4", zoomY: 1.52, position: "50% 46%" },
  { id: 5, image: "/images/km5.png", alt: "Khuyen mai 5", zoomY: 1.62, position: "50% 44%" },
  { id: 6, image: "/images/km6.png", alt: "Khuyen mai 6", zoomY: 1.45, position: "50% 47%" },
];

const promoPageSize = 4;
const promoPages = Array.from(
  { length: Math.ceil(promoCards.length / promoPageSize) },
  (_, pageIndex) =>
    Array.from({ length: promoPageSize }, (_, slot) => {
      const idx = (pageIndex * promoPageSize + slot) % promoCards.length;
      return promoCards[idx];
    })
);

export default function Home2() {
  const [promoPage, setPromoPage] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setPromoPage((prev) => (prev + 1) % promoPages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {/* ===== Gradient overlays ===== */}
      <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.93)_34%,rgba(255,255,255,0.64)_56%,rgba(255,255,255,0.16)_78%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#f3ece5] to-[#ece7e2]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#ece7e2]" />

      {/* ===== Bus - ẨN hoàn toàn trên mobile ===== */}
      <div className="pointer-events-none absolute top-[18%] right-[0%] z-10 w-[66%] max-w-[860px] md:top-[9%] md:w-[62%] hidden md:block">
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
          <span className="bus-tail-cloud bus-tail-cloud-6 absolute right-[24%] top-[44%] h-[26%] w-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.38)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
        </div>
        <div className="bus-bob relative z-10">
          <img
            src="/images/bus7.png"
            alt="Bus overlay"
            className="w-full object-contain block relative -top-100"
            style={{
              imageRendering: "auto",
              filter: "drop-shadow(0 24px 28px rgba(15,23,42,0.28)) drop-shadow(0 0 22px rgba(255,255,255,0.5))",
            }}
          />
          <div className="pointer-events-none absolute inset-0">
            <div className="bus-front-left-passenger">
              <img src="/images/loxe1.png" alt="Front passenger" className="bus-front-left-passenger-img" />
            </div>
            <div className="bus-driver-fit">
              <img src="/images/1me1.png" alt="Driver" className="bus-driver-fit-img" />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Hero copy ===== */}
      <div className="relative z-20 mx-auto flex w-full max-w-[1240px] items-center px-4
                      min-h-[320px] pt-20 pb-6
                      md:min-h-[680px] md:pt-24 md:pb-24
                      lg:min-h-[780px] lg:pt-20">
        <div className="page-enter-copy relative isolate w-full max-w-[760px]
                        space-y-3 md:space-y-6
                        md:-ml-14 lg:-ml-24">

          {/* Glow - ẩn mobile */}
          <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 hidden md:block h-[360px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.46)_34%,rgba(255,255,255,0.18)_56%,rgba(255,255,255,0)_78%)] blur-[26px]" />

          <h1 className="hero-title relative z-10 py-1 font-black leading-[1.05] tracking-[-0.03em] text-[#0d142a]
                         text-[34px] sm:text-[48px] md:text-[58px] lg:text-[72px]">
            <span className="hero-title-line block whitespace-nowrap">Tìm và đặt ngay</span>
            <span className="hero-title-line mt-1 md:mt-2 block whitespace-nowrap">những chuyến xe</span>
            <span className="hero-title-line mt-1 md:mt-2 block whitespace-nowrap font-extrabold italic">
              <span className="text-[#0d142a]">thật</span>{" "}
              <span className="hero-title-shimmer">Dễ Dàng</span>
            </span>
          </h1>

          {/* Subtitle - ẩn mobile */}
          <p className="relative z-10 hidden sm:block max-w-[510px] text-base leading-relaxed text-[#475569] lg:text-lg">
            Đặt vé mọi lúc mọi nơi, đi vững ngàn hành trình đa dạng và dịch vụ
            chắt lượng cao nhất.
          </p>
        </div>
      </div>

      {/* ===== Search Box ===== */}
      <section className="page-enter-search relative z-30 -mt-2 md:-mt-28 bg-gradient-to-b from-transparent via-[#ece7e2]/75 to-[#ece7e2]">
        <div className="mx-auto w-full max-w-[1460px] px-3">
          <div className="w-full rounded-[10px] border border-[#f2e5d8] bg-white/95 p-2.5 shadow-[0_24px_35px_-24px_rgba(251,146,60,0.9)] backdrop-blur">

            {/* Desktop: ngang / Mobile: dọc */}
            <div className="flex flex-col md:grid md:items-stretch md:gap-0 md:grid-cols-[1.35fr_1.35fr_1.05fr_0.85fr_max-content]">
              <FieldInput icon={<MapPin size={14} />} label="Điểm đi" name="origin" placeholder="Nhập điểm đi" divider />
              <FieldInput icon={<MapPin size={14} />} label="Điểm đến" name="destination" placeholder="Nhập điểm đến" divider />
              <FieldInput icon={<CalendarDays size={14} />} label="Ngày đặt vé" name="departureDate" type="date" divider />
              <FieldInput icon={<Users size={14} />} label="Số lượng vé" name="tickets" type="number" defaultValue={1} min={1} max={6} />

              <div className="px-2.5 pb-2.5 pt-1 md:p-0">
                <Link to="/lichtrinhdetail" className="block">
                  <button
                    type="button"
                    className="w-full md:m-1.5 md:w-auto min-h-[48px] md:min-h-[60px] rounded-[8px] bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-8 text-sm font-bold text-white shadow-[0_18px_30px_-14px_rgba(216,113,28,0.95)] transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31]"
                  >
                    Tìm kiếm
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== Content ===== */}
      <section className="page-enter-content relative -mt-px bg-[#ece7e2] pb-20 pt-8 md:pt-12">
        <div className="mx-auto max-w-[1240px] px-4">

          {/* Promo */}
          <div className="mb-10 md:mb-14">
            <div className="mb-4 md:mb-6 text-center">
              <p className="inline-flex rounded-full bg-[#ffe8cf] px-4 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#e58e2b]">
                Khuyến mãi nổi bật
              </p>
            </div>

            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${promoPage * 100}%)` }}
              >
                {promoPages.map((page, pageIndex) => (
                  <div key={`promo-page-${pageIndex}`} className="w-full shrink-0">
                    {/* Mobile: 2 cột / Desktop: 4 cột */}
                    <div className="grid gap-3 grid-cols-2 md:gap-6 md:grid-cols-4">
                      {page.map((promo, slotIndex) => (
                        <article
                          key={`promo-card-${pageIndex}-${slotIndex}-${promo.id}`}
                          className="overflow-hidden rounded-[10px] border border-[#f3dcc6] bg-white shadow-[0_28px_45px_-40px_rgba(181,98,27,0.9)]"
                        >
                          <div className="h-[120px] md:h-[180px] w-full overflow-hidden bg-white">
                            <img
                              src={promo.image}
                              alt={promo.alt}
                              draggable={false}
                              className="block h-full w-full object-cover"
                              style={{
                                transform: `scale(1.02, ${promo.zoomY ?? 1.5})`,
                                transformOrigin: "center",
                                objectPosition: promo.position ?? "50% 46%",
                              }}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {promoPages.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2.5">
                {promoPages.map((_, dotIndex) => (
                  <button
                    key={`promo-dot-${dotIndex}`}
                    type="button"
                    onClick={() => setPromoPage(dotIndex)}
                    aria-label={`Xem khuyến mãi ${dotIndex + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${promoPage === dotIndex ? "w-6 bg-[#f08d2c]" : "w-2.5 bg-[#d8c5b5] hover:bg-[#e7b98f]"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Route Cards */}
          <div className="mb-6 md:mb-12 text-center">
            <p className="mb-3 md:mb-5 inline-flex rounded-full bg-[#ffe8cf] px-4 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#e58e2b]">
              Tuyến xe nổi bật
            </p>
            {/* Title - compact mobile */}
            <h2 className="font-black tracking-[-0.03em] text-[#2f2118] text-2xl sm:text-3xl md:text-5xl">
              Các tuyến xe phổ biến hiện nay
            </h2>
          </div>

          {/* Mobile: scroll ngang / Desktop: 4 cột */}
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory
                          md:grid md:gap-6 md:grid-cols-4 md:overflow-visible md:pb-0
                          scrollbar-hide">
            {routeCards.map((route) => (
              <article
                key={route.id}
                className="overflow-hidden rounded-[10px] border border-[#f3dcc6] bg-white shadow-[0_28px_45px_-40px_rgba(181,98,27,0.9)]
                           min-w-[72vw] sm:min-w-[50vw] snap-start
                           md:min-w-0"
              >
                <div className="relative h-[140px] md:h-[180px]">
                  <img src={route.image} alt={route.title} className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-[#fff8ef]/95 px-3 py-1 text-[11px] font-bold uppercase text-[#6b4c37]">
                    {route.tag}
                  </span>
                </div>
                <div className="space-y-3 p-4 md:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b28d70]">
                    {route.title}
                  </p>
                  <div className="space-y-2">
                    {route.rows.map((row) => (
                      <div key={`${route.id}-${row.city}`} className="flex items-center justify-between text-sm">
                        <span className="text-[#6b4b39]">{row.city}</span>
                        <span className="font-black text-[#2f2118]">{row.fare}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-[7px] bg-gradient-to-r from-[#f39a32] to-[#e77416] px-4 py-2.5 md:py-3 text-sm font-bold text-white shadow-[0_18px_30px_-16px_rgba(216,113,28,0.88)] transition duration-200 hover:from-[#f7a73f] hover:to-[#ee8528]"
                  >
                    Đặt vé ngay
                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 md:mt-12 text-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[#e4bb94] bg-[#fff4e7] px-7 py-3 text-sm font-bold text-[#6a4932] shadow-[0_10px_22px_-16px_rgba(180,95,21,0.78)] transition duration-200 hover:border-[#d99861] hover:bg-[#ffe9d4] hover:text-[#a45b1f]"
            >
              Xem tất cả các chuyến
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <style>{`
        /* ===== Scrollbar ẩn cho route cards scroll ngang ===== */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        .page-enter-nav,
        .page-enter-copy,
        .page-enter-search,
        .page-enter-content {
          opacity: 0; will-change: transform, opacity;
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
        .page-enter-nav    { animation-name: page-fade-down; animation-duration: 0.92s; animation-delay: 0.04s; }
        .page-enter-copy   { animation-name: page-fade-up;   animation-duration: 1.08s; animation-delay: 0.2s; }
        .page-enter-search { animation-name: page-fade-up;   animation-duration: 0.96s; animation-delay: 0.42s; }
        .page-enter-content{ animation-name: page-fade-up;   animation-duration: 0.96s; animation-delay: 0.52s; }

        .hero-title-line {
          opacity: 0; transform: translateY(14px);
          animation: hero-title-reveal 1.12s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .hero-title-line:nth-child(1) { animation-delay: 0.36s; }
        .hero-title-line:nth-child(2) { animation-delay: 0.54s; }
        .hero-title-line:nth-child(3) { animation-delay: 0.72s; }

        .hero-title-shimmer {
          color: #ff7a1b; display: inline-block; line-height: 1.12;
          padding-bottom: 0.14em; margin-bottom: 0;
          background-image: repeating-linear-gradient(100deg,#ff7a1b 0px,#ff7a1b 120px,#ff9226 185px,#ffb347 260px,#ff9226 335px,#ff7a1b 400px,#e8791c 520px);
          background-size: 520px 100%; background-position: 0 50%; background-repeat: repeat;
          background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          text-shadow: 0 1px 0 rgba(255,181,88,0.36),0 2px 0 rgba(234,121,27,0.38),0 4px 0 rgba(178,76,16,0.3),0 10px 16px rgba(94,40,9,0.22);
          -webkit-text-stroke: 0.26px rgba(136,57,12,0.26);
          filter: saturate(1.16) contrast(1.12) brightness(1.06);
          animation: hero-title-shimmer-soft 5.8s linear infinite; will-change: background-position;
        }

        .bus-bob { animation: bus-bob 1.9s cubic-bezier(0.36,0.06,0.29,0.97) infinite; transform-origin: 56% 74%; will-change: transform; }
        .bus-aero-overlay { transform: rotate(12deg); transform-origin: 22% 50%; }
        .bus-cloud { animation: bus-cloud-drift 1.75s ease-out infinite; will-change: transform, opacity; }
        .bus-cloud-1 { animation-delay: 0.06s; animation-duration: 1.95s; }
        .bus-cloud-2 { animation-delay: 0.26s; animation-duration: 1.55s; }
        .bus-cloud-3 { animation-delay: 0.42s; animation-duration: 1.58s; }
        .bus-cloud-4 { animation-delay: 0.62s; animation-duration: 1.84s; }
        .bus-cloud-5 { animation-delay: 0.78s; animation-duration: 1.72s; }
        .bus-cloud-6 { animation-delay: 0.94s; animation-duration: 1.6s; }
        .bus-aero-trail { transform: rotate(12deg); transform-origin: 22% 50%; will-change: transform; }
        .bus-tail-cloud { animation: bus-trail-cloud 1.55s ease-out infinite; will-change: transform, opacity; }
        .bus-tail-cloud-1 { animation-delay: 0.06s; }
        .bus-tail-cloud-2 { animation-delay: 0.32s; }
        .bus-tail-cloud-3 { animation-delay: 0.54s; }
        .bus-tail-cloud-4 { animation-delay: 0.76s; }
        .bus-tail-cloud-6 { animation-delay: 0.22s; animation-duration: 1.45s; }

        .bus-driver-fit {
          position: absolute; left: 26.3%; top: 30.7%; width: 11.6%; height: 15.8%;
          overflow: hidden; clip-path: polygon(8% 1%, 96% 5%, 100% 95%, 22% 98%, 2% 56%);
          transform: perspective(760px) rotateY(-12deg) rotate(-0.55deg); transform-origin: 54% 50%;
          animation: bus-driver-settle 1.9s cubic-bezier(0.36,0.06,0.29,0.97) infinite; will-change: transform;
        }
        .bus-driver-fit-img {
          position: absolute; left: -2%; top: 3%; width: 95%; height: 112%;
          object-fit: cover; object-position: center 8%;
          filter: saturate(0.82) contrast(1.08) brightness(0.9); opacity: 0.95;
          transform: scaleX(-1) rotate(5deg);
          animation: bus-driver-idle 1.65s ease-in-out infinite; will-change: transform; z-index: 1;
        }
        .bus-front-left-passenger {
          position: absolute; left: 48.4%; top: 26.2%; width: 11.6%; height: 15.6%;
          overflow: hidden; clip-path: polygon(18% 2%, 94% 6%, 98% 95%, 10% 97%, 4% 52%);
          transform: perspective(760px) rotateY(14deg) rotate(0.7deg); transform-origin: 50% 50%;
          animation: bus-driver-settle 2s cubic-bezier(0.36,0.06,0.29,0.97) infinite; will-change: transform; z-index: 1;
        }
        .bus-front-left-passenger-img {
          position: absolute; left: 2%; top: 3%; width: 130%; height: 166%;
          object-fit: cover; object-position: center 10%;
          filter: saturate(0.8) contrast(1.05) brightness(0.88); opacity: 0.93;
          transform: scaleX(-1) rotate(-2deg);
          animation: bus-passenger-idle 1.8s ease-in-out infinite; will-change: transform;
        }

        @keyframes bus-bob { 0%,100%{transform:translateY(0) rotate(-0.35deg)} 32%{transform:translateY(-4px) rotate(0.12deg)} 62%{transform:translateY(-8px) rotate(0.24deg)} 82%{transform:translateY(2px) rotate(-0.16deg)} }
        @keyframes bus-cloud-drift { 0%{opacity:.2;transform:translateX(-18px) scale(.84)} 36%{opacity:.76} 100%{opacity:0;transform:translateX(172px) scale(1.3)} }
        @keyframes bus-trail-cloud { 0%{opacity:.62;transform:translateX(-6px) scale(.78)} 34%{opacity:.96} 100%{opacity:0;transform:translateX(92px) scale(1.22)} }
        @keyframes bus-driver-settle { 0%,100%{transform:perspective(760px) rotateY(-12deg) rotate(-0.55deg) translateY(0)} 34%{transform:perspective(760px) rotateY(-12deg) rotate(-0.4deg) translateY(-1px)} 68%{transform:perspective(760px) rotateY(-12deg) rotate(-0.75deg) translateY(1px)} }
        @keyframes bus-driver-idle { 0%,100%{transform:scaleX(-1) rotate(5deg) translateY(0)} 28%{transform:scaleX(-1) rotate(4.1deg) translateY(-1px)} 62%{transform:scaleX(-1) rotate(5.9deg) translateY(1px)} 82%{transform:scaleX(-1) rotate(4.6deg) translateY(0)} }
        @keyframes bus-passenger-idle { 0%,100%{transform:scaleX(-1) rotate(-2deg) translateY(0)} 34%{transform:scaleX(-1) rotate(-1.3deg) translateY(-1px)} 72%{transform:scaleX(-1) rotate(-2.6deg) translateY(1px)} }
        @keyframes page-fade-down { 0%{opacity:0;transform:translateY(-18px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes page-fade-up   { 0%{opacity:0;transform:translateY(24px)}  100%{opacity:1;transform:translateY(0)} }
        @keyframes hero-title-reveal { 0%{opacity:0;transform:translateY(14px);filter:blur(3px)} 100%{opacity:1;transform:translateY(0);filter:blur(0)} }
        @keyframes hero-title-shimmer-soft { 0%{background-position:0 50%} 100%{background-position:-520px 50%} }

        @media (prefers-reduced-motion: reduce) {
          .page-enter-nav,.page-enter-copy,.page-enter-search,.page-enter-content,
          .hero-title-line,.hero-title-shimmer,.bus-bob,.bus-cloud,.bus-tail-cloud,
          .bus-front-left-passenger,.bus-front-left-passenger-img,.bus-driver-fit,.bus-driver-fit-img {
            animation: none !important; opacity: 1 !important; transform: none !important;
          }
        }
      `}</style>
    </>
  );
}

function FieldInput({
  icon, label, name, placeholder = "", type = "text",
  defaultValue, min, max, divider = false,
}: {
  icon: ReactNode; label: string; name: string; placeholder?: string;
  type?: "text" | "date" | "number"; defaultValue?: string | number;
  min?: string | number; max?: string | number; divider?: boolean;
}) {
  return (
    <div className={`relative min-h-[56px] px-4 py-2
      ${divider ? "border-b border-[#edd9c6] md:border-b-0 md:after:absolute md:after:right-0 md:after:top-1/2 md:after:h-[70%] md:after:w-px md:after:-translate-y-1/2 md:after:bg-[#d9b38f]" : ""}`}>
      <label htmlFor={name} className="mb-1 block text-[10px] font-bold uppercase tracking-[0.13em] text-[#b58460]">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg bg-[#fffdfb] px-2 py-1 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-[#edb785]">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ffecd9] text-[#e07a2b]">
          {icon}
        </span>
        <input
          id={name} name={name} type={type} placeholder={placeholder}
          defaultValue={defaultValue} min={min} max={max}
          className="h-7 w-full bg-transparent text-[13px] font-semibold text-[#4a3426] outline-none placeholder:text-[#9f8570] [color-scheme:light]"
        />
      </div>
    </div>
  );
}