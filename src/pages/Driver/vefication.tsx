import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Link, useNavigate } from "react-router-dom";

type LivenessStep = "TURN_LEFT" | "TURN_RIGHT" | "BLINK" | "DONE";
const API_BASE = import.meta.env.VITE_API_URL;
export default function FaceVerification() {
    const token = localStorage.getItem("accessToken");
    const blinkStateRef = useRef<"OPEN" | "CLOSED">("OPEN");

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Refs để quản lý logic bên trong setInterval (tránh stale closure)
    const intervalRef = useRef<number | null>(null);
    const currentStepRef = useRef<LivenessStep>("TURN_LEFT");
    const stableCountRef = useRef(0);
    const isVerifyingRef = useRef(false);
    const lastStatusRef = useRef("");

    // Responsive mobile state
    const [isMobile, setIsMobile] = useState(false);

    const [status, setStatus] = useState("Sẵn sàng đăng nhập bằng khuôn mặt");
    const [cameraOn, setCameraOn] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const navigate = useNavigate();

    const safeSetStatus = (text: string) => {
        if (lastStatusRef.current !== text) {
            lastStatusRef.current = text;
            setStatus(text);
        }
    };

    const updateStep = (step: LivenessStep, msg: string) => {
        currentStepRef.current = step;
        stableCountRef.current = 0;
        safeSetStatus(msg);
    };
    const stopCamera = (isSuccess = false) => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        const stream = videoRef.current?.srcObject as MediaStream | null;
        stream?.getTracks().forEach(t => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;

        stableCountRef.current = 0;
        isVerifyingRef.current = false;
        if (!isSuccess) {
            currentStepRef.current = "TURN_LEFT";
        }
        setCameraOn(false);
    };

    const startCamera = async () => {
        if (cameraOn || !videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" }
            });
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setCameraOn(true);
            updateStep("TURN_LEFT", "👈 Quay mặt sang trái");
            startDetectLoop();
        } catch {
            setStatus("❌ Không thể mở camera");
        }
    };

    // Desktop + Mobile responsive
    useEffect(() => {
        let isMounted = true;
        const loadModels = async () => {
            try {
                setStatus("Đang tải AI...");
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
                    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                    faceapi.nets.faceRecognitionNet.loadFromUri("/models")
                ]);
                if (isMounted) {
                    setModelsLoaded(true);
                    setStatus("Nhấn Bắt đầu để quét khuôn mặt");
                }
            } catch (error) {
                console.error("Model load error:", error);
                if (isMounted) setStatus("❌ Không tải được dữ liệu AI");
            }
        };
        loadModels();
        return () => {
            isMounted = false;
            stopCamera();
        };
    }, []);

    // Mobile detection (like native app)
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize(); // initial check
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const startDetectLoop = () => {
        if (intervalRef.current) return;

        intervalRef.current = window.setInterval(async () => {
            if (!videoRef.current || !canvasRef.current || isVerifyingRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d")!;
            const displaySize = { width: video.videoWidth, height: video.videoHeight };

            canvas.width = displaySize.width;
            canvas.height = displaySize.height;

            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 256, scoreThreshold: 0.2 }))
                .withFaceLandmarks();

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!detection) {
                stableCountRef.current = 0;
                safeSetStatus("📏 Đưa mặt vào khung hình");
                return;
            }

            const resized = faceapi.resizeResults(detection, displaySize);

            const { box } = resized.detection;
            const landmarks = resized.landmarks;
            const lm = resized.landmarks;
            if (box.width < 160) {
                safeSetStatus("📏 Đưa mặt lại gần camera hơn");
                return;
            }

            // --- TÍNH TOÁN EAR (NHÁY MẮT) ---
            type Point = { x: number; y: number };

            const calcEAR = (eye: Point[]) => {
                const v1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
                const v2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
                const h = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
                return (v1 + v2) / (2.0 * h);
            };

            const avgEAR = (calcEAR(lm.getLeftEye()) + calcEAR(lm.getRightEye())) / 2;

            // --- TÍNH TOÁN YAW (QUAY MẶT) ---
            const leftEyeX = (landmarks.getLeftEye()[0].x + landmarks.getLeftEye()[3].x) / 2;
            const rightEyeX = (landmarks.getRightEye()[0].x + landmarks.getRightEye()[3].x) / 2;
            const noseX = landmarks.getNose()[6].x;
            const yawRatio = (noseX - leftEyeX) / (rightEyeX - leftEyeX);
            const yawDeg = (yawRatio - 0.5) * 100;

            // Debug HUD
            // ----- DEBUG HUD (UN-MIRROR TEXT) -----
            ctx.save();

            // đảo canvas lại lần nữa để text đọc bình thường
            ctx.scale(-1, 1);
            ctx.fillStyle = "lime";
            ctx.font = "16px Arial";

            // vì scale(-1,1) nên x phải là số âm
            ctx.fillText(
                `Yaw: ${yawDeg.toFixed(1)} | EAR: ${avgEAR.toFixed(3)}`,
                -canvas.width + 10,
                20
            );

            ctx.restore();


            // --- QUY TRÌNH KIỂM TRA (LIVENESS) ---
            const step = currentStepRef.current;
            const YAW_LIMIT = 15;

            switch (step) {
                case "TURN_LEFT": {
                    if (yawDeg < -YAW_LIMIT) {
                        stableCountRef.current++;
                        if (stableCountRef.current >= 3) updateStep("TURN_RIGHT", "👉 Tốt! Quay sang phải");
                    } else {
                        safeSetStatus("👈 Quay mặt sang phải");
                    }
                    break;
                }
                case "TURN_RIGHT": {
                    if (yawDeg > YAW_LIMIT) {
                        stableCountRef.current++;
                        if (stableCountRef.current >= 3) updateStep("BLINK", "😉 Nháy mắt một cái");
                    } else {
                        safeSetStatus("👉 Quay mặt sang trái");
                    }
                    break;
                }
                case "BLINK": {
                    if (avgEAR < 0.26 && blinkStateRef.current === "OPEN") {
                        blinkStateRef.current = "CLOSED";
                        safeSetStatus("😉 Đã nhắm mắt, mở lại để tiếp tục");
                    }

                    // Mắt mở lại → BLINK HOÀN THÀNH
                    if (avgEAR > 0.30 && blinkStateRef.current === "CLOSED") {
                        blinkStateRef.current = "OPEN";
                        updateStep("DONE", "📸 Nhìn thẳng để xác thực");
                    }
                    break;
                }
                case "DONE": {
                    const isCentered = Math.abs((box.x + box.width / 2) - canvas.width / 2) < (canvas.width * 0.1);
                    const isStraight = Math.abs(yawDeg) < 8;
                    if (isCentered && isStraight) {
                        stableCountRef.current++;
                        if (stableCountRef.current >= 5) {
                            safeSetStatus("🔐 Đang xác thực...");
                            verifyFace();
                        }
                    } else {
                        safeSetStatus("📸 Giữ mặt thẳng và chính giữa");
                    }
                    break;
                }
            }
        }, 200);
    };

    const verifyFace = async () => {
        if (isVerifyingRef.current) return;
        isVerifyingRef.current = true;

        try {
            // Chụp frame
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = 640;
            tempCanvas.height = 480;
            tempCanvas.getContext("2d")?.drawImage(videoRef.current!, 0, 0);
            const image = tempCanvas.toDataURL("image/jpeg", 0.8).split(",")[1];

            const res = await fetch(`${API_BASE}/api/common/check/face-login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ image })
            });
            const data = await res.json();

            if (data.success) {
                setLoggedIn(true);
                setIsCompleted(true);
                setStatus(`✅ Thành công (${data.similarity?.toFixed(1)}%)`);
                stopCamera(true);
                navigate("/driverBooking/viewtrip")
            } else {
                safeSetStatus("❌ Không khớp, vui lòng thử lại");
                updateStep("TURN_LEFT", "👈 Thử lại: Quay mặt sang trái");
                isVerifyingRef.current = false;
            }
        } catch (err) {
            safeSetStatus("❌ Lỗi kết nối server");
            console.log("lỗi chương trình trên là : ", err)
            isVerifyingRef.current = false;
        }
    };

    const handleGoBack = () => {
        stopCamera();
        setStatus('Đã hủy xác thực');
    };

    // ========== RESPONSIVE STYLES (desktop giữ nguyên 100%, mobile như app native) ==========
    const containerStyle = isMobile
        ? { ...styles.container, padding: "10px" }
        : styles.container;

    const wrapperStyle = isMobile
        ? { ...styles.wrapper, gridTemplateColumns: "1fr", gap: "20px" }
        : styles.wrapper;

    const leftSectionStyle = isMobile
        ? { ...styles.leftSection, padding: "10px" }
        : styles.leftSection;

    const logoTextStyle = isMobile
        ? { ...styles.logoText, fontSize: "16px", marginBottom: "20px" }
        : styles.logoText;

    const titleStyle = isMobile
        ? { ...styles.title, fontSize: "32px" }
        : styles.title;

    const statusMessageStyle = isMobile
        ? { ...styles.statusMessage, fontSize: "14px", minHeight: "40px", padding: "12px" }
        : styles.statusMessage;

    const buttonsStyle = isMobile
        ? { ...styles.buttons, flexDirection: "column" as const, gap: "12px" }
        : styles.buttons;

    const baseBtnStyle = isMobile
        ? { ...styles.btn, padding: "11px 24px", fontSize: "15px" }
        : styles.btn;

    const cameraContainerStyle = isMobile
        ? { ...styles.cameraContainer, maxWidth: "100%", margin: "0 auto" }
        : styles.cameraContainer;

    const faceFrameStyle = isMobile
        ? { ...styles.faceFrame, width: "260px", height: "320px" }
        : styles.faceFrame;

    const faceOvalStyle = isMobile
        ? { ...styles.faceOval, width: "200px", height: "260px" }
        : styles.faceOval;

    const instructionStyle = isMobile
        ? { ...styles.instruction, fontSize: "13px", padding: "10px 20px" }
        : styles.instruction;

    const statusIndicatorStyle = isMobile
        ? { ...styles.statusIndicator, fontSize: "12px", padding: "6px 12px" }
        : styles.statusIndicator;

    return (
        <div style={containerStyle}>
            <style>{cssString}</style>
            <div style={wrapperStyle}>
                <div style={leftSectionStyle}>
                    <div style={logoTextStyle}>
                        Trở lại với <span style={styles.brandName}>Bustrip</span>
                    </div>
                    <h1 style={titleStyle}>
                        XÁC THỰC<br />GƯƠNG MẶT
                    </h1>
                    <div style={statusMessageStyle}>
                        {status}
                    </div>
                    <div style={buttonsStyle}>
                        <button
                            style={{ ...baseBtnStyle, ...styles.btnBack }}
                            onClick={handleGoBack}
                            disabled={!cameraOn}
                        >
                            Trở lại
                        </button>
                        {!cameraOn && !isCompleted && (
                            <button
                                style={{ ...baseBtnStyle, ...styles.btnVerify }}
                                onClick={startCamera}
                                disabled={!modelsLoaded}
                            >
                                {modelsLoaded ? 'Bắt đầu quét' : 'Đang tải...'}
                            </button>
                        )}
                        {isCompleted && loggedIn && (
                            <button
                                style={{ ...baseBtnStyle, ...styles.btnSuccess }}
                                disabled
                            >
                                ✓ Đã xác thực
                            </button>
                        )}
                    </div>
                    <div className="mt-8">
                        <Link to={"/registerCamera"}>
                            <button
                            >
                                Đăng ký quét khuôn mắt
                            </button>

                        </Link>
                    </div>
                </div>

                <div style={styles.rightSection}>
                    <div style={cameraContainerStyle}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="mirror"
                            style={styles.video}
                        />
                        <canvas
                            ref={canvasRef}
                            className="face-canvas"
                            style={styles.canvas}
                        />

                        <div style={styles.overlay}>
                            <div style={faceFrameStyle}>
                                <div style={{ ...styles.corner, ...styles.cornerTL }}></div>
                                <div style={{ ...styles.corner, ...styles.cornerTR }}></div>
                                <div style={{ ...styles.corner, ...styles.cornerBL }}></div>
                                <div style={{ ...styles.corner, ...styles.cornerBR }}></div>
                                <div style={faceOvalStyle}></div>
                                {cameraOn && !isCompleted && <div className="scan-line" style={styles.scanLine}></div>}
                            </div>
                        </div>

                        {cameraOn && (
                            <div style={statusIndicatorStyle}>
                                <div className={isCompleted ? 'status-dot success' : 'status-dot'} style={{ ...styles.statusDot, ...(isCompleted ? styles.statusDotSuccess : {}) }}></div>
                                <span>{isCompleted ? 'Xác thực thành công' : 'Camera đang hoạt động'}</span>
                            </div>
                        )}

                        <div style={instructionStyle}>
                            {!cameraOn && !isCompleted && 'Nhấn "Bắt đầu quét" để bắt đầu'}
                            {cameraOn && !isCompleted && 'Làm theo hướng dẫn trên màn hình'}
                            {isCompleted && '✓ Hoàn thành xác thực'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// CSS as string for animations (giữ nguyên + không thay đổi logic)
const cssString = `
@keyframes scan {
  0%, 100% { top: 20%; }
  50% { top: 80%; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.scan-line {
  animation: scan 2s ease-in-out infinite !important;
}

.status-dot {
  animation: pulse 1.5s ease-in-out infinite !important;
}

.status-dot.success {
  animation: none !important;
}

.mirror {
  transform: scaleX(-1);
}

.face-canvas {
  transform: scaleX(-1);
}
`;

// Inline styles object (desktop giữ nguyên 100%)
const styles = {
    container: {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    } as React.CSSProperties,

    wrapper: {
        maxWidth: "1400px",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr",
        gap: "40px",
        alignItems: "center",
    } as React.CSSProperties,

    leftSection: {
        padding: "20px",
    } as React.CSSProperties,

    logoText: {
        fontSize: "18px",
        marginBottom: "30px",
        color: "#333",
    } as React.CSSProperties,

    brandName: {
        color: "#ff6b35",
        fontWeight: 600,
    } as React.CSSProperties,

    title: {
        fontSize: "42px",
        fontWeight: 700,
        color: "#1a1a1a",
        marginBottom: "20px",
        lineHeight: "1.2",
    } as React.CSSProperties,

    statusMessage: {
        fontSize: "16px",
        color: "#555",
        marginBottom: "30px",
        minHeight: "50px",
        padding: "15px",
        background: "rgba(255, 255, 255, 0.7)",
        borderRadius: "12px",
        borderLeft: "4px solid #ff6b35",
    } as React.CSSProperties,

    buttons: {
        display: "flex",
        gap: "15px",
    } as React.CSSProperties,

    btn: {
        padding: "12px 28px",
        border: "none",
        borderRadius: "25px",
        fontSize: "16px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.3s ease",
    } as React.CSSProperties,

    btnBack: {
        background: "white",
        color: "#ff6b35",
        border: "2px solid #ff6b35",
    } as React.CSSProperties,

    btnVerify: {
        background: "#ff6b35",
        color: "white",
        border: "none",
    } as React.CSSProperties,

    btnSuccess: {
        background: "#4caf50",
        color: "white",
        border: "none",
        cursor: "default",
    } as React.CSSProperties,

    rightSection: {
        position: "relative",
    } as React.CSSProperties,

    cameraContainer: {
        position: "relative",
        background: "#000",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        aspectRatio: "4/3",
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
    } as React.CSSProperties,

    video: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    } as React.CSSProperties,

    canvas: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
    } as React.CSSProperties,

    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
    } as React.CSSProperties,

    faceFrame: {
        position: "relative",
        width: "300px",
        height: "370px",
    } as React.CSSProperties,

    faceOval: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "240px",
        height: "300px",
        border: "3px solid rgba(255, 107, 53, 0.8)",
        borderRadius: "50%",
        boxShadow: "0 0 0 2000px rgba(0, 0, 0, 0.5)",
    } as React.CSSProperties,

    corner: {
        position: "absolute",
        width: "40px",
        height: "40px",
        border: "3px solid #fff",
    } as React.CSSProperties,

    cornerTL: {
        top: 0,
        left: 0,
        borderRight: "none",
        borderBottom: "none",
        borderTopLeftRadius: "8px",
    } as React.CSSProperties,

    cornerTR: {
        top: 0,
        right: 0,
        borderLeft: "none",
        borderBottom: "none",
        borderTopRightRadius: "8px",
    } as React.CSSProperties,

    cornerBL: {
        bottom: 0,
        left: 0,
        borderRight: "none",
        borderTop: "none",
        borderBottomLeftRadius: "8px",
    } as React.CSSProperties,

    cornerBR: {
        bottom: 0,
        right: 0,
        borderLeft: "none",
        borderTop: "none",
        borderBottomRightRadius: "8px",
    } as React.CSSProperties,

    scanLine: {
        position: "absolute",
        width: "100%",
        height: "3px",
        background: "linear-gradient(90deg, transparent, #ff6b35, transparent)",
        boxShadow: "0 0 10px #ff6b35",
    } as React.CSSProperties,

    instruction: {
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "12px 24px",
        borderRadius: "25px",
        fontSize: "14px",
        backdropFilter: "blur(10px)",
        maxWidth: "90%",
        textAlign: "center",
    } as React.CSSProperties,

    statusIndicator: {
        position: "absolute",
        top: "20px",
        right: "20px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(0, 0, 0, 0.6)",
        padding: "8px 16px",
        borderRadius: "20px",
        color: "white",
        fontSize: "13px",
        backdropFilter: "blur(10px)",
    } as React.CSSProperties,

    statusDot: {
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: "#4caf50",
    } as React.CSSProperties,

    statusDotSuccess: {
        background: "#4caf50",
    } as React.CSSProperties,
};