"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Modal from "@/components/shared/modal";

type InviteReflectionButtonProps = {
  reflectionLink: string;
};

export default function InviteReflectionButton({
  reflectionLink,
}: InviteReflectionButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reflectionLink);
      setCopied(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (err) {
      console.error("Failed to copy reflection link:", err);
    }
  };

  const handleDownloadQr = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "reflection-qr.png";
    link.click();
  };

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800"
      >
        Invite reflection
      </button>
      <Modal showModal={showModal} setShowModal={setShowModal} className="p-6">
        <div className="space-y-4">
          <div className="space-y-3 text-center">
            <h2 className="text-xl font-semibold">Invite reflection</h2>
            <p className="text-sm text-gray-500">
              Share this link or QRcode with your clients.
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <span className="truncate">{reflectionLink}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7.75 5A2.75 2.75 0 0 1 10.5 2.25h4.75A2.75 2.75 0 0 1 18 5v4.75A2.75 2.75 0 0 1 15.25 12.5H10.5A2.75 2.75 0 0 1 7.75 9.75V5Z" />
                <path d="M2 8.75A2.75 2.75 0 0 1 4.75 6h1.5a.75.75 0 0 1 0 1.5h-1.5A1.25 1.25 0 0 0 3.5 8.75v6.5A1.25 1.25 0 0 0 4.75 16.5h6.5a1.25 1.25 0 0 0 1.25-1.25v-1.5a.75.75 0 0 1 1.5 0v1.5A2.75 2.75 0 0 1 11.25 18h-6.5A2.75 2.75 0 0 1 2 15.25v-6.5Z" />
              </svg>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="border-t border-gray-200" />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="rounded-lg p-1 transition hover:bg-gray-100"
              aria-label="Download QR code"
            >
              <QRCodeCanvas ref={qrCanvasRef} value={reflectionLink} size={140} />
            </button>
          </div>
          <div className="border-t border-gray-200" />
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="mx-auto block rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </Modal>
    </>
  );
}
