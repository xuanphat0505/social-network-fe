import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { RiQrCodeLine, RiCameraLine, RiRestartLine, RiDownload2Line } from "react-icons/ri";


const QRCodeTab = ({ user, onScanSuccess }) => {
  const [activeMode, setActiveMode] = useState("display"); // 'display' hoặc 'scan'
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isScannerStarted, setIsScannerStarted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const html5QrCodeRef = useRef(null);
  const hasScannedRef = useRef(false);

  // Lấy danh sách camera khả dụng
  useEffect(() => {
    if (activeMode === "scan") {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Ưu tiên camera sau (thường chứa chữ 'back' hoặc 'rear')
            const backCamIndex = devices.findIndex(cam =>
              cam.label.toLowerCase().includes("back") ||
              cam.label.toLowerCase().includes("rear") ||
              cam.label.toLowerCase().includes("environment")
            );
            const initialIndex = backCamIndex !== -1 ? backCamIndex : 0;
            setCurrentCameraIndex(initialIndex);
            
            // Kiểm tra xem camera hiện tại có phải là camera trước không
            const label = devices[initialIndex].label.toLowerCase();
            setIsFrontCamera(label.includes("front") || label.includes("user"));
          }
        })
        .catch((err) => console.error("Error getting cameras", err));
    }
  }, [activeMode]);

  // Khởi chạy trình quét khi đã có camera và mode là 'scan'
  useEffect(() => {
    if (activeMode === "scan" && cameras.length > 0 && !isScannerStarted) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const cameraId = cameras[currentCameraIndex].id;

      html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          if (decodedText.startsWith("vchat:friend_code:") && !hasScannedRef.current) {
            hasScannedRef.current = true; // Đánh dấu đã quét để không trùng lặp
            const scannedCode = decodedText.replace("vchat:friend_code:", "");
            onScanSuccess(scannedCode);
            stopScanner();
          }
        },
        (errorMessage) => {
          // Chỉ log lỗi nếu cần thiết, thư viện bắn lỗi liên tục khi không thấy mã
        }
      ).then(() => {
        setIsScannerStarted(true);
      }).catch(err => {
        console.error("Unable to start scanner", err);
      });
    }

    return () => {
      stopScanner();
    };
  }, [activeMode, cameras, currentCameraIndex]);

  const stopScanner = () => {
    if (html5QrCodeRef.current && isScannerStarted) {
      html5QrCodeRef.current.stop().then(() => {
        setIsScannerStarted(false);
      }).catch(err => console.error("Error stopping scanner", err));
    }
  };

  const switchCamera = (e) => {
    if (e) e.preventDefault();
    if (cameras.length > 1) {
      stopScanner();
      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);
      
      const label = cameras[nextIndex].label.toLowerCase();
      setIsFrontCamera(label.includes("front") || label.includes("user"));
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("my-qr-svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_VChat_${user?.code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const qrData = `vchat:friend_code:${user?.code}`;

  return (
    <div className="qr-code-tab-content">
      <div className="flex justify-center mb-6 gap-4">
        <button
          type="button"
          onClick={() => setActiveMode("display")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
            activeMode === "display"
              ? "bg-[#7269ef] text-white"
              : "bg-input-bg-color text-body-color hover:bg-gray-200"
          }`}
        >
          <RiQrCodeLine /> My QR Code
        </button>
        <button
          type="button"
          onClick={() => setActiveMode("scan")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
            activeMode === "scan"
              ? "bg-[#7269ef] text-white"
              : "bg-input-bg-color text-body-color hover:bg-gray-200"
          }`}
        >
          <RiCameraLine /> Scan QR
        </button>
      </div>

      <div className="qr-container flex flex-col items-center justify-center p-4 min-h-[350px]">
        {activeMode === "display" ? (
          <div className="text-center animate-fade-in w-full">
            <div className="bg-white p-4 rounded-xl shadow-lg inline-block mb-4 border-4 border-[#7269ef]/10">
              <QRCodeSVG
                id="my-qr-svg"
                value={qrData}
                size={220}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: user?.avatar,
                  x: undefined,
                  y: undefined,
                  height: 44,
                  width: 44,
                  excavate: true,
                }}
              />
            </div>
            <div className="mb-4">
              <p className="text-sm text-body-color font-medium">Your Unique Code</p>
              <h4 className="text-xl font-bold text-[#7269ef] tracking-wider">{user?.code}</h4>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={downloadQR}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#7269ef]/10 text-[#7269ef] rounded-md text-xs font-semibold hover:bg-[#7269ef] hover:text-white transition-all"
              >
                <RiDownload2Line /> Save Image
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full animate-fade-in relative flex flex-col items-center">
            <div className={`scanner-viewport relative w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden border-2 border-[#7269ef] ${isFrontCamera ? "is-front" : ""}`}>
              <div id="qr-reader" className="w-full h-full"></div>
              {isScannerStarted && (
                <>
                  <div className="scanning-line"></div>
                  <div className="scanner-overlay">
                    <div className="scanner-corner corner-tl"></div>
                    <div className="scanner-corner corner-tr"></div>
                    <div className="scanner-corner corner-bl"></div>
                    <div className="scanner-corner corner-br"></div>
                  </div>
                </>
              )}
            </div>

            {cameras.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium hover:bg-white/20 transition-all"
              >
                <RiRestartLine className="text-[#7269ef]" /> Switch Camera
              </button>
            )}

            <p className="text-xs text-secondary-color text-center mt-4 px-8">
              Point your camera at a friend's QR code to add them instantly
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeTab;
