// import { useState } from "react";

// // ─── Types ────────────────────────────────────────────────────────────────────
// type SeatStatus = "sold" | "available" | "selecting";

// interface Seat {
//   id: string;
//   label: string;
//   status: SeatStatus;
//   floor: 1 | 2;
//   row: number;
//   col: number;
// }

// // ─── Generate seat map ─────────────────────────────────────────────────────────
// function generateSeats(): Seat[] {
//   const seats: Seat[] = [];
//   // Floor 1: 5 rows x 3 cols (columns 5,7,9)
//   const f1Layout = [
//     ["A1", "A2", "A3"], ["B1", "B2", "B3"], ["C1", "C2", "C3"],
//     ["D1", "D2", "D3"], ["E1", "E2", "E3"],
//   ];
//   const soldF1 = new Set(["A1", "B2", "C1", "C3", "D2"]);
//   f1Layout.forEach((row, ri) => {
//     row.forEach((label, ci) => {
//       seats.push({
//         id: `f1-${label}`,
//         label,
//         status: soldF1.has(label) ? "sold" : "available",
//         floor: 1,
//         row: ri,
//         col: ci,
//       });
//     });
//   });

//   // Floor 2: 5 rows x 3 cols
//   const f2Layout = [
//     ["A1", "A2", "A3"], ["B1", "B2", "B3"], ["C1", "C2", "C3"],
//     ["D1", "D2", "D3"], ["E1", "E2", "E3"],
//   ];
//   const soldF2 = new Set(["A2", "B1", "C2", "D3"]);
//   f2Layout.forEach((row, ri) => {
//     row.forEach((label, ci) => {
//       seats.push({
//         id: `f2-${label}-${ri}`,
//         label: `${label}`,
//         status: soldF2.has(label) && ri < 2 ? "sold" : "available",
//         floor: 2,
//         row: ri,
//         col: ci,
//       });
//     });
//   });
//   return seats;
// }

// // ─── Seat visual styles ───────────────────────────────────────────────────────
// const seatVisualMap: Record<SeatStatus, { detail: string; frame: string; label: string; leg: string }> = {
//   sold: {
//     detail: "border-gray-400 bg-gray-300",
//     frame: "border-gray-400 bg-gray-200",
//     label: "text-gray-500",
//     leg: "bg-gray-400",
//   },
//   available: {
//     detail: "border-green-500 bg-green-200",
//     frame: "border-green-500 bg-green-100",
//     label: "text-green-700",
//     leg: "bg-green-500",
//   },
//   selecting: {
//     detail: "border-orange-500 bg-orange-300",
//     frame: "border-orange-500 bg-orange-100",
//     label: "text-orange-700",
//     leg: "bg-orange-500",
//   },
// };

// // ─── Seat Icon (CSS div-based) ────────────────────────────────────────────────
// const SeatIcon = ({ status, label, onClick }: { status: SeatStatus; label: string; onClick: () => void }) => {
//   const seatVisual = seatVisualMap[status];
//   return (
//     <div
//       onClick={status !== "sold" ? onClick : undefined}
//       className={`select-none flex flex-col items-center ${status !== "sold" ? "cursor-pointer" : "cursor-default"}`}
//       title={status === "sold" ? "Đã bán" : label}
//     >
//       <div className="relative h-[36px] w-[62px] overflow-visible">
//         {/* Headrest */}
//         <span className={`pointer-events-none absolute left-[13px] top-[1px] h-[11px] w-[35px] rounded-t-[6px] border-[2px] border-b-0 ${seatVisual.detail}`} />
//         {/* Seat body with label */}
//         <span className={`pointer-events-none absolute left-[7px] top-[10px] flex h-[17px] w-[48px] items-center justify-center rounded-[4px] border-[2px] text-[10px] font-black leading-none ${seatVisual.frame} ${seatVisual.label}`}>
//           {label}
//         </span>
//         {/* Left leg */}
//         <span className={`pointer-events-none absolute left-[20px] top-[27px] h-[6px] w-[2px] rounded-b-[1px] ${seatVisual.leg}`} />
//         {/* Right leg */}
//         <span className={`pointer-events-none absolute right-[20px] top-[27px] h-[6px] w-[2px] rounded-b-[1px] ${seatVisual.leg}`} />
//       </div>
//     </div>
//   );
// };

