import { useState, useEffect, useRef } from "react";
import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const AUTO_DISMISS_MS = 6000;

/**
 * Floating card (bottom-right) for admin broadcast messages.
 * Auto-dismisses after AUTO_DISMISS_MS, or on user click.
 */
function SystemBroadcastBanner() {
  const { broadcastMessage, clearBroadcast } = useContext(SocketContext);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    if (!broadcastMessage) return;

    setVisible(true);
    setProgress(100);

    // Countdown progress bar
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
    }, 50);

    // Auto dismiss
    timerRef.current = setTimeout(() => handleDismiss(), AUTO_DISMISS_MS);

    return () => {
      clearInterval(progressRef.current);
      clearTimeout(timerRef.current);
    };
  }, [broadcastMessage]);

  const handleDismiss = () => {
    clearInterval(progressRef.current);
    clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(() => clearBroadcast(), 300);
  };

  if (!broadcastMessage || !visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "24px",
        zIndex: 9999,
        width: "320px",
        background: "linear-gradient(145deg, #1e1b4b, #2d1f6e)",
        borderRadius: "14px",
        boxShadow: "0 8px 32px rgba(124, 58, 237, 0.45)",
        border: "1px solid rgba(139, 92, 246, 0.4)",
        overflow: "hidden",
        animation: "slideInLeft 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px 6px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "15px" }}>📢</span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c4b5fd",
            }}
          >
            System Broadcast
          </span>
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "50%",
            width: "22px",
            height: "22px",
            cursor: "pointer",
            color: "#c4b5fd",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 14px 12px" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "14px",
            marginBottom: "4px",
            color: "#ede9fe",
          }}
        >
          {broadcastMessage.title}
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "#c4b5fd",
            lineHeight: "1.5",
            wordBreak: "break-word",
          }}
        >
          {broadcastMessage.content}
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
            transition: "width 0.05s linear",
          }}
        />
      </div>
    </div>
  );
}

export default SystemBroadcastBanner;
