import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    ChevronDown,
    ChevronLeft,
    LogIn,
    TriangleAlert,
     CircleCheck,
    Plus,
    Trash2,
} from "lucide-react";
import { GiSteeringWheel } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import baseAPIAuth from "../../api/auth";
import type {
    coach as CoachBase,
    Column,
    ColumnName,
    ColumnOverride,
    CreateBusRequest,
    RowOverride,
    SeatLayout,
} from "../../model/coach";
import type { BusType } from "../../model/coachType";
import type { allStops } from "../../model/allStops";

interface ColumnFormColumn {
    enabled: boolean;
    seatsPerRow: number;
}

interface ColumnFormState {
    LEFT: ColumnFormColumn;
    MIDDLE: ColumnFormColumn;
    RIGHT: ColumnFormColumn;
}

interface RowOverrideForm {
    id: number;
    rowIndex: number;
    floor: 1 | 2;
    left: string;
    middle: string;
    right: string;
}

interface SeatCell {
    id: string;
    seatNumber: number;
    seatCode: string;
    floor: number;
    rowIndex: number;
    column: ColumnName;
}

interface RowLayout {
    rowIndex: number;
    seatsByColumn: Partial<Record<ColumnName, SeatCell[]>>;
}

interface FloorLayout {
    floor: number;
    rows: RowLayout[];
}

interface NoticeState {
  type: "success" | "error";
  title: string;
  message: string;
}

const COLUMN_ORDER: ColumnName[] = ["LEFT", "MIDDLE", "RIGHT"];

const COLUMN_LABEL: Record<ColumnName, string> = {
    LEFT: "Trái",
    MIDDLE: "Giữa",
    RIGHT: "Phải",
};

const OVERRIDE_KEY_BY_COLUMN: Record<ColumnName, "left" | "middle" | "right"> =
{
    LEFT: "left",
    MIDDLE: "middle",
    RIGHT: "right",
};

// Set giá trị default của số cột ghế
const INITIAL_COLUMNS: ColumnFormState = {
    LEFT: { enabled: true, seatsPerRow: 2 },
    MIDDLE: { enabled: false, seatsPerRow: 1 },
    RIGHT: { enabled: true, seatsPerRow: 2 },
};
// Set giá trị default cho sidebar trnag admin


const ADMIN_LAYOUT_TUNE = {
    sidebarAndContentCols: "lg:grid-cols-[300px_minmax(0,1fr)]",
    sidebarAndContentGap: "gap-4",
    rightContentMaxWidth: "max-w-[1380px]",
    rightContentDesktopPadding: "lg:px-4",
};

function clampNumber(value: number, min: number, max?: number) {
    if (Number.isNaN(value)) {
        return min;
    }

    if (typeof max === "number") {
        return Math.min(Math.max(value, min), max);
    }

    return Math.max(value, min);
}

function parseOptionalSeatCount(value: string): number | null {
    if (!value.trim()) {
        return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        return null;
    }

    return Math.max(0, parsed);
}

function getSeatVisualStyles(state: "EMPTY" | "SELECTED" | "SOLD"): {
    frame: string;
    detail: string;
    label: string;
    leg: string;
} {
    if (state === "SELECTED") {
        return {
            frame: "border-[#ea5b2a] bg-[#fff6f1]",
            detail: "border-[#ea5b2a] bg-[#fffaf7]",
            label: "text-[#d84e1f]",
            leg: "bg-[#ea5b2a]",
        };
    }

    if (state === "SOLD") {
        return {
            frame: "border-[#a5acb8] bg-[#f4f5f7]",
            detail: "border-[#a5acb8] bg-[#f8f9fb]",
            label: "text-[#868e9b]",
            leg: "bg-[#a5acb8]",
        };
    }

    return {
        frame: "border-[#1e8f2a] bg-white",
        detail: "border-[#1e8f2a] bg-white",
        label: "text-[#1e8f2a]",
        leg: "bg-[#1e8f2a]",
    };
}