// // ─── Payment method button ─────────────────────────────────────────────────────
// const PayBtn = ({
//   icon, label, selected, onClick,
// }: { icon: React.ReactNode; label: string; selected: boolean; onClick: () => void }) => (
//   <button
//     onClick={onClick}
//     className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-3 px-2 transition-all w-full
//       ${selected ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-200"}`}
//   >
//     <span className={`text-xl ${selected ? "text-orange-500" : "text-gray-500"}`}>{icon}</span>
//     <span className={`text-xs font-semibold ${selected ? "text-orange-600" : "text-gray-600"}`}>{label}</span>
//   </button>
// );

// // ─── Main component ───────────────────────────────────────────────────────────
// export default function TicketBooking() {
//   const [seats, setSeats] = useState<Seat[]>(generateSeats);
//   const [form, setForm] = useState({
//     name: "", phone: "", from: "Đà Nẵng", to: "Quảng Trị",
//     date: "10/06/2004", vehicleType: "Limosine",
//   });
//   const [payment, setPayment] = useState<string>("cash");
//   const [promoCode, setPromoCode] = useState("");
//   const [printAfter, setPrintAfter] = useState(true);

//   const cities = ["Đà Nẵng", "Quảng Trị", "Huế", "TP. Hồ Chí Minh", "Hà Nội", "Đà Lạt", "Cần Thơ"];
//   const vehicles = ["Limosine", "Ghế thường", "Giường nằm", "VIP 9 chỗ"];

//   const toggleSeat = (id: string) => {
//     setSeats(prev => prev.map(s => {
//       if (s.id !== id) return s;
//       if (s.status === "available") return { ...s, status: "selecting" };
//       if (s.status === "selecting") return { ...s, status: "available" };
//       return s;
//     }));
//   };

//   const selectedSeats = seats.filter(s => s.status === "selecting");
//   const seatPrice = 350000;
//   const total = selectedSeats.length * seatPrice;

//   const floor1 = seats.filter(s => s.floor === 1);
//   const floor2 = seats.filter(s => s.floor === 2);

//   const floorRows = (floorSeats: Seat[]) => {
//     const rows: Seat[][] = [];
//     for (let r = 0; r < 5; r++) {
//       rows.push(floorSeats.filter(s => s.row === r));
//     }
//     return rows;
//   };

//   const colLabels = ["5", "7", "9"];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 md:p-8"
//       style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
//       <h1 className="text-2xl font-extrabold text-gray-800 mb-6">Đặt vé cho khách hàng</h1>

//       <div className="flex flex-col lg:flex-row gap-6 items-start">
//         {/* ── Left Column ───────────────────────────────────────────────── */}
//         <div className="flex-1 space-y-5 min-w-0">

//           {/* Thông tin đặt vé */}
//           <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
//             <h2 className="text-sm font-bold text-gray-700 mb-4">Thông tin đặt vé</h2>
//             <div className="grid grid-cols-2 gap-3">
//               {/* Họ tên */}
//               <div>
//                 <label className="block text-xs text-gray-500 mb-1 font-medium">Họ tên khách hàng</label>
//                 <input
//                   type="text"
//                   value={form.name}
//                   onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
//                   placeholder="Nhập tên khách hàng"
//                   className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
//                 />
//               </div>
//               {/* SĐT */}
//               <div>
//                 <label className="block text-xs text-gray-500 mb-1 font-medium">Số điện thoại</label>
//                 <input
//                   type="text"
//                   value={form.phone}
//                   onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
//                   placeholder="092304...."
//                   className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
//                 />
//               </div>
//               {/* Điểm đi */}
//               <div>
//                 <label className="block text-xs text-gray-500 mb-1 font-medium">Điểm đi</label>
//                 <div className="relative">
//                   <select
//                     value={form.from}
//                     onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
//                     className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50 appearance-none pr-8"
//                   >
//                     {cities.map(c => <option key={c}>{c}</option>)}
//                   </select>
//                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
//                 </div>
//               </div>
//               {/* Điểm đến */}
//               <div>
//                 <label className="block text-xs text-gray-500 mb-1 font-medium">Điểm đến</label>
//                 <div className="relative">
//                   <select
//                     value={form.to}
//                     onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
//                     className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50 appearance-none pr-8"
//                   >
//                     {cities.map(c => <option key={c}>{c}</option>)}
//                   </select>
//                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
//                 </div>
//               </div>
//               {/* Ngày đi */}
//               <div>
//                 <label className="block text-xs text-gray-500 mb-1 font-medium">Ngày đi</label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={form.date}
//                     onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
//                     className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50 pr-9"
//                   />
//                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">📅</span>
//                 </div>
//               </div>
//               {/* Loại xe */}
//               <div>
//                 <label className="block text-xs text-gray-500 mb-1 font-medium">Loại xe</label>
//                 <div className="relative">
//                   <select
//                     value={form.vehicleType}
//                     onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
//                     className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50 appearance-none pr-9"
//                   >
//                     {vehicles.map(v => <option key={v}>{v}</option>)}
//                   </select>
//                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🚌</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Sơ đồ ghế */}
//           <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
//             <div className="flex gap-6 justify-center">

