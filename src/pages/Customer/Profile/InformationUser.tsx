import axios from "axios";
import { Camera, Loader2, Save } from "lucide-react";
import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
type UserProfile = {
    name: string;
    phone: string;
    avatar: { url: string } | null;
    role: string;
    joinDate: string;
};

type OutletContextType = {
    profile: UserProfile;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
};
export function InformationUser() {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("accessToken")
    const { profile, setProfile } =
        useOutletContext<OutletContextType>();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const selectedFileRef = useRef<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const formatDate = (date?: string) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("vi-VN");
    };
    const handleChangeAvatar = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        selectedFileRef.current = file;

        const previewUrl = URL.createObjectURL(file);
        setProfile((prev) => ({
            ...prev,
            avatar: { url: previewUrl },
        }));
    };

    /* ================= SAVE ================= */

    const handleSave = async () => {
        if (isSaving) return;

        try {
            setIsSaving(true);

            const formData = new FormData();
            formData.append("name", profile.name);

            if (selectedFileRef.current) {
                formData.append("avatar", selectedFileRef.current);
            }

            await axios.put(
                `${API_BASE_URL}/api/customer/check/updateProfile`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // 👇 Fetch lại profile mới từ server
            const res = await axios.get(
                `${API_BASE_URL}/api/customer/check/getuser`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const raw = res.data;
            const u = raw?.data || raw?.user || raw;

            setProfile({
                name: u.name ?? "",
                phone: u.phone ?? "",
                avatar: u.avatar ?? null,
                role: u.role?.name ?? "",
                joinDate: u.createdAt ?? "",
            });

            // 👇 Clear selected file
            selectedFileRef.current = null;

            alert("Cập nhật thông tin thành công");
        } catch (err) {
            console.error("UPDATE PROFILE ERROR >>>", err);
            alert("Cập nhật thất bại");
        } finally {
            setIsSaving(false);
        }
    };
    return (
        <>
            <section className="bg-white rounded-3xl border p-10">
                <h1 className="text-2xl font-extrabold mb-8">Thông tin cá nhân</h1>

                {/* Avatar */}
                <div className="flex items-center gap-6 pb-10 border-b mb-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full ring-4 ring-orange-100 overflow-hidden">
                            <img
                                src={profile.avatar?.url || "https://i.pravatar.cc/300"}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <button
                            onClick={handleChangeAvatar}
                            className="absolute bottom-1 right-1 bg-orange-500 text-white p-2 rounded-full shadow-lg border-2 border-white"
                        >
                            <Camera size={16} />
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold">{profile.name}</h3>
                        <p className="text-sm text-slate-500">
                            Ngày tham gia: {formatDate(profile.joinDate)}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Họ và tên"
                        value={profile.name}
                        onChange={(v) => setProfile({ ...profile, name: v })}
                    />
                    <Input label="Số điện thoại" value={profile.phone} disabled />
                    <Input label="Vai trò" value={profile.role} disabled />
                    <Input
                        label="Ngày tham gia"
                        value={formatDate(profile.joinDate)}
                        disabled
                    />
                </div>

                {/* Save */}
                <div className="flex justify-end mt-10">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-white shadow
                ${isSaving
                                ? "bg-orange-400 cursor-not-allowed"
                                : "bg-orange-500 hover:bg-orange-600"
                            }
              `}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Lưu thay đổi
                            </>
                        )}
                    </button>
                </div>
            </section>
        </>
    )
}
function Input({
    label,
    value,
    onChange,
    type = "text",
    disabled = false,
}: {
    label: string;
    value: string;
    type?: string;
    disabled?: boolean;
    onChange?: (v: string) => void;
}) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
                {label}
            </label>
            <input
                type={type}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-slate-50 border px-5 py-3
                   disabled:bg-slate-100 disabled:text-slate-400"
            />
        </div>
    );
}