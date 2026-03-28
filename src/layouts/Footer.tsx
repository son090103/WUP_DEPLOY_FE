import { type ReactNode } from "react";
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";

const sanPhamLinks = [
  "Đặt vé xe",
  "Lịch trình",
  "Tra cứu vé",
  "Ưu đãi thành viên",
  "Ứng dụng di động",
];

const hoTroLinks = [
  "Trung tâm trợ giúp",
  "Hướng dẫn đặt vé",
  "Chính sách hoàn tiền",
  "Điều khoản sử dụng",
  "Câu hỏi thường gặp",
];

const veChungToiLinks = [
  "Giới thiệu CoachTrip",
  "Câu chuyện thương hiệu",
  "Tuyển dụng",
  "Liên hệ hợp tác",
  "Tin tức",
];

function Footer() {
  return (
    <footer
      role="contentinfo"
      className="bg-gradient-to-b from-[#f29a3b] via-[#ed8b2e] to-[#e97b1f] text-[#fffaf4]"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 md:px-8 pb-8 pt-8 sm:pt-12">
        <div className="grid gap-8 text-center sm:text-left grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.45fr_1fr_1fr_1fr_0.95fr]">
          <div className="space-y-5">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <img
                src="/images/logo1.png"
                alt="CoachTrip logo"
                className="h-12 sm:h-14 w-auto object-contain"
              />
              <span className="text-xl sm:text-2xl font-black tracking-wide">
                COACHTRIP
              </span>
            </div>

            <p className="mx-auto sm:mx-0 max-w-[320px] sm:max-w-[280px] text-sm leading-relaxed text-[#fff3e7]/95">
              Nền tảng đặt vé xe trực tuyến nhanh chóng, minh bạch và tiện lợi
              cho mọi hành trình của bạn.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-center sm:justify-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#ffe2c4]" />
                <div>
                  <p>Đại học FPT, Cơ sở Đà Nẵng</p>
                  <p className="text-[#ffe8d4]/85">
                    Khu đô thị FPT City, Ngũ Hành Sơn
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3">
                <Phone className="h-5 w-5 shrink-0 text-[#ffe2c4]" />
                <span>Hotline: 1900 6868</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3">
                <Mail className="h-5 w-5 shrink-0 text-[#ffe2c4]" />
                <span>support@coachtrip.vn</span>
              </div>
            </div>
          </div>

          <FooterColumn title="Sản phẩm" links={sanPhamLinks} />
          <FooterColumn title="Hỗ trợ" links={hoTroLinks} />
          <FooterColumn title="Về chúng tôi" links={veChungToiLinks} />

          <div>
            <h3 className="mb-4 text-base font-bold uppercase tracking-[0.08em] text-[#fff1e3]">
              Kết nối
            </h3>
            <div className="flex justify-center sm:justify-start gap-3 flex-wrap">
              <SocialButton
                icon={<Facebook className="h-4 w-4" />}
                label="Facebook"
              />
              <SocialButton
                icon={<Instagram className="h-4 w-4" />}
                label="Instagram"
              />
              <SocialButton
                icon={<Youtube className="h-4 w-4" />}
                label="YouTube"
              />
            </div>
            <p className="mt-4 text-sm text-[#fff0e1]/90">
              Theo dõi chúng tôi để nhận ưu đãi sớm nhất.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 border-t border-white/25 pt-5 text-center text-sm text-[#fff2e3]/95 sm:text-left">
          © 2026 CoachTrip. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="mb-4 text-base font-bold uppercase tracking-[0.08em] text-[#fff1e3]">
        {title}
      </h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((item) => (
          <li key={item}>
            <a
              href="#"
              className="text-[#fff3e7]/95 transition duration-200 hover:text-white hover:underline"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-white/55 bg-white/10 text-[#fffaf4] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-[#e6781a] focus:outline-none focus:ring-2 focus:ring-white/40"
    >
      {icon}
    </a>
  );
}

export default Footer;
