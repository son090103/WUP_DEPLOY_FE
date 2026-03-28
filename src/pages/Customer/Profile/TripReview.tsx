import { useState, useEffect } from "react";
import { Star, Loader2, RefreshCw, MapPin, Bus, MessageSquare, X, CircleCheck, TriangleAlert } from "lucide-react";
import baseApiAuth from "../../../api/auth";
import type { getTripFinished } from "../../../model/getTripFinishedHistory";
import type { reviewForm } from "../../../model/reviewForm";

interface NoticeState {
  type: "success" | "error";
  title: string;
  message: string;
}

const formatTime = (d?: string | null) => {
  if (!d) return "--:--";
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (d?: string | null) => {
  if (!d) return "--/--/----";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

/* ================= STAR RATING ================= */
function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-slate-500 w-20">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={22}
              className={`transition-colors ${star <= (hover || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-slate-300"
                }`}
            />
          </button>
        ))}
      </div>
      {value > 0 && <span className="text-xs font-bold text-yellow-600">{value}/5</span>}
    </div>
  );
}

/* ================= COMPONENT ================= */
export default function TripReview() {
  const [loading, setLoading] = useState(false);
  const [TripFinishedHistory, setTripFinishedHistory] = useState<getTripFinished[]>([]);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<getTripFinished | null>(null,);
  const [reviewForm, setReviewForm] = useState<reviewForm>({
    booking_id: "",
    trip_id: "",
    rating: 0,
    comment: "",
    driver_rating: 0,
    assistant_rating: 0,
    bus_rating: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Hàm use effect lấy lịch sử trip đã kết thúc để đánh giá
  useEffect(() => {
    getTripFinishedHistory();
  }, []);

  // Hàm api lấy lịch sử trip đã kết thúc để đánh giá
  const getTripFinishedHistory = async () => {
    try {
      const res = await baseApiAuth.get(
        "/api/customer/check/getTripFinishedHistory",
      );
      console.log("data", res.data)
      setTripFinishedHistory(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Mở review
  const openReview = (order: getTripFinished) => {
    setReviewingOrder(order);
    console.log("order", order);
    setReviewForm({
      booking_id: order._id,
      trip_id: order.trip_id,
      rating: 0,
      comment: "",
      driver_rating: 0,
      assistant_rating: 0,
      bus_rating: 0,
    });
    setSubmitResult(null);
  };

  // Đóng review
  const closeReview = () => {
    setReviewingOrder(null);
    setSubmitResult(null);
  };

  // Hàm review trip
  const reviewTrip = async () => {
    try {
      console.log("data gửi", reviewForm);
      const res = await baseApiAuth.post("/api/customer/check/reviewTrip",
        reviewForm,
      );
      closeReview();
      getTripFinishedHistory();
      setNotice({ type: "success", title: "Thành công", message: "Gửi đánh giá thành công" });
    } catch (error: any) {
      setNotice({ type: "error", title: "Thất bại", message: error.response?.data?.message || "Gửi đánh giá thất bại" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              Đánh giá trải nghiệm các chuyến đi của bạn
            </h1>
            {!loading && TripFinishedHistory.length > 0 && (
              <p className="text-sm text-slate-500 mt-0.5">
                {TripFinishedHistory.length} Chuyến đã hoàn thành
              </p>
            )}
          </div>
          <button
            onClick={() => getTripFinishedHistory()}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={36} className="animate-spin text-orange-500" />
            <p className="text-slate-500 font-medium">Đang tải danh sách ...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && TripFinishedHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Bus size={48} className="text-slate-300" />
            <p className="text-slate-500 font-semibold text-lg">
              Bạn chưa có chuyến đi nào hoàn thành
            </p>
          </div>
        )}

        {/* Order list */}
        {!loading && TripFinishedHistory.length > 0 && (
          <div className="space-y-4">
            {TripFinishedHistory.map((item) => {
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-orange-100/60"
                >
                  <div className="h-1 w-full bg-green-400" />

                  <div className="p-6">
                    {/* Trip route */}
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <div className="text-center min-w-[56px]">
                        <div className="text-xl font-black text-slate-800">
                          {item.from}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5 max-w-[80px]">
                          {formatDate(item.departure_time)}
                        </div>
                      </div>

                      <div className="flex flex-col items-center flex-1 min-w-[80px]">
                        <div className="flex items-center w-full gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                          <div className="flex-1 h-0.5 bg-gradient-to-r from-green-500 to-orange-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {formatDate(item.departure_time)}
                        </div>
                      </div>

                      <div className="text-center min-w-[56px]">
                        <div className="text-xl font-black text-slate-800">
                          {item.to}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5 max-w-[80px]">
                          {formatDate(item.arrival_time)}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                          {item.status === "FINISHED"
                            ? "Hoàn Thành"
                            : item.status}
                        </span>
                      </div>
                    </div>

                    {/* Pickup / Dropoff */}
                    <div className="flex gap-3 mb-4 bg-slate-50 rounded-xl p-3">
                      <div className="flex-1 flex gap-2 items-start">
                        <div className="mt-1 flex-shrink-0">
                          <MapPin size={13} className="text-green-500" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-green-600 uppercase tracking-wide">
                            Điểm đón
                          </div>
                          <div className="text-xs font-semibold text-slate-700 mt-0.5">
                            {item.pickup_point}
                          </div>
                        </div>
                      </div>
                      <div className="w-px bg-slate-200 self-stretch mx-1" />
                      <div className="flex-1 flex gap-2 items-start">
                        <div className="mt-1 flex-shrink-0">
                          <MapPin size={13} className="text-orange-500" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">
                            Điểm trả
                          </div>
                          <div className="text-xs font-semibold text-slate-700 mt-0.5">
                            {item.dropoff_point}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detail + Review button */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-sm">
                        {item.seat_labels.length > 0 && (
                          <div className="flex gap-1">
                            {item.seat_labels.map((s) => (
                              <span
                                key={s}
                                className="bg-orange-100 text-orange-700 text-[11px] font-black px-2 py-0.5 rounded-md"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.bus_name && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Bus size={13} className="text-slate-400" />
                            <span className="text-xs font-semibold">
                              {item.bus_name}
                            </span>
                          </div>
                        )}
                        <span className="font-black text-orange-600">
                          {item.total_price.toLocaleString("vi-VN")}d
                        </span>
                      </div>

                      <button
                        onClick={() => openReview(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl text-sm font-bold hover:from-yellow-500 hover:to-orange-500 transition-all shadow-md shadow-orange-200/50"
                      >
                        <MessageSquare size={14} />
                        Đánh giá{" "}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= REVIEW MODAL ================= */}
      {reviewingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeReview}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-yellow-50">
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Đánh giá trải nghiệm các chuyến đi của bạn
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {reviewingOrder.pickup_point || reviewingOrder.from || "---"}
                  {" -> "}
                  {reviewingOrder.dropoff_point || reviewingOrder.to || "---"}
                  {" | "}
                  {formatDate(reviewingOrder.departure_time)}
                </p>
              </div>
              <button
                onClick={closeReview}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <StarRating
                label="Tổng thể"
                value={reviewForm.rating}
                onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))}
              />
              <StarRating
                label="Tài xế"
                value={reviewForm.driver_rating}
                onChange={(v) =>
                  setReviewForm((f) => ({ ...f, driver_rating: v }))
                }
              />
              <StarRating
                label="Phụ xe"
                value={reviewForm.assistant_rating}
                onChange={(v) =>
                  setReviewForm((f) => ({ ...f, assistant_rating: v }))
                }
              />
              <StarRating
                label="Xe"
                value={reviewForm.bus_rating}
                onChange={(v) =>
                  setReviewForm((f) => ({ ...f, bus_rating: v }))
                }
              />

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Nhận xét
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, comment: e.target.value }))
                  }
                  placeholder="Chia se trai nghiem cua ban..."
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition resize-none"
                />
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {reviewForm.comment.length}/1000
                </div>
              </div>

              {/* Submit result */}
              {submitResult && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${submitResult.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                  {submitResult.message}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={closeReview}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={reviewTrip}
                disabled={submitting || reviewForm.rating === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin inline mr-1" />
                ) : (
                  <Star size={14} className="inline mr-1" />
                )}
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}
      {notice ? (
        <>
          <style>{`
          @keyframes routeNoticeIn {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(0.95);
            }
            70% {
              transform: translateY(-2px) scale(1.02);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes routeNoticeIcon {
            0% {
              transform: scale(0.4) rotate(-25deg);
              opacity: 0;
            }
            55% {
              transform: scale(1.18) rotate(8deg);
              opacity: 1;
            }
            80% {
              transform: scale(0.95) rotate(-4deg);
            }
            100% {
              transform: scale(1) rotate(0);
            }
          }

          @keyframes routeNoticePulse {
            0% {
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.32);
            }
            100% {
              box-shadow: 0 0 0 16px rgba(16, 185, 129, 0);
            }
          }
        `}</style>
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/35 px-4"
            onClick={() => setNotice(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.7)]"
              onClick={(event) => event.stopPropagation()}
              style={{
                animation:
                  notice.type === "success"
                    ? "routeNoticeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)"
                    : "routeNoticeIn 0.35s ease",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full ${notice.type === "success"
                    ? "bg-[#ecfdf3] text-[#16a34a]"
                    : "bg-[#fff7ed] text-[#ea580c]"
                    }`}
                  style={{
                    animation:
                      notice.type === "success"
                        ? "routeNoticePulse 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                        : undefined,
                  }}
                >
                  {notice.type === "success" ? (
                    <CircleCheck
                      size={20}
                      style={{
                        animation:
                          notice.type === "success"
                            ? "routeNoticeIcon 0.55s cubic-bezier(0.22, 1, 0.36, 1)"
                            : undefined,
                      }}
                    />
                  ) : (
                    <TriangleAlert size={20} />
                  )}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-black text-[#111827]">
                    {notice.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#4b5563]">
                    {notice.message}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="rounded-lg bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-4 py-2 text-sm font-bold text-white transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