export default function CreateCoach() {
    const navigate = useNavigate();
    // Thông tin xe, cầu hình ghế ngồi xe
    const [licensePlate, setLicensePlate] = useState("");
    const [busTypes, setBusTypes] = useState<BusType[]>([]);
    const [busTypeId, setBusTypeId] = useState("");
    const [templateName, setTemplateName] = useState("");
    const [floors, setFloors] = useState<RowOverrideForm["floor"]>(2);
    const [rows, setRows] = useState(9);
    const [columns, setColumns] = useState<ColumnFormState>(INITIAL_COLUMNS);
    const [rowOverrides, setRowOverrides] = useState<RowOverrideForm[]>([]);
    const [stop, setStop] = useState<allStops[]>([]);
    const [stopId, setStopId] = useState("");
    const [notice, setNotice] = useState<NoticeState | null>(null);

    // Validate, preview, chỉ UI
    const [previewFloor, setPreviewFloor] = useState<RowOverrideForm["floor"]>(1);
    const [validationMessage, setValidationMessage] = useState("");
    const [payloadPreview] = useState("");

    // Hàm để filter và map sao cho dữ liệu từ UI map format với interface từ BE
    const activeColumns = useMemo<Column[]>(
        () =>
            COLUMN_ORDER.filter((name) => columns[name].enabled).map((name) => ({
                name: name,
                seats_per_row: clampNumber(columns[name].seatsPerRow, 1),
            })),
        [columns],
    );
    // Xử lí format data hàng đặc biệt để map format với interface từ BE
    const rowOverridePayload = useMemo<RowOverride[]>(() => {
        const deduped = new Map<string, RowOverride>();
        for (const item of rowOverrides) {
            const floorValue = floors === 1 ? 1 : item.floor;
            const rowValue = clampNumber(item.rowIndex, 1, rows);

            const columnOverrides = COLUMN_ORDER.map((columnName) => {
                const key = OVERRIDE_KEY_BY_COLUMN[columnName];
                const seats = parseOptionalSeatCount(item[key]);
                return seats === null
                    ? null
                    : {
                        column_name: columnName,
                        seats,
                    };
            }).filter((override): override is ColumnOverride => override !== null);
            if (columnOverrides.length === 0) {
                continue;
            }
            const payloadItem: RowOverride = {
                row_index: rowValue,
                floor: floorValue,
                column_overrides: columnOverrides,
            };
            deduped.set(`${floorValue}-${rowValue}`, payloadItem);
        }
        return Array.from(deduped.values()).sort(
            (a, b) => a.floor - b.floor || a.row_index - b.row_index,
        );
    }, [floors, rowOverrides, rows]);

    // Hàm
    const { floorLayouts, totalSeats } = useMemo(() => {
        const overrideMap = new Map<string, RowOverride>();
        for (const item of rowOverridePayload) {
            overrideMap.set(`${item.floor}-${item.row_index}`, item);
        }

        const layouts: FloorLayout[] = [];
        let seatNumber = 1;

        for (let floor = 1; floor <= floors; floor += 1) {
            const floorRows: RowLayout[] = [];
            let floorSeatNumber = 1;

            for (let rowIndex = 1; rowIndex <= rows; rowIndex += 1) {
                const columnSeatCounts: Partial<Record<ColumnName, number>> = {};

                for (const column of activeColumns) {
                    columnSeatCounts[column.name] = column.seats_per_row;
                }

                const override = overrideMap.get(`${floor}-${rowIndex}`);
                if (override) {
                    for (const columnOverride of override.column_overrides) {
                        if (columnSeatCounts[columnOverride.column_name] !== undefined) {
                            columnSeatCounts[columnOverride.column_name] =
                                columnOverride.seats;
                        }
                    }
                }

                const seatsByColumn: Partial<Record<ColumnName, SeatCell[]>> = {};
                for (const columnName of COLUMN_ORDER) {
                    const seatCount = columnSeatCounts[columnName];
                    if (seatCount === undefined || seatCount <= 0) {
                        continue;
                    }
                    const columnSeats: SeatCell[] = [];
                    for (let seatOrder = 1; seatOrder <= seatCount; seatOrder += 1) {
                        const id = `F${floor}-R${rowIndex}-${columnName}-${seatOrder}`;
                        const seat: SeatCell = {
                            id,
                            seatNumber,
                            seatCode: `${floor === 1 ? "A" : "B"}${floorSeatNumber}`,
                            floor,
                            rowIndex,
                            column: columnName,
                        };
                        columnSeats.push(seat);
                        seatNumber += 1;
                        floorSeatNumber += 1;
                    }
                    seatsByColumn[columnName] = columnSeats;
                }
                floorRows.push({ rowIndex, seatsByColumn });
            }
            layouts.push({ floor, rows: floorRows });
        }
        return {
            floorLayouts: layouts,
            totalSeats: seatNumber - 1,
        };
    }, [activeColumns, floors, rowOverridePayload, rows]);

    const seatGridTemplate = useMemo(
        () => `repeat(${Math.max(activeColumns.length, 1)}, minmax(78px, 1fr))`,
        [activeColumns.length],
    );

    const previewFloorLayout = useMemo(
        () =>
            floorLayouts.find((item) => item.floor === previewFloor) ??
            floorLayouts[0],
        [floorLayouts, previewFloor],
    );

    const normalSeatsPerRow = useMemo(
        () =>
            activeColumns.reduce((total, column) => total + column.seats_per_row, 0),
        [activeColumns],
    );
    const overrideColumnsGridClass =
        activeColumns.length >= 3
            ? "md:grid-cols-3"
            : activeColumns.length === 2
                ? "md:grid-cols-2"
                : "md:grid-cols-1";

    const overrideByFloorRow = useMemo(() => {
        const map = new Map<string, RowOverride>();
        for (const item of rowOverridePayload) {
            map.set(`${item.floor}-${item.row_index}`, item);
        }
        return map;
    }, [rowOverridePayload]);

    const handleToggleOverride = () => {
        setRowOverrides((prev) =>
            prev.length > 0
                ? []
                : [
                    {
                        id: 1,
                        rowIndex: 1,
                        floor: 1,
                        left: "",
                        middle: "",
                        right: "",
                    },
                ],
        );
    };

    const handleUpdateOverride = <K extends keyof RowOverrideForm>(
        id: number,
        key: K,
        value: RowOverrideForm[K],
    ) => {
        setRowOverrides((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
        );
    };

    const handleToggleColumn = (columnName: ColumnName, enabled: boolean) => {
        setColumns((prev) => ({
            ...prev,
            [columnName]: {
                ...prev[columnName],
                enabled,
            },
        }));
    };

    const handleColumnSeatsChange = (
        columnName: ColumnName,
        rawValue: string,
    ) => {
        const parsed = Number.parseInt(rawValue, 10);

        setColumns((prev) => ({
            ...prev,
            [columnName]: {
                ...prev[columnName],
                seatsPerRow: clampNumber(parsed, 1),
            },
        }));
    };

    // Lấy BusType
    useEffect(() => {
        fetchBusType();
    }, []);

    // Lấy Stop
    useEffect(() => {
        fetchStop();
    }, []);

    // Hàm lấy Bus Type 
    const fetchBusType = async () => {
        try {
        const res = await baseAPIAuth.get("/api/admin/check/BusType");
        setBusTypes(res.data);
        console.log("data", res.data);
        } catch (error) {
        console.log(error)
        }
    };

    // Hàm lấy stop
    const fetchStop = async () =>{
        try {
        const res = await baseAPIAuth.get("/api/admin/check/getAllStops")
        setStop(res.data);
        console.log("data",res.data)
        } catch (error) {
        console.log(error)
        }
    }


    // Tạo xe
    const createBus = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!licensePlate.trim() || !busTypeId.trim() || !templateName.trim()) {
            setValidationMessage(
                "Vui long nhap du bien so, loai xe va ten template.",
            );
            return;
        }
        if (activeColumns.length === 0) {
            setValidationMessage("Xe phai co it nhat 1 cot ghe.");
            return;
        }
        const coachBase: CoachBase = {
            license_plate: licensePlate.trim().toUpperCase(),
            bus_type_id: busTypeId.trim(),
            current_stop_id: stopId.trim()
        };
        const seatLayout: SeatLayout = {
            template_name: templateName.trim(),
            floors,
            rows,
            columns: activeColumns,
            row_overrides: rowOverridePayload,
            total_seats: totalSeats,
        };
        const payload: CreateBusRequest = {
            ...coachBase,
            seat_layout: seatLayout,
        };
        console.log(busTypeId);
        try {
            setValidationMessage("");
            const res = await baseAPIAuth.post("/api/admin/check/buses", payload);
            console.log(res.data);
           setNotice({
            type: "success",
            title: "Tạo xe thành công",
            message: res.data?.message || "Thông tin xe đã được lưu.",
            });
        } catch (err: any) {
             setNotice({
            type: "error",
            title: "Tạo xe thất bại",
            message:
            err.response?.data?.message ||
            "Đã có lỗi xảy ra, vui lòng thử lại.",
            });
            if (err instanceof Error) {
                console.error(err.message);
            }
            // nếu là axios error
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const error = err as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                };

                setValidationMessage(
                    error.response?.data?.message || "Tạo xe thất bại"
                );
            } else {
                setValidationMessage("Tạo xe thất bại");
            }
        }
    };

    return (

        <div
            className={`mx-auto w-full ${ADMIN_LAYOUT_TUNE.rightContentMaxWidth} space-y-6 px-4 pb-16 pt-10 ${ADMIN_LAYOUT_TUNE.rightContentDesktopPadding}`}
        >
            <div className="mb-6 flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] !bg-white text-[#c2c8d2] transition duration-200 hover:!bg-white active:!bg-white hover:text-[#9aa3b1]"
                    aria-label="Quay lai"
                >
                    <ChevronLeft size={25} strokeWidth={2.3} />
                </button>
                <div>
                    <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">
                        Thêm thông tin xe mới
                    </h1>
                    <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">
                        Định danh và tạo trạng thái vận hành của xe
                    </p>
                </div>
            </div>

            <div className="pt-4 grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-stretch">
                <form
                    onSubmit={createBus}
                    className="h-full space-y-5 rounded-[20px] border border-[#e7eaf0] bg-white p-5 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.34)]"
                >
                    <section className="space-y-3">
                        <h2 className="text-lg font-black text-[#1f2430]">
                            Thông tin xe
                        </h2>
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1">
                                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                    Biển số xe
                                </span>
                                <input
                                    type="text"
                                    value={licensePlate}
                                    onChange={(event) =>
                                        setLicensePlate(event.target.value)
                                    }
                                    placeholder="51B-123.45"
                                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                                    required
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                    Loại xe
                                </span>
                                <div className="relative">
                                    <select
                                        value={busTypeId}
                                        onChange={(event) => setBusTypeId(event.target.value)}
                                        className="h-11 w-full appearance-none rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 pr-9 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                                        required
                                    >
                                        <option value="">Chọn loại xe</option>
                                        {busTypes.map((option) => (
                                            <option key={option._id} value={option._id}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                                    />
                                </div>
                            </label>
                        </div>

                        <label className="mt-8 block space-y-1">
                            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                Vị trí của xe
                            </span>
                            <div className="relative">
                                <select
                                value={stopId}
                                onChange={(event) => setStopId(event.target.value)}
                                    className="h-11 w-full appearance-none rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 pr-9 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                                >
                                    <option value="">Chọn vị trí</option>
                                    {stop.map((option) => (
                                            <option key={option._id} value={option._id}>
                                                {option.name}
                                            </option>
                                        ))}
                                </select>
                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                                />
                            </div>
                        </label>
                    </section>

                    <section className="space-y-3 border-t border-[#e5e7eb] pt-4">
                        <h2 className="text-lg font-black text-[#1f2430]">
                            Sơ đồ ghế ngồi
                        </h2>
                        <label className="space-y-1">
                            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                Tên mẫu sơ đồ ghế
                            </span>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(event) => setTemplateName(event.target.value)}
                                placeholder="Giường nằm 40 chỗ"
                                className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                                required
                            />
                        </label>

                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1">
                                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                    Số tầng
                                </span>
                                <div className="relative">
                                    <select
                                        value={floors}
                                        onChange={(event) => {
                                            const nextFloors =
                                                Number(event.target.value) === 1 ? 1 : 2;
                                            setFloors(nextFloors);

                                            if (nextFloors === 1) {
                                                setPreviewFloor(1);
                                                setRowOverrides((prev) =>
                                                    prev.map((item) =>
                                                        item.floor === 1
                                                            ? item
                                                            : { ...item, floor: 1 as const },
                                                    ),
                                                );
                                            } else {
                                                setPreviewFloor((prev) => (prev === 2 ? 2 : 1));
                                            }
                                        }}
                                        className="h-11 w-full appearance-none rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 pr-9 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                                    >
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                                    />
                                </div>
                            </label>

                            <label className="space-y-1">
                                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                    Số hàng ghế
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    value={rows}
                                    onChange={(event) =>
                                        setRows(
                                            clampNumber(
                                                Number.parseInt(event.target.value, 10),
                                                1,
                                            ),
                                        )
                                    }
                                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                                />
                            </label>
                        </div>

                        <div className="space-y-2 border-t border-[#e5e7eb] pt-4">
                            <p className="text-lg font-black text-[#1f2430]">
                                Số cột ghế
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {COLUMN_ORDER.map((columnName) => (
                                    <article key={columnName} className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[#374151]">
                                            <span className="relative inline-flex h-4 w-4 items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={columns[columnName].enabled}
                                                    onChange={(event) =>
                                                        handleToggleColumn(
                                                            columnName,
                                                            event.target.checked,
                                                        )
                                                    }
                                                    className="peer absolute inset-0 m-0 h-4 w-4 cursor-pointer appearance-none rounded-[4px] border border-[#d1d5db] bg-white"
                                                />
                                                <span className="pointer-events-none absolute h-[8px] w-[5px] -translate-y-[1px] rotate-45 border-b-2 border-r-2 border-[#e8791c] opacity-0 peer-checked:opacity-100" />
                                            </span>
                                            {COLUMN_LABEL[columnName]}
                                        </label>

                                        <label className="space-y-1">
                                            <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                                                số ghế / 1 hàng
                                            </span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={columns[columnName].seatsPerRow}
                                                onChange={(event) =>
                                                    handleColumnSeatsChange(
                                                        columnName,
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={!columns[columnName].enabled}
                                                className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#374151] disabled:opacity-100"
                                            />
                                        </label>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 border-t border-[#e5e7eb] pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-lg font-black text-[#1f2430]">
                                Hàng ghế đặc biệt
                            </h2>
                            <button
                                type="button"
                                onClick={handleToggleOverride}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[0_14px_28px_-16px_rgba(216,113,28,0.95)] transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31] hover:shadow-[0_16px_30px_-16px_rgba(216,113,28,1)]"
                            >
                                {rowOverrides.length === 0 ? (
                                    <Plus size={14} />
                                ) : (
                                    <Trash2 size={13} />
                                )}
                                {rowOverrides.length === 0
                                    ? "Thêm hàng đặc biệt"
                                    : "Xóa hàng đặc biệt"}
                            </button>
                        </div>

                        {rowOverrides.length === 0 ? (
                            <p className="rounded-[8px] border border-dashed border-[#d1d5db] bg-[#f9fafb] px-3 py-3 text-sm text-[#6b7280]">
                                Chưa có hàng ghế đặc biệt. Có thể thêm để chỉnh riêng từng
                                hàng/tầng.
                            </p>
                        ) : null}

                        <div className="space-y-3">
                            {rowOverrides.map((item) => (
                                <article
                                    key={item.id}
                                    className="space-y-3 rounded-[10px] bg-white p-3"
                                >
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <label className="space-y-1">
                                            <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
                                                Vị trí hàng ghế
                                            </span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.rowIndex}
                                                onChange={(event) =>
                                                    handleUpdateOverride(
                                                        item.id,
                                                        "rowIndex",
                                                        clampNumber(
                                                            Number.parseInt(event.target.value, 10),
                                                            1,
                                                            rows,
                                                        ),
                                                    )
                                                }
                                                className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none"
                                            />
                                        </label>

                                        <label className="space-y-1">
                                            <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
                                                Tầng
                                            </span>
                                            <div className="relative">
                                                <select
                                                    value={item.floor}
                                                    onChange={(event) =>
                                                        handleUpdateOverride(
                                                            item.id,
                                                            "floor",
                                                            Number(event.target.value) === 1 ? 1 : 2,
                                                        )
                                                    }
                                                    disabled={floors === 1}
                                                    className="h-11 w-full appearance-none rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 pr-9 text-sm font-semibold text-[#374151] outline-none disabled:cursor-not-allowed disabled:bg-[#e5e7eb]"
                                                >
                                                    <option value={1}>Tầng 1</option>
                                                    <option value={2}>Tầng 2</option>
                                                </select>
                                                <ChevronDown
                                                    size={16}
                                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                                                />
                                            </div>
                                        </label>
                                    </div>

                                    <div
                                        className={`grid gap-3 ${overrideColumnsGridClass}`}
                                    >
                                        {activeColumns.map((column) => {
                                            const field = OVERRIDE_KEY_BY_COLUMN[column.name];
                                            return (
                                                <label
                                                    key={`${item.id}-${column.name}`}
                                                    className="space-y-1"
                                                >
                                                    <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
                                                        {COLUMN_LABEL[column.name]}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        placeholder=""
                                                        value={item[field]}
                                                        onChange={(event) =>
                                                            handleUpdateOverride(
                                                                item.id,
                                                                field,
                                                                event.target.value,
                                                            )
                                                        }
                                                        className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none"
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    {validationMessage ? (
                        <p className="rounded-[8px] border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-sm font-semibold text-[#4b5563]">
                            {validationMessage}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_14px_28px_-16px_rgba(216,113,28,0.95)] transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31] hover:shadow-[0_16px_30px_-16px_rgba(216,113,28,1)]"
                    >
                        Thêm mới thông tin xe
                    </button>
                </form>

                <aside className="h-full space-y-4 rounded-[20px] border border-[#e7eaf0] bg-white p-5 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.34)]">
                    <div>
                        <h2 className="text-lg font-black text-[#1f2430]">
                            Sơ đồ ghế tự sinh
                        </h2>
                        <p className="mt-1 text-sm text-[#7c8493]">
                            Sơ đồ ghế này chỉ để minh họa cấu hình chỗ ngồi.
                        </p>
                    </div>

                    <div className="rounded-[14px] border border-[#e7eaf0] bg-white p-3">
                        <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-[10px] border border-[#e3e7ef] bg-white px-3 py-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aa4b2]">
                                    Tầng 1
                                </p>
                                <p className="text-lg font-black text-[#1f2430]">
                                    {floors}
                                </p>
                            </div>
                            <div className="rounded-[10px] border border-[#e3e7ef] bg-white px-3 py-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aa4b2]">
                                    Tổng ghế
                                </p>
                                <p className="text-lg font-black text-[#1f2430]">
                                    {totalSeats}
                                </p>
                            </div>
                        </div>

                        {previewFloorLayout ? (
                            <div className="relative overflow-hidden rounded-[16px] border border-[#d7dde8] bg-white px-2 pb-3 pt-3">
                                <div className="relative mb-3 flex items-center justify-between border-b border-[#e6e9ef] px-1 pb-2">
                                    <div className="inline-flex items-center gap-2 text-[#6f7785]">
                                        <h3 className="text-base font-black leading-none text-[#2b2f36]">
                                            Tầng {previewFloorLayout.floor}
                                        </h3>
                                    </div>
                                    {floors === 2 ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPreviewFloor(previewFloor === 1 ? 2 : 1)
                                            }
                                            className="rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[0_14px_28px_-16px_rgba(216,113,28,0.95)] transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31] hover:shadow-[0_16px_30px_-16px_rgba(216,113,28,1)]"
                                        >
                                            Xem tầng {previewFloor === 1 ? 2 : 1}
                                        </button>
                                    ) : null}
                                </div>

                                {activeColumns.length === 0 ? (
                                    <p className="rounded-[8px] border border-dashed border-[#d1d5db] bg-[#f9fafb] px-2 py-2 text-center text-xs text-[#6b7280]">
                                        Chọn ít nhất một cột để tạo sơ đồ.
                                    </p>
                                ) : (
                                    <div className="relative rounded-[12px] bg-white px-2 pb-3 pt-2">
                                        <div
                                            className="mb-3 grid items-center gap-2"
                                            style={{ gridTemplateColumns: seatGridTemplate }}
                                        >
                                            {activeColumns.map((column) => (
                                                <div
                                                    key={`coach-head-${previewFloorLayout.floor}-${column.name}`}
                                                    className="flex min-h-[36px] items-center justify-center gap-1"
                                                >
                                                    {Array.from(
                                                        {
                                                            length: Math.max(
                                                                previewFloorLayout.rows[0]?.seatsByColumn[
                                                                    column.name
                                                                ]?.length ?? 0,
                                                                1,
                                                            ),
                                                        },
                                                        (_, slotIndex) => {
                                                            const slotCount = Math.max(
                                                                previewFloorLayout.rows[0]?.seatsByColumn[
                                                                    column.name
                                                                ]?.length ?? 0,
                                                                1,
                                                            );
                                                            const isDriverSlot =
                                                                column.name === activeColumns[0]?.name &&
                                                                slotIndex === 0;
                                                            const isDoorSlot =
                                                                column.name ===
                                                                activeColumns[activeColumns.length - 1]
                                                                    ?.name && slotIndex === slotCount - 1;

                                                            return (
                                                                <span
                                                                    key={`${column.name}-head-slot-${slotIndex}`}
                                                                    className="inline-flex h-[36px] w-[62px] items-center justify-center text-[#6e7787]"
                                                                >
                                                                    {isDriverSlot ? (
                                                                        <GiSteeringWheel size={28} />
                                                                    ) : isDoorSlot ? (
                                                                        <LogIn
                                                                            size={28}
                                                                            strokeWidth={1.9}
                                                                            style={{ transform: "scaleX(-1)" }}
                                                                        />
                                                                    ) : null}
                                                                </span>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <span className="pointer-events-none absolute bottom-3 right-3 top-[58px] border-r border-dashed border-[#d5dce8]" />

                                        <div className="space-y-2">
                                            {previewFloorLayout.rows.map((rowLayout) =>
                                                (() => {
                                                    const rowKey = `${previewFloorLayout.floor}-${rowLayout.rowIndex}`;
                                                    const rowOverride =
                                                        overrideByFloorRow.get(rowKey);
                                                    const rowSeatCount = activeColumns.reduce(
                                                        (total, column) =>
                                                            total +
                                                            (rowLayout.seatsByColumn[column.name]
                                                                ?.length ?? 0),
                                                        0,
                                                    );

                                                    const isSpecialMergedRow =
                                                        !!rowOverride &&
                                                        rowSeatCount > normalSeatsPerRow;

                                                    if (isSpecialMergedRow) {
                                                        const splitByColumn: Partial<
                                                            Record<
                                                                ColumnName,
                                                                { base: SeatCell[]; extras: SeatCell[] }
                                                            >
                                                        > = {};

                                                        for (const column of activeColumns) {
                                                            const seats =
                                                                rowLayout.seatsByColumn[column.name] ??
                                                                [];
                                                            const defaultCount = column.seats_per_row;
                                                            const extraCount = Math.max(
                                                                seats.length - defaultCount,
                                                                0,
                                                            );

                                                            if (extraCount === 0) {
                                                                splitByColumn[column.name] = {
                                                                    base: seats,
                                                                    extras: [],
                                                                };
                                                                continue;
                                                            }

                                                            if (column.name === "RIGHT") {
                                                                splitByColumn[column.name] = {
                                                                    base: seats.slice(extraCount),
                                                                    extras: seats.slice(0, extraCount),
                                                                };
                                                                continue;
                                                            }

                                                            splitByColumn[column.name] = {
                                                                base: seats.slice(0, defaultCount),
                                                                extras: seats.slice(defaultCount),
                                                            };
                                                        }

                                                        const centeredExtraSeats =
                                                            activeColumns.flatMap(
                                                                (column) =>
                                                                    splitByColumn[column.name]?.extras ??
                                                                    [],
                                                            );

                                                        const renderSpecialSeat = (
                                                            seat: SeatCell,
                                                        ) => {
                                                            const seatVisual =
                                                                getSeatVisualStyles("EMPTY");

                                                            return (
                                                                <div
                                                                    key={seat.id}
                                                                    title={`Tang ${seat.floor} - Hang ${seat.rowIndex} - ${seat.column}`}
                                                                    className="relative h-[36px] w-[62px] overflow-visible"
                                                                >
                                                                    <span
                                                                        className={`pointer-events-none absolute left-[13px] top-[1px] h-[11px] w-[35px] rounded-t-[6px] border-[2px] border-b-0 ${seatVisual.detail}`}
                                                                    />
                                                                    <span
                                                                        className={`pointer-events-none absolute left-[7px] top-[10px] flex h-[17px] w-[48px] items-center justify-center rounded-[4px] border-[2px] text-[10px] font-black leading-none ${seatVisual.frame} ${seatVisual.label}`}
                                                                    >
                                                                        {seat.seatCode}
                                                                    </span>
                                                                    <span
                                                                        className={`pointer-events-none absolute left-[20px] top-[27px] h-[6px] w-[2px] rounded-b-[1px] ${seatVisual.leg}`}
                                                                    />
                                                                    <span
                                                                        className={`pointer-events-none absolute right-[20px] top-[27px] h-[6px] w-[2px] rounded-b-[1px] ${seatVisual.leg}`}
                                                                    />
                                                                </div>
                                                            );
                                                        };

                                                        const hasLeftAndRightOnly =
                                                            activeColumns.length === 2 &&
                                                            activeColumns.some(
                                                                (column) => column.name === "LEFT",
                                                            ) &&
                                                            activeColumns.some(
                                                                (column) => column.name === "RIGHT",
                                                            );

                                                        if (hasLeftAndRightOnly) {
                                                            const leftBaseSeats =
                                                                splitByColumn.LEFT?.base ?? [];
                                                            const rightBaseSeats =
                                                                splitByColumn.RIGHT?.base ?? [];

                                                            return (
                                                                <div
                                                                    key={`floor-${previewFloorLayout.floor}-row-${rowLayout.rowIndex}`}
                                                                    className="rounded-[8px] border border-dashed border-[#d1d5db] bg-[#f9fafb] px-2 py-2"
                                                                >
                                                                    <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                                                                        Hàng đặc biệt
                                                                    </p>
                                                                    <div className="flex min-h-8 items-center justify-center gap-3">
                                                                        <div className="flex min-h-8 min-w-[124px] items-center justify-end gap-1">
                                                                            {leftBaseSeats.length > 0 ? (
                                                                                leftBaseSeats.map((seat) =>
                                                                                    renderSpecialSeat(seat),
                                                                                )
                                                                            ) : (
                                                                                <span className="text-[11px] font-semibold text-[#c1c8d4]">
                                                                                    -
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {centeredExtraSeats.length > 0 ? (
                                                                            <div className="flex min-h-8 items-center justify-center gap-1">
                                                                                {centeredExtraSeats.map((seat) =>
                                                                                    renderSpecialSeat(seat),
                                                                                )}
                                                                            </div>
                                                                        ) : null}

                                                                        <div className="flex min-h-8 min-w-[124px] items-center justify-start gap-1">
                                                                            {rightBaseSeats.length > 0 ? (
                                                                                rightBaseSeats.map((seat) =>
                                                                                    renderSpecialSeat(seat),
                                                                                )
                                                                            ) : (
                                                                                <span className="text-[11px] font-semibold text-[#c1c8d4]">
                                                                                    -
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div
                                                                key={`floor-${previewFloorLayout.floor}-row-${rowLayout.rowIndex}`}
                                                                className="rounded-[8px] border border-dashed border-[#d1d5db] bg-[#f9fafb] px-2 py-2"
                                                            >
                                                                <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                                                                    Hang dac biet
                                                                </p>
                                                                <div
                                                                    className="grid items-center gap-2"
                                                                    style={{
                                                                        gridTemplateColumns: seatGridTemplate,
                                                                    }}
                                                                >
                                                                    {activeColumns.map((column) => {
                                                                        const seats =
                                                                            splitByColumn[column.name]?.base ??
                                                                            [];

                                                                        return (
                                                                            <div
                                                                                key={`special-group-${previewFloorLayout.floor}-${rowLayout.rowIndex}-${column.name}`}
                                                                                className="flex min-h-8 items-center justify-center"
                                                                            >
                                                                                {seats.length > 0 ? (
                                                                                    seats.map((seat) =>
                                                                                        renderSpecialSeat(seat),
                                                                                    )
                                                                                ) : (
                                                                                    <span className="text-[11px] font-semibold text-[#c1c8d4]">
                                                                                        -
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {centeredExtraSeats.length > 0 ? (
                                                                    <div className="mt-1 flex min-h-8 items-center justify-center gap-1">
                                                                        {centeredExtraSeats.map((seat) =>
                                                                            renderSpecialSeat(seat),
                                                                        )}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={`floor-${previewFloorLayout.floor}-row-${rowLayout.rowIndex}`}
                                                            className="grid items-center gap-2"
                                                            style={{
                                                                gridTemplateColumns: seatGridTemplate,
                                                            }}
                                                        >
                                                            {activeColumns.map((column) => {
                                                                const seats =
                                                                    rowLayout.seatsByColumn[column.name] ??
                                                                    [];

                                                                return (
                                                                    <div
                                                                        key={`floor-${previewFloorLayout.floor}-row-${rowLayout.rowIndex}-${column.name}`}
                                                                        className="flex min-h-8 items-center justify-center gap-1"
                                                                    >
                                                                        {seats.length > 0 ? (
                                                                            seats.map((seat) => {
                                                                                const seatVisual =
                                                                                    getSeatVisualStyles("EMPTY");

                                                                                return (
                                                                                    <div
                                                                                        key={seat.id}
                                                                                        title={`Tang ${seat.floor} - Hang ${seat.rowIndex} - ${seat.column}`}
                                                                                        className="relative h-[36px] w-[62px] overflow-visible"
                                                                                    >
                                                                                        <span
                                                                                            className={`pointer-events-none absolute left-[13px] top-[1px] h-[11px] w-[35px] rounded-t-[6px] border-[2px] border-b-0 ${seatVisual.detail}`}
                                                                                        />
                                                                                        <span
                                                                                            className={`pointer-events-none absolute left-[7px] top-[10px] flex h-[17px] w-[48px] items-center justify-center rounded-[4px] border-[2px] text-[10px] font-black leading-none ${seatVisual.frame} ${seatVisual.label}`}
                                                                                        >
                                                                                            {seat.seatCode}
                                                                                        </span>
                                                                                        <span
                                                                                            className={`pointer-events-none absolute left-[20px] top-[27px] h-[6px] w-[2px] rounded-b-[1px] ${seatVisual.leg}`}
                                                                                        />
                                                                                        <span
                                                                                            className={`pointer-events-none absolute right-[20px] top-[27px] h-[6px] w-[2px] rounded-b-[1px] ${seatVisual.leg}`}
                                                                                        />
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <span className="text-[11px] font-semibold text-[#c1c8d4]">
                                                                                -
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })(),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </aside>
            </div>

            {payloadPreview ? (
                <section className="rounded-[20px] border border-[#e7eaf0] bg-white p-5 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.34)]">
                    <h2 className="mb-2 text-lg font-black text-[#1f2430]">
                        Payload preview
                    </h2>
                    <pre className="overflow-x-auto rounded-[12px] bg-[#f8fafc] p-3 text-xs leading-relaxed text-[#374151]">
                        {payloadPreview}
                    </pre>
                </section>
            ) : null}
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