//               {/* Tầng 1 */}
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-3">
//                   <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2M3 12h2m14 0h2M5.22 5.22l1.42 1.42m10.72 10.72 1.42 1.42M5.22 18.78l1.42-1.42m10.72-10.72 1.42-1.42" />
//                   </svg>
//                   <span className="text-sm font-bold text-gray-700">Tầng 1</span>
//                   <svg className="w-4 h-4 text-gray-400 ml-1 cursor-pointer hover:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
//                   </svg>
//                 </div>

//                 {/* Col labels */}
//                 <div className="grid grid-cols-3 gap-2 mb-1 px-1">
//                   {colLabels.map(l => (
//                     <div key={l} className="text-center text-[10px] text-gray-400 font-semibold">{l}</div>
//                   ))}
//                 </div>
//                 {floorRows(floor1).map((row, ri) => (
//                   <div key={ri} className="grid grid-cols-3 gap-2 mb-1">
//                     {row.map(seat => (
//                       <SeatIcon
//                         key={seat.id}
//                         status={seat.status}
//                         label={seat.label}
//                         onClick={() => toggleSeat(seat.id)}
//                       />
//                     ))}
//                   </div>
//                 ))}
//               </div>

//               {/* Divider */}
//               <div className="w-px bg-gray-100 mx-2"></div>

//               {/* Tầng 2 */}
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-3">
//                   <span className="text-sm font-bold text-gray-700">Tầng 2</span>
//                 </div>

//                 {/* Col labels */}
//                 <div className="grid grid-cols-3 gap-2 mb-1 px-1">
//                   {colLabels.map(l => (
//                     <div key={l} className="text-center text-[10px] text-gray-400 font-semibold">{l}</div>
//                   ))}
//                 </div>
//                 {floorRows(floor2).map((row, ri) => (
//                   <div key={ri} className="grid grid-cols-3 gap-2 mb-1">
//                     {row.map(seat => (
//                       <SeatIcon
//                         key={seat.id}
//                         status={seat.status}
//                         label={seat.label}
//                         onClick={() => toggleSeat(seat.id)}
//                       />
//                     ))}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Legend */}
//             <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100 justify-center">
//               {[
//                 { detail: "border-gray-400 bg-gray-300", frame: "border-gray-400 bg-gray-200", leg: "bg-gray-400", label: "Đã bán" },
//                 { detail: "border-green-500 bg-green-200", frame: "border-green-500 bg-green-100", leg: "bg-green-500", label: "Trống" },
//                 { detail: "border-orange-500 bg-orange-300", frame: "border-orange-500 bg-orange-100", leg: "bg-orange-500", label: "Đang chọn" },
//               ].map(({ detail, frame, leg, label }) => (
//                 <div key={label} className="flex items-center gap-2">
//                   <div className="relative h-[22px] w-[36px] overflow-visible flex-shrink-0">
//                     <span className={`pointer-events-none absolute left-[7px] top-[1px] h-[7px] w-[20px] rounded-t-[4px] border-[2px] border-b-0 ${detail}`} />
//                     <span className={`pointer-events-none absolute left-[3px] top-[6px] h-[10px] w-[29px] rounded-[3px] border-[2px] ${frame}`} />
//                     <span className={`pointer-events-none absolute left-[10px] top-[16px] h-[4px] w-[1.5px] rounded-b-[1px] ${leg}`} />
//                     <span className={`pointer-events-none absolute right-[10px] top-[16px] h-[4px] w-[1.5px] rounded-b-[1px] ${leg}`} />
//                   </div>
//                   <span className="text-xs text-gray-600 font-medium">{label}</span>
//                 </div>
//               ))}
//             </div>

