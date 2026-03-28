export default function BustripLogo({ className }: { className?: string }) {
  return (
    <div
      className={`relative ${
        className ?? ""
      } w-12 h-12 sm:w-12 sm:h-12 md:w-14 md:h-14`}
      aria-hidden
    >
      {/* Cung tròn trên */}
      <img
        src="./images/Vector1.svg"
        className="absolute"
        style={{
          top: "1px",
          right: "2px",
          left: "19px",
          width: "30px",
          height: "20px",
        }}
        alt=""
      />

      {/* Hình tam giác trung tâm */}
      <img
        src="./images/Vector3.svg"
        className="absolute"
        style={{ top: "8px", left: "6px", width: "100%", height: "36px" }}
        alt=""
      />

      {/* Hình oval bên trái */}
      <img
        src="./images/Vector.svg"
        className="absolute"
        style={{ top: "10px", left: "6px", width: "14px", height: "32px" }}
        alt=""
      />

      {/* Cung tròn dưới */}
      <img
        src="./images/Vector2.svg"
        className="absolute"
        style={{
          bottom: "0px",
          top: "30px",
          right: "1px",
          left: "19px",
          width: "30px",
          height: "20px",
        }}
        alt=""
      />
    </div>
  );
}
