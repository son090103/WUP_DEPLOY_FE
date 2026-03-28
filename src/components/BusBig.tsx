export default function BustripLogoBg() {
  return (
    // Ẩn trên màn nhỏ và trung bình, chỉ hiển thị từ lg trở lên; dịch chuyển & scale để không tràn
    <div
      className="
          hidden lg:block
          absolute top-0 right-0
          w-[48vw] h-[48vw] max-w-[780px] max-h-[780px]
          opacity-20 z-30 pointer-events-none
  
          /* scale theo breakpoint lớn để tránh tràn */
          md:scale-[0.65]
          lg:scale-[0.85]
          xl:scale-100
  
          /* dịch sang trong để không chọc ra ngoài viewport */
          translate-x-4 -translate-y-4 lg:translate-x-0 lg:-translate-y-0
  
          origin-top-right
        "
      aria-hidden
    >
      <img
        src="/images/vectorxe2.png"
        className="absolute"
        style={{ top: "2%", left: "34.5%", width: "48%", height: "22%" }}
        alt=""
      />

      <img
        src="/images/vectorxe3.png"
        className="absolute"
        style={{ top: "10%", left: "31%", width: "50%", height: "65%" }}
        alt=""
      />

      <img
        src="/images/veactorxe1.png"
        className="absolute"
        style={{ top: "13%", left: "18%", width: "15%", height: "58%" }}
        alt=""
      />

      <img
        src="/images/vectorxe4.png"
        className="absolute"
        style={{ bottom: "19%", left: "34.5%", width: "48%", height: "23%" }}
        alt=""
      />
    </div>
  );
}