//             {/* Selected seats info */}
//             {selectedSeats.length > 0 && (
//               <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 flex items-center justify-between">
//                 <span className="text-sm text-orange-700 font-semibold">
//                   Đã chọn: {selectedSeats.map(s => s.label).join(", ")}
//                 </span>
//                 <span className="text-xs text-orange-500">{selectedSeats.length} ghế</span>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── Right Column — Thanh toán ─────────────────────────────────── */}
//         <div className="w-full lg:w-72 flex-shrink-0">
//           <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 sticky top-6">
//             <h2 className="text-sm font-bold text-gray-700">Thanh toán & xuất vé</h2>

//             {/* Payment methods */}
//             <div className="grid grid-cols-2 gap-2">
//               <PayBtn
//                 icon={<span>💵</span>}
//                 label="Tiền mặt"
//                 selected={payment === "cash"}
//                 onClick={() => setPayment("cash")}
//               />
//               <PayBtn
//                 icon={
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <rect x="1" y="4" width="22" height="16" rx="2" strokeWidth={2} />
//                     <path strokeLinecap="round" strokeWidth={2} d="M1 10h22" />
//                   </svg>
//                 }
//                 label="Thẻ/Pos"
//                 selected={payment === "card"}
//                 onClick={() => setPayment("card")}
//               />
//               <PayBtn
//                 icon={
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <rect x="3" y="3" width="7" height="7" strokeWidth={2} /><rect x="14" y="3" width="7" height="7" strokeWidth={2} />
//                     <rect x="3" y="14" width="7" height="7" strokeWidth={2} /><rect x="14" y="14" width="3" height="3" strokeWidth={2} />
//                     <rect x="18" y="18" width="3" height="3" strokeWidth={2} /><rect x="14" y="18" width="3" height="1" strokeWidth={2} />
//                   </svg>
//                 }
//                 label="Mã QR"
//                 selected={payment === "qr"}
//                 onClick={() => setPayment("qr")}
//               />
//               <PayBtn
//                 icon={
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <rect x="1" y="4" width="22" height="16" rx="2" strokeWidth={2} />
//                     <text x="4" y="16" fontSize="7" fill="#1a56db" fontWeight="bold" stroke="none">VISA</text>
//                   </svg>
//                 }
//                 label="Visa"
//                 selected={payment === "visa"}
//                 onClick={() => setPayment("visa")}
//               />
//             </div>

//             {/* Promo code */}
//             <div className="relative">
//               <input
//                 type="text"
//                 value={promoCode}
//                 onChange={e => setPromoCode(e.target.value)}
//                 placeholder="Mã giảm giá"
//                 className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50 pr-10"
//               />
//               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🏷️</span>
//             </div>

//             {/* Print after confirm toggle */}
//             <div className="flex items-center justify-between py-2 border-t border-gray-100">
//               <span className="text-sm text-gray-600 font-medium">In vé sau khi xác nhận</span>
//               <button
//                 onClick={() => setPrintAfter(p => !p)}
//                 className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${printAfter ? "bg-orange-400" : "bg-gray-200"}`}
//               >
//                 <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${printAfter ? "left-5" : "left-0.5"}`}></span>
//               </button>
//             </div>

//             {/* Divider */}
//             <div className="border-t border-gray-100"></div>

//             {/* Total */}
//             <div className="flex items-center justify-between">
//               <span className="text-sm font-semibold text-gray-700">Tổng cộng :</span>
//               <span className="text-lg font-extrabold text-orange-500">
//                 {total > 0 ? `${total.toLocaleString("vi-VN")} VND` : "0 VND"}
//               </span>
//             </div>

//             {/* Confirm button */}
//             <button
//               className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200
//                 ${selectedSeats.length > 0
//                   ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:shadow-lg hover:scale-[1.02]"
//                   : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                 }`}
//               disabled={selectedSeats.length === 0}
//             >
//               Xác nhận đặt vé
//             </button>

//             {selectedSeats.length === 0 && (
//               <p className="text-xs text-gray-400 text-center">Vui lòng chọn ít nhất 1 ghế</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }