import React, { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  width?: number | string;
  className?: string;
};

export default function Modal({ open, onClose, children, width = 720, className = "" }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (!open) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        zIndex: 1200,
        padding: 16,
      }}
    >
      <div
        className={className}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(2,6,23,0.25)",
          padding: 16,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            aria-label="Close"
            onClick={onClose}
            className="pill-btn"
            style={{ marginBottom: 8 }}
          >
            ✕
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
