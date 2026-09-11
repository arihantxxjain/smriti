import React, { useState, useEffect } from "react";
import { AlertTriangle, MapPin, CheckCircle, Clock, X, ShieldAlert, PhoneCall } from "lucide-react";
import { api } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { bhashiniService } from "../../services/bhashini";
import { soundEffects } from "../../utils/soundEffects";

export default function SOSButton({ patientId, emergencyContact = "+91 98640 11223", emergencyName = "Bikash Baruah" }) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [smsStatus, setSmsStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [debounceSeconds, setDebounceSeconds] = useState(0);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

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

  const handleOpen = () => {
    if (debounceSeconds > 0) return;
    soundEffects.playAlert();
    setIsOpen(true);
    setSentSuccess(false);
    setSmsStatus("");
    setErrorMessage("");
    setGpsLocation(null);

    // Pre-fetch location gently
    if ("geolocation" in navigator) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGettingLocation(false);
        },
        () => {
          setGettingLocation(false);
        },
        { timeout: 3500, maximumAge: 10000 }
      );
    }
  };

  const handleConfirmSOS = async () => {
    setIsSending(true);
    setErrorMessage("");

    let lat = gpsLocation?.lat || null;
    let lng = gpsLocation?.lng || null;
    let locationUnavailable = !lat || !lng;

    // If not already fetched, attempt one quick fetch
    if (!lat && "geolocation" in navigator) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 2500,
            maximumAge: 10000
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        locationUnavailable = false;
      } catch {
        locationUnavailable = true;
      }
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
      soundEffects.playChime();

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
      }, 5000);
    } catch (err) {
      setIsSending(false);
      setErrorMessage(err.message || "Unable to reach server. Please check your network connection.");
    }
  };

  return (
    <>
      <button
        data-testid="sos-button"
        onClick={handleOpen}
        disabled={debounceSeconds > 0}
        aria-label="Emergency SOS Alert Button"
        className={`touch-target flex items-center justify-center gap-2 px-6 py-3 font-bold text-white uppercase rounded-xl text-lg tracking-wider border-2 border-white transition-all shadow-lg active:scale-95 ${
          debounceSeconds > 0
            ? "bg-stone-500 cursor-not-allowed opacity-80"
            : "bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 ring-4 ring-red-300"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="bg-white border-4 border-red-700 rounded-2xl max-w-lg w-full p-6 text-patient-text ner-gamusa-border-top shadow-2xl animate-in fade-in zoom-in-95">
            {!sentSuccess ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 text-red-700">
                    <div className="p-3 bg-red-100 rounded-full">
                      <ShieldAlert className="w-8 h-8 text-red-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-stone-900">{t("sos_confirm_title")}</h2>
                      <span className="text-xs font-bold uppercase tracking-wider text-red-700">Emergency Protocol</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundEffects.playTap();
                      setIsOpen(false);
                    }}
                    className="p-2 text-stone-400 hover:text-stone-700 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-lg mb-4 leading-relaxed text-stone-800 font-medium">
                  {t("sos_confirm_desc")}
                </p>

                {/* Contact destination card */}
                <div className="bg-stone-50 border-2 border-stone-200 rounded-xl p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PhoneCall className="w-5 h-5 text-red-700" />
                    <div>
                      <div className="text-xs text-stone-500 font-bold uppercase">Primary Emergency Contact</div>
                      <div className="text-base font-black text-stone-900">{emergencyName} ({emergencyContact})</div>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-red-100 text-red-900 px-2.5 py-1 rounded-full border border-red-200">
                    SMS & Portal
                  </span>
                </div>

                {/* GPS Location status */}
                <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-xl mb-6 text-sm flex items-start gap-2.5 text-amber-950 font-medium">
                  <MapPin className="w-5 h-5 flex-shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    {gettingLocation ? (
                      <span>Acquiring GPS coordinates for rescue dispatch...</span>
                    ) : gpsLocation ? (
                      <span>
                        Location ready: <strong className="font-mono">{gpsLocation.lat.toFixed(4)}° N, {gpsLocation.lng.toFixed(4)}° E</strong> (Will be included in dispatch).
                      </span>
                    ) : (
                      <span>GPS location optional. If unavailable, alert will dispatch immediately noting "location pending".</span>
                    )}
                  </div>
                </div>

                {/* Error Banner if any */}
                {errorMessage && (
                  <div className="bg-red-50 border-2 border-red-300 p-3 rounded-xl mb-4 text-sm text-red-900 font-bold">
                    {errorMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    data-testid="sos-cancel-btn"
                    onClick={() => {
                      soundEffects.playTap();
                      setIsOpen(false);
                    }}
                    disabled={isSending}
                    className="touch-target flex-1 py-4 px-6 border-2 border-stone-300 font-bold rounded-xl text-lg bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-900 transition-all"
                  >
                    {t("sos_cancel")}
                  </button>

                  <button
                    data-testid="sos-confirm-btn"
                    onClick={handleConfirmSOS}
                    disabled={isSending}
                    className="touch-target-lg flex-1 py-4 px-6 font-bold rounded-xl text-xl bg-red-700 hover:bg-red-800 active:scale-95 text-white flex items-center justify-center gap-2 ring-4 ring-red-200 shadow-lg transition-all"
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
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 mb-2">{t("sos_sent")}</h3>
                <p className="text-stone-700 text-base mb-3 leading-relaxed">
                  Alert dispatched to <strong>{smsStatus}</strong>. Stay calm, help has been notified.
                </p>
                <div className="inline-block bg-red-100 text-red-950 font-mono text-xs px-3 py-1 rounded-md border border-red-300 mb-4 font-bold">
                  [ SIMULATED SMS DISPATCH & AUDIT LOGGED — SIH26003 ]
                </div>
                <div className="inline-flex items-center gap-2 text-stone-600 bg-stone-100 px-4 py-2 rounded-xl text-sm">
                  <Clock className="w-4 h-4 text-stone-500" />
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

