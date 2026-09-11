import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, MapPin, CheckCircle, Clock, X } from "lucide-react";
import { api } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { bhashiniService } from "../../services/bhashini";

export default function SOSButton({ patientId, emergencyContact = "+91 98640 11223", emergencyName = "Bikash Baruah" }) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [smsStatus, setSmsStatus] = useState("");
  const [debounceSeconds, setDebounceSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const cancelButtonRef = useRef(null);

  // Debounce watchdog timer
  useEffect(() => {
    let timer;
    if (debounceSeconds > 0) {
      timer = setInterval(() => {
        setDebounceSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [debounceSeconds]);

  useEffect(() => {
    if (!isOpen) return undefined;
    cancelButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSending) setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSending]);

  const handleOpen = () => {
    if (debounceSeconds > 0) {
      setErrorMessage(`An SOS demo alert is already active. Please wait ${debounceSeconds} seconds before trying again.`);
      return;
    }
    setIsOpen(true);
    setSentSuccess(false);
    setSmsStatus("");
    setErrorMessage("");
  };

  const handleConfirmSOS = async () => {
    setIsSending(true);

    let lat = null;
    let lng = null;
    let locationUnavailable = false;

    // Try browser geolocation with 4s timeout
    try {
      if ("geolocation" in navigator) {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 4000,
            maximumAge: 10000
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        locationUnavailable = true;
      }
    } catch (geoErr) {
      console.warn("Geolocation denied or timed out:", geoErr);
      locationUnavailable = true;
    }

    try {
      const res = await api.triggerSOS({
        patient_id: patientId,
        lat: lat,
        lng: lng,
        location_unavailable: locationUnavailable,
        notes: "Emergency SOS triggered by patient"
      });

      setIsSending(false);
      setSentSuccess(true);
      setDebounceSeconds(60); // 60-second debounce
      setSmsStatus(res.alert?.details?.simulated_sms_sent_to || `${emergencyName} (${emergencyContact})`);

      // Gentle voice reassurance in patient's language
      const speakMsg = language === "as"
        ? "আপোনাৰ জৰুৰীকালীন সংকেত পঠিওৱা হৈছে। পৰিয়ালৰ লোকক জনোৱা হৈছে, চিন্তা নকৰিব।"
        : (language === "hi" 
            ? "आपातकालीन सूचना भेज दी गई है। परिवार को सूचित कर दिया गया है।" 
            : "Emergency alert sent. Your emergency contact has been notified.");
      bhashiniService.speakText(speakMsg, language);

      setTimeout(() => {
        setIsOpen(false);
        setSentSuccess(false);
      }, 4000);
    } catch (err) {
      setIsSending(false);
      setErrorMessage("The simulated alert could not be saved. Please check your connection and try again.");
    }
  };

  return (
    <>
      {errorMessage && <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-lg border-2 border-red-700 bg-red-50 p-4 font-bold text-red-950" role="alert">{errorMessage}</div>}
      <button
        data-testid="sos-button"
        onClick={handleOpen}
        disabled={debounceSeconds > 0}
        aria-label="Emergency SOS Alert Button"
        className={`touch-target flex items-center justify-center gap-2 px-6 py-3 font-bold text-white uppercase rounded-md text-lg tracking-wider border-2 border-white transition-all ${
          debounceSeconds > 0
            ? "bg-stone-500 cursor-not-allowed opacity-80"
            : "bg-red-700 hover:bg-red-800 active:bg-red-900 ring-4 ring-red-300"
        }`}
      >
        <AlertTriangle className="w-6 h-6 animate-pulse" />
        <span>{debounceSeconds > 0 ? `SOS Active (${debounceSeconds}s)` : t("sos_button")}</span>
      </button>

      {isOpen && (
        <div
          data-testid="sos-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="bg-white border-4 border-red-700 rounded-lg max-w-lg w-full p-6 text-patient-text ner-gamusa-border-top">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-950">Demo mode — no real SMS is sent</span>
              <button onClick={() => setIsOpen(false)} disabled={isSending} className="touch-target rounded border-2 border-stone-300 p-2 text-stone-700" aria-label="Close emergency alert dialog"><X className="h-5 w-5" /></button>
            </div>
            {!sentSuccess ? (
              <>
                <div className="flex items-center gap-3 text-red-700 mb-4">
                  <AlertTriangle className="w-10 h-10" />
                  <h2 className="text-2xl font-black">{t("sos_confirm_title")}</h2>
                </div>

                <p className="text-lg mb-6 leading-relaxed text-stone-800">
                  {t("sos_confirm_desc")}
                </p>

                <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded mb-6 text-sm flex items-center gap-2 text-amber-950 font-medium">
                  <MapPin className="w-5 h-5 flex-shrink-0 text-amber-700" />
                  <span>GPS location will be automatically shared with {emergencyName}. If GPS is off, alert will note "location unavailable".</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    data-testid="sos-cancel-btn"
                    ref={cancelButtonRef}
                    onClick={() => setIsOpen(false)}
                    disabled={isSending}
                    className="touch-target flex-1 py-4 px-6 border-2 border-stone-400 font-bold rounded text-lg bg-stone-100 hover:bg-stone-200 text-stone-900"
                  >
                    {t("sos_cancel")}
                  </button>

                  <button
                    data-testid="sos-confirm-btn"
                    onClick={handleConfirmSOS}
                    disabled={isSending}
                    className="touch-target-lg flex-1 py-4 px-6 font-bold rounded text-xl bg-red-700 hover:bg-red-800 text-white flex items-center justify-center gap-2 ring-2 ring-red-950"
                  >
                    {isSending ? (
                      <span>{t("sos_sending")}</span>
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6" />
                        <span>{t("sos_send_now")}</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-2">{t("sos_sent")}</h3>
                <p className="text-stone-700 text-base mb-2">Simulated SMS dispatched to: <strong>{smsStatus}</strong></p>
                <div className="inline-flex items-center gap-2 text-stone-600 bg-stone-100 px-4 py-2 rounded text-sm mt-3">
                  <Clock className="w-4 h-4" />
                  <span>Debounce active: 60s security cooldown</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
