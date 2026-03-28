import { useState, useEffect, type FormEvent } from "react";
import { ChevronLeft, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import baseAPIAuth from "../../api/auth";
import type { AllRoutes } from "../../model/getRoutes";
import type { getBuses } from "../../model/getBuses";
import type { getDrivers } from "../../model/getAvailableDriver";
import type { getAssistants } from "../../model/getAvailableAssistant";

type DriverStatus = "PENDING" | "RUNNING" | "DONE";

interface DriverForm {
  id: number;
  driver_id: string;
  shift_start: string;
  shift_end: string;
  status: DriverStatus;
  suggestions: getDrivers[];
}

export default function CreateTrip() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<AllRoutes[]>([]);
  const [buses, setBuses] = useState<getBuses[]>([]);
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
const [assistantId, setAssistantId] = useState("");

  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  // đơn vị: giờ (float, ví dụ 3.706)
  const [scheduledDuration, setScheduledDuration] = useState<number | "">("");
  const [availableDrivers, setAvailableDrivers] = useState<getDrivers[]>([]);
  const [availableAssistants, setAvailableAssistants] = useState<getAssistants[]>([]);
  const [drivers, setDrivers] = useState<DriverForm[]>([
    {
      id: 1,
      driver_id: "",
      shift_start: "",
      shift_end: "",
      status: "PENDING",
      suggestions: [],
    },
  ]);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Use Effect lấy tất cả routes
  useEffect(() => {
    getAllRoutes();
  }, []);

  // Use Effect lấy tất cả buses availble
  useEffect(() => {
    if (departureTime && scheduledDuration && routeId) {
      getAllBuses();
    }
  }, [departureTime, scheduledDuration, routeId]);

  //Hàm lấy tài xế availble
  useEffect(() => {
    if (departureTime && scheduledDuration && routeId) {
      getAvailableDrivers();
    }
  }, [departureTime, scheduledDuration, routeId]);
  
    //Hàm lấy lơ xe availble
  useEffect(() => {
    if (departureTime && scheduledDuration && routeId) {
      getAvailableAssistant();
    }
  }, [departureTime, scheduledDuration, routeId]);

  const getNow = () => {
  return formatLocalDateTime(new Date());
};
  //format time
  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  // Hàm tính thời gian kết thúc từ giờ khởi hành + duration (giờ)
  useEffect(() => {
    if (departureTime && typeof scheduledDuration === "number") {
      const departure = new Date(departureTime);
      const arrival = new Date(
        departure.getTime() + scheduledDuration * 3600000,
      );
      setArrivalTime(formatLocalDateTime(arrival));
    }
  }, [departureTime, scheduledDuration]);

  // Helper tính shiftEnd từ giờ (dùng chung cho search)
  const calcShiftEnd = (): string | null => {
    if (arrivalTime) return arrivalTime;
    if (
      scheduledDuration &&
      typeof scheduledDuration === "number" &&
      departureTime
    ) {
      const departure = new Date(departureTime);
      const arrival = new Date(
        departure.getTime() + scheduledDuration * 3600000,
      );
      return formatLocalDateTime(arrival);
    }
    return null;
  };
  // Hàm format hiển thị id tài xế
  const getDriverCode = (id: string) => {
    return "D" + id.slice(0, 3); // 3 ký tự đầu trong id
  };
  //Hàm đổi màu
const getDriverStatusIcon = (status: string) => {
  if (status === "GREEN") return "🟢";
  if (status === "YELLOW") return "⚠️ Lưu ý thời gian giữa các chuyến";
  return "";
};
  // Hàm format hiển thị id xe
  const getBusCode = (id: string) => {
    return "D" + id.slice(0, 3); // 3 ký tự đầu trong id
  };
  //Hàm đổi màu 
const getBusStatusIcon = (status: string) => {
  if (status === "GREEN") return "🟢";
  if (status === "YELLOW") return "⚠️ Lưu ý thời gian giữa các chuyến";
  return "";
};
 // Hàm format hiển thị id lơ xe
  const getAssistantCode = (id: string) => {
    return "D" + id.slice(0, 3); // 3 ký tự đầu trong id
  };
  //Hàm đổi màu
const getAssistantStatusIcon = (status: string) => {
  if (status === "GREEN") return "🟢";
  if (status === "YELLOW") return "⚠️ Lưu ý thời gian giữa các chuyến";
  return "";
};
  // Hàm get Tài xế đang rảnh ca
  const getAvailableDrivers = async () => {
    if (!departureTime) return;
    const shiftEnd = calcShiftEnd();
    
    if (!shiftEnd) return;
    const selectedRoute = routes.find((r) => r._id === routeId);
    if (!selectedRoute) return;
    try {
      const res = await baseAPIAuth.get(
        "/api/admin/check/getAvailableDrivers",
        {
          params: {
            shift_start: new Date(departureTime).toISOString(),
            shift_end: new Date(shiftEnd).toISOString(),
            start_stop_id: selectedRoute.start_id._id,
            travel_duration: scheduledDuration,
          },
        },
      );
      console.log("Các tài xế đang rảnh: ", res.data);
      setAvailableDrivers(res.data);
      
    } catch (error) {
      console.error(error);
    }
  };

// Hàm get Lơ xe đang rảnh ca
  const getAvailableAssistant = async () => {
    if (!departureTime) return;
    const shiftEnd = calcShiftEnd();
    
    if (!shiftEnd) return;
    const selectedRoute = routes.find((r) => r._id === routeId);
    if (!selectedRoute) return;
    try {
      const res = await baseAPIAuth.get(
        "/api/admin/check/getAvailableAssistant",
        {
          params: {
            shift_start: new Date(departureTime).toISOString(),
            shift_end: new Date(shiftEnd).toISOString(),
            start_stop_id: selectedRoute.start_id._id,
            travel_duration: scheduledDuration,
          },
        },
      );
      console.log("Các lơ đang rảnh: ", res.data);
      setAvailableAssistants(res.data);
      
    } catch (error) {
      console.error(error);
    }
  };

    // Hàm lấy tất cả các buses đang rảnh 
  const getAllBuses = async () => {
        if (!departureTime) return;
    const shiftEnd = calcShiftEnd();
    if (!shiftEnd) return;
    const selectedRoute = routes.find((r) => r._id === routeId);
    if (!selectedRoute) return;
    try {
          const res = await baseAPIAuth.get(
        "/api/admin/check/getBuses",
        {
          params: {
            shift_start: new Date(departureTime).toISOString(),
            shift_end: new Date(shiftEnd).toISOString(),
            start_stop_id: selectedRoute.start_id._id,
            travel_duration: scheduledDuration,
          },
        },
      );
      console.log("Các tài xế đang rảnh: ", res.data);
      setBuses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Hàm lấy tất cả các routes
  const getAllRoutes = async () => {
    try {
      const res = await baseAPIAuth.get("/api/admin/check/getRoutes");
      setRoutes(res.data);
    } catch (error) {
      console.error(error);
    }
  };


  // Hàm lất
  const handleRouteChange = (selectedRouteId: string) => {
    setRouteId(selectedRouteId);
    if (selectedRouteId) {
      const selectedRoute = routes.find(
        (route) => route._id === selectedRouteId,
      );
      if (selectedRoute && selectedRoute.estimated_duration) {
        // estimated_duration từ backend là giờ (float)
        setScheduledDuration(selectedRoute.estimated_duration);
      }
    } else {
      setScheduledDuration("");
    }
  };

  const handleDepartureTimeChange = (newDepartureTime: string) => {
    setDepartureTime(newDepartureTime);
  };

  const handleAddDriver = () => {
    setDrivers((prev) => [
      ...prev,
      {
        id: Date.now(),
        driver_id: "",
        shift_start: "",
        shift_end: "",
        status: "PENDING",
        keyword: "",
        suggestions: [],
      },
    ]);
  };

  const handleRemoveDriver = (id: number) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDriver = <K extends keyof DriverForm>(
    id: number,
    key: K,
    value: DriverForm[K],
  ) => {
    setDrivers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!routeId || !busId || !departureTime || !arrivalTime) {
      setFormError(
        "Vui lòng nhập đầy đủ route, bus và thời gian khởi hành/kết thúc.",
      );
      return;
    }

    const validDrivers = drivers.filter(
      (d) => d.driver_id.trim() && d.shift_start && d.shift_end,
    );

    if (validDrivers.length === 0) {
      setFormError("Vui lòng nhập ít nhất một tài xế hợp lệ.");
      return;
    }

    const payload = {
      route_id: routeId,
      bus_id: busId,
      assistant_id: assistantId || undefined,
      departure_time: new Date(departureTime),
      arrival_time: new Date(arrivalTime),
      // lưu đúng đơn vị giờ (float) như backend trả về
      scheduled_duration:
        typeof scheduledDuration === "number" ? scheduledDuration : undefined,
      status: "SCHEDULED",
      drivers: validDrivers.map((d) => ({
        driver_id: d.driver_id.trim(),
        shift_start: new Date(d.shift_start),
        shift_end: new Date(d.shift_end),
        status: d.status,
      })),
    };

    try {
      await baseAPIAuth.post("/api/admin/check/trips", payload);
      setFormSuccess("Tạo chuyến đi thành công.");
      setFormError("");
      setRouteId("");
      setBusId("");
       setAssistantId("");
      setDepartureTime("");
      setArrivalTime("");
      setScheduledDuration("");
      setDrivers([
        {
          id: 1,
          driver_id: "",
          shift_start: "",
          shift_end: "",
          status: "PENDING",
          suggestions: [],
        },
      ]);
      alert(" Tạo chuyến thành công!");
    } catch (err: any) {
      console.error(err);
      setFormError(
        err?.response?.data?.message ??
          err?.message ??
          "Tạo chuyến đi thất bại.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#1f2937]">
      <section className="w-full">
        <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 pb-16 pt-10 lg:px-4">
          {/* HEADER */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]"
              >
                <ChevronLeft size={25} strokeWidth={2.3} />
              </button>
              <div>
                <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">
                  Tạo chuyến đi mới
                </h1>
                <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">
                  Định nghĩa chuyến đi theo tuyến, xe, tài xế và thời gian dự
                  kiến.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/bulk-create-trips")}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#f59e0b] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#d97706]"
            >
              <Plus size={18} />
              Tạo hàng loạt
            </button>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-[20px] border border-[#e7eaf0] bg-white p-5 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.34)]"
          >
            {/* Thông tin tuyến */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-[#1f2430]">Chọn tuyến</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Tuyến xe
                  </span>
                  <select
                    value={routeId}
                    onChange={(e) => handleRouteChange(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    required
                  >
                    <option value="">-- Chọn tuyến --</option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {route.start_id.name} - {route.stop_id.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Thời gian dự kiến (giờ)
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min={0.1}
                      step="any"
                      value={scheduledDuration === "" ? "" : scheduledDuration}
                      onChange={(e) =>
                        setScheduledDuration(
                          e.target.value
                            ? Math.max(0.1, Number(e.target.value))
                            : "",
                        )
                      }
                      placeholder="Tự động từ tuyến"
                      className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                      required
                    />
                    {scheduledDuration && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600">
                        ✓ Từ tuyến
                      </span>
                    )}
                  </div>
                </label>
              </div>
            </section>

            {/* Thời gian */}
            <section className="space-y-4 border-t border-[#e5e7eb] pt-4">
              <h2 className="text-lg font-black text-[#1f2430]">
                Thời gian chuyến đi
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Thời gian khởi hành
                  </span>
                  <input
                    type="datetime-local"
                    min={getNow()}
                    value={departureTime}
                    onChange={(e) => handleDepartureTimeChange(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Thời gian kết thúc
                    <span className="ml-1 text-[10px] font-normal lowercase text-[#9ca3af]">
                      (tự động)
                    </span>
                  </span>
                  <input
                    type="datetime-local"
                    value={arrivalTime}
                     min={departureTime || getNow()}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#e8f4f8] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    required
                  />
                </label>
              </div>
            </section>

            {/* Thông tin chung */}
            <section className="space-y-4 border-t border-[#e5e7eb] pt-4">
              <h2 className="text-lg font-black text-[#1f2430]">
                Thông tin xe và phụ xe
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {/* DROPDOWN XE */}
                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Chọn Xe
                  </span>
                  <select
                    value={busId}
                    onChange={(e) => setBusId(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    required
                  >
                    <option value="">-- Chọn xe --</option>
                    {buses.map((bus) => (
                          <option key={bus._id} value={bus._id}>
                              [{getBusCode(bus._id)}] - {bus.bus_type_id.name} - [{bus.license_plate}] - {getBusStatusIcon(bus.status)}
                              </option>
                    ))}
                  </select>
                </label>

              <label className="space-y-1">
  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
    Phụ xe (tùy chọn)
  </span>
  <select
    value={assistantId}           // ✅ state riêng cho assistant
    onChange={(e) => setAssistantId(e.target.value)}
    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
  >
    <option value="">-- Chọn phụ xe --</option>
    {availableAssistants.map((a) => (
      <option key={a._id} value={a._id}>
      [{getAssistantCode(a._id)}] - {a.name} - {getAssistantStatusIcon(a.status)}
      </option>
    ))}
  </select>
</label>
              </div>
            </section>

            {/* Tài xế */}
            <section className="space-y-4 border-t border-[#e5e7eb] pt-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-black text-[#1f2430]">
                  Danh sách tài xế
                </h2>
                <button
                  type="button"
                  onClick={handleAddDriver}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[0_14px_28px_-16px_rgba(216,113,28,0.95)] transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31] hover:shadow-[0_16px_30px_-16px_rgba(216,113,28,1)]"
                >
                  <Plus size={14} />
                  Thêm tài xế
                </button>
              </div>

              <div className="space-y-3">
                {drivers.map((d) => (
                  <article
                    key={d.id}
                    className="space-y-3 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[13px] font-semibold text-[#374151]">
                        Tài xế #{d.id}
                      </h3>
                      {drivers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDriver(d.id)}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-semibold text-[#b91c1c] hover:bg-red-50"
                        >
                          <Trash2 size={12} />
                          Xoá
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                          Tài xế
                        </span>
                        <div className="relative">
                          <select
                            value={d.driver_id}
                            onChange={(e) =>
                              handleUpdateDriver(
                                d.id,
                                "driver_id",
                                e.target.value,
                              )
                            }
                            className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151]"
                            required
                          >
                            <option value="">-- Chọn tài xế rảnh --</option>
                            {availableDrivers.map((driver) => (
                              <option key={driver._id} value={driver._id}>
                              [{getDriverCode(driver._id)}] - {driver.name} - {getDriverStatusIcon(driver.status)}
                              </option>
                            ))}
                          </select>

                          {d.suggestions.length > 0 && (
                            <ul className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-white shadow">
                              {d.suggestions.map((driver) => (
                                <li
                                  key={driver._id}
                                  className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                                  onClick={() => {
                                    handleUpdateDriver(
                                      d.id,
                                      "driver_id",
                                      driver._id,
                                    );
                                    handleUpdateDriver(d.id, "suggestions", []);
                                  }}
                                >
                                  {driver.name} - {driver.phone}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </label>

                      <label className="space-y-1">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                          Trạng thái tài xế
                        </span>
                        <div className="relative">
                          <select
                            value={d.status}
                            onChange={(e) =>
                              handleUpdateDriver(
                                d.id,
                                "status",
                                e.target.value as DriverStatus,
                              )
                            }
                            className="h-11 w-full appearance-none rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 pr-9 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="RUNNING">RUNNING</option>
                            <option value="DONE">DONE</option>
                          </select>
                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                          />
                        </div>
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                          Bắt đầu ca lái
                        </span>
                        <input
                          type="datetime-local"
                          value={d.shift_start}
                           min={departureTime || getNow()}
                          onChange={(e) =>
                            handleUpdateDriver(
                              d.id,
                              "shift_start",
                              e.target.value,
                            )
                          }
                          className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                          required
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                          Kết thúc ca lái
                        </span>
                        <input
                          type="datetime-local"
                          value={d.shift_end}
                            min={d.shift_start || departureTime || getNow()} 
                          onChange={(e) =>
                            handleUpdateDriver(
                              d.id,
                              "shift_end",
                              e.target.value,
                            )
                          }
                          className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                          required
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Messages + submit */}
            {formError ? (
              <p className="rounded-[8px] border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {formError}
              </p>
            ) : null}

            {formSuccess ? (
              <p className="rounded-[8px] border border-green-300 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                {formSuccess}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-5 py-3 text-sm font-black uppercase text-white shadow-[0_14px_28px_-16px_rgba(216,113,28,0.95)] transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31] hover:shadow-[0_16px_30px_-16px_rgba(216,113,28,1)]"
            >
              Tạo chuyến đi
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
