import React, { useState, useEffect } from "react";
import { Mail, Send, X, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { api } from "../../services/api";

export default function WeeklyDigestModal({ patientId, isOpen, onClose }) {
  const [htmlContent, setHtmlContent] = useState("");
  const [patientName, setPatientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    if (isOpen && patientId) {
      loadPreview();
    }
  }, [isOpen, patientId]);

  const loadPreview = async () => {
    setIsLoading(true);
    setSendResult(null);
    try {
      const res = await api.previewDigest(patientId);
      setHtmlContent(res.html);
      setPatientName(res.patient_name || "Patient");
      setRecipientEmail(res.recipient_email || "");
    } catch (e) {
      console.warn("Failed to preview digest:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNow = async () => {
    setIsSending(true);
    try {
      const res = await api.sendDigest(patientId);
      setSendResult(res);
    } catch (err) {
      setSendResult({
        status: "error",
        message: err.message || "Failed to dispatch digest."
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full flex flex-col h-[85vh] border border-caregiver-border">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-caregiver text-white rounded-lg">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-caregiver-primary">Weekly Caregiver Digest Email</h2>
              <p className="text-xs text-stone-600">HTML Summary for {patientName} • Dispatch via Resend</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-500 hover:text-stone-900 rounded-md">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Alert Banner */}
        {sendResult && (
          <div className={`p-4 text-sm font-bold flex items-center justify-between ${
            sendResult.status === "sent"
              ? "bg-emerald-50 text-emerald-900 border-b border-emerald-300"
              : sendResult.status === "queued"
              ? "bg-amber-50 text-amber-950 border-b border-amber-300"
              : "bg-red-50 text-red-900 border-b border-red-300"
          }`}>
            <div className="flex items-center gap-2">
              {sendResult.status === "sent" ? (
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              ) : sendResult.status === "queued" ? (
                <Clock className="w-5 h-5 text-amber-700" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-700" />
              )}
              <span>{sendResult.message}</span>
            </div>
            <span className="text-xs uppercase bg-white/70 px-2 py-0.5 rounded">
              Status: {sendResult.status}
            </span>
          </div>
        )}

        {/* HTML Email Preview Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100">
          {isLoading ? (
            <div className="text-center py-20 font-bold text-stone-500">Generating weekly summary preview...</div>
          ) : (
            <div
              className="bg-white rounded-lg shadow-sm border border-stone-300 p-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-white flex items-center justify-between">
          <div className="text-xs text-stone-600 font-medium">
            Recipient: <strong>{recipientEmail}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 rounded-lg text-sm font-bold text-stone-700 hover:bg-stone-50"
            >
              Close
            </button>
            <button
              data-testid="send-digest-btn"
              onClick={handleSendNow}
              disabled={isSending || isLoading}
              className="px-5 py-2 bg-caregiver hover:bg-caregiver-secondary disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center gap-2"
            >
              {isSending ? (
                <span>Dispatching...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Digest Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
