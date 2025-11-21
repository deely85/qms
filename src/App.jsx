import React, { useState, useEffect, useRef } from "react";
import {
  LayoutGrid,
  Users,
  Monitor,
  Server,
  Database,
  Activity,
  Settings,
  Bell,
  History,
  Coffee,
  FileText,
  LogOut,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  QrCode,
  Volume2,
  ArrowLeft,
  Lock,
  Scan,
  Tv,
  WifiOff,
  Loader2,
  AlertTriangle,
  CloudOff,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  UserPlus,
  Edit,
  Trash2,
  Save,
  Smile,
  Meh,
  Frown,
  ShieldAlert,
  Signal,
  DatabaseZap,
  Edit2,
  XCircle,
  Filter,
  MousePointerClick,
  Star,
  ArrowRightLeft,
  RotateCcw,
  Calendar,
  Download,
  Printer,
  Ban,
  Stethoscope,
  Pill,
  User,
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// --- CONFIGURATION SECTION ---
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "AIzaSyDp2IP4dZ6UghkmZathzEpFnK3KkQPqijg",
        authDomain: "queue-management-system-b9b31.firebaseapp.com",
        projectId: "queue-management-system-b9b31",
        storageBucket: "queue-management-system-b9b31.firebasestorage.app",
        messagingSenderId: "229535630832",
        appId: "1:229535630832:web:195cce1f41c1514688c935",
        measurementId: "G-4XNQEW419Q",
      };

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "qms-demo-v1";

// --- Helper: Auto-Tailwind & Hide Sandbox UI ---
const useTailwindCDN = () => {
  useEffect(() => {
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }

    const style = document.createElement("style");
    style.innerHTML = `
      a[href*="codesandbox.io"], 
      #csb-feedback-root,
      iframe + a,
      div[class*="codesandbox"],
      a[class*="codesandbox"] {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
        z-index: -9999 !important;
        width: 0 !important;
        height: 0 !important;
        position: absolute !important;
        bottom: -9999px !important;
      }
      body, #root { min-height: 100vh; background-color: #f8fafc; }
    `;
    document.head.appendChild(style);
  }, []);
};

// --- Helper: Geo Distance ---
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- Initialize Firebase ---
let app, auth, db;
let globalMockMode = false;

try {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
    console.warn("Firebase config missing. Switching to Mock Mode.");
    globalMockMode = true;
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase init error:", e);
  globalMockMode = true;
}

// --- Data Constants ---
const INITIAL_SERVICES = [
  {
    id: "CS",
    name: "Pendaftaran / Pertanyaan",
    prefix: "A",
    avgTime: 5,
    icon: "User",
  },
  {
    id: "MED",
    name: "Rawatan / Doktor",
    prefix: "B",
    avgTime: 15,
    icon: "Stethoscope",
  },
  {
    id: "PHARM",
    name: "Farmasi / Ubat",
    prefix: "C",
    avgTime: 8,
    icon: "Pill",
  },
];

const COUNTERS_CONFIG = [
  { id: 1, name: "Kaunter 1" },
  { id: 2, name: "Kaunter 2" },
  { id: 3, name: "Kaunter 3" },
  { id: 4, name: "Kaunter 4" },
];

const DEFAULT_CONFIG = {
  startTime: "00:00",
  endTime: "23:59",
  geoEnabled: false,
  premiseLat: 3.1412,
  premiseLng: 101.6865,
  radius: 500,
};

// --- Utilities ---
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      880,
      audioCtx.currentTime + 0.1
    );
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.5
    );
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio error", e);
  }
};

const speakAnnouncement = (text) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const malayVoice =
      voices.find((v) => v.lang.includes("ms") || v.lang.includes("Malay")) ||
      voices.find((v) => v.lang.includes("id") || v.lang.includes("Indo"));
    if (malayVoice) {
      utterance.voice = malayVoice;
      utterance.lang = malayVoice.lang;
    } else {
      utterance.lang = "ms-MY";
    }
    window.speechSynthesis.speak(utterance);
  }
};

const translateStatus = (status) => {
  switch (status) {
    case "WAITING":
      return "MENUNGGU";
    case "SERVING":
      return "SEDANG DILAYAN";
    case "COMPLETED":
      return "SELESAI";
    case "NO_SHOW":
      return "TIDAK HADIR";
    default:
      return status;
  }
};

const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert("Tiada data untuk dieksport.");
    return;
  }
  const formattedData = data.map((row) => ({
    No_Tiket: row.number,
    Servis: row.service,
    Status: translateStatus(row.status),
    Masa_Masuk: row.timestamp,
    Tarikh_Data: row.raw_timestamp
      ? new Date(row.raw_timestamp).toLocaleDateString("ms-MY")
      : "-",
    Staf: row.staffName || "-",
    Rating: row.feedback || "N/A",
  }));

  const csvContent =
    "data:text/csv;charset=utf-8," +
    Object.keys(formattedData[0]).join(",") +
    "\n" +
    formattedData
      .map((row) =>
        Object.values(row)
          .map((v) => `"${v}"`)
          .join(",")
      )
      .join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- COMPONENTS ---

const ConnectionBadge = ({ isConnected, isOffline, syncStatus }) => {
  if (isOffline)
    return (
      <div className="fixed top-2 right-2 bg-yellow-500 text-white text-[10px] px-2 py-1 rounded-full shadow z-50 flex items-center gap-1">
        <CloudOff size={10} /> Demo Luar Talian
      </div>
    );
  if (syncStatus === "saving")
    return (
      <div className="fixed top-2 right-2 bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full shadow z-50 flex items-center gap-1">
        <Loader2 size={10} className="animate-spin" /> Menyimpan...
      </div>
    );
  if (syncStatus === "error")
    return (
      <div className="fixed top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full shadow z-50 flex items-center gap-1">
        <DatabaseZap size={10} /> Gagal Sinkron
      </div>
    );
  return (
    <div className="fixed top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-1 rounded-full shadow z-50 flex items-center gap-1">
      <CheckCircle2 size={10} /> Dalam Talian
    </div>
  );
};

const Sidebar = ({
  role,
  activeTab,
  onTabChange,
  onLogout,
  isOpen,
  toggleMenu,
  isOffline,
}) => {
  const menuItems =
    role === "admin"
      ? [
          { id: "dashboard", label: "Analitik Utama", icon: BarChart3 },
          { id: "users", label: "Pengguna & Akses", icon: Users },
          { id: "services", label: "Servis & Giliran", icon: Database },
          { id: "reports", label: "Laporan Lengkap", icon: FileText },
          { id: "settings", label: "Tetapan Operasi", icon: Settings },
        ]
      : [
          { id: "dashboard", label: "Kaunter", icon: Monitor },
          { id: "history", label: "Sejarah Tiket", icon: History },
          { id: "break", label: "Mod Rehat", icon: Coffee },
          { id: "profile", label: "Profil Saya", icon: UserCheck },
        ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMenu}
        ></div>
      )}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 flex flex-col shadow-xl flex-shrink-0`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl">
            <LayoutGrid className="text-blue-500" />
            <span>QMS Pro</span>
          </div>
          <button onClick={toggleMenu} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>
        {isOffline && (
          <div className="px-6 py-2">
            <div className="bg-yellow-500/20 text-yellow-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2 border border-yellow-500/30">
              <CloudOff size={14} /> Mod Luar Talian
            </div>
          </div>
        )}
        <div className="px-6 py-4">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 768) toggleMenu();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30 font-bold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white font-medium"
                }`}
              >
                <item.icon size={20} /> <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition font-medium"
          >
            <LogOut size={20} /> <span>Log Keluar</span>
          </button>
        </div>
      </div>
    </>
  );
};

const LoginView = ({
  onLogin,
  onBackToKiosk,
  onOpenTV,
  isConnecting,
  isOffline,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("staff");

  // MODIFIED: Pass data to parent for verification instead of immediate login
  const handleLogin = (e) => {
    e.preventDefault();
    if (username && password) {
      onLogin(username, password, selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
      <button
        onClick={onBackToKiosk}
        className="absolute top-4 left-4 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition"
      >
        <ArrowLeft size={18} /> Kembali ke Kiosk Pelanggan
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                Q
              </div>
              {isConnecting && !isOffline && (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Loader2 className="animate-spin" size={12} /> Menyambung...
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Log Masuk Staf
            </h1>
            {isOffline ? (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs flex items-start gap-2">
                <CloudOff size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Mod Luar Talian (Demo)</strong>
                  <p>Data disimpan secara lokal.</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 mt-2">
                Sila log masuk untuk mengakses papan pemuka.
              </p>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div className="flex bg-slate-100 p-1 rounded-lg mb-2">
              <button
                type="button"
                onClick={() => setSelectedRole("staff")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                  selectedRole === "staff"
                    ? "bg-white shadow text-blue-600"
                    : "text-slate-500"
                }`}
              >
                Staf
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                  selectedRole === "admin"
                    ? "bg-white shadow text-blue-600"
                    : "text-slate-500"
                }`}
              >
                Admin
              </button>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ID Pengguna"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kata Laluan"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <button
              disabled={isConnecting && !isOffline}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-70"
            >
              <Lock size={18} />{" "}
              {isConnecting && !isOffline ? "Menunggu..." : "Log Masuk"}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={onOpenTV}
              className="w-full py-3 px-2 border border-slate-200 text-white bg-slate-800 rounded-lg font-bold hover:bg-slate-700 transition flex flex-row justify-center items-center gap-2 text-xs shadow-sm"
            >
              <Tv size={18} /> Buka Paparan TV (Waiting Room)
            </button>
          </div>
        </div>
        <div className="bg-blue-600 p-12 hidden md:flex flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">
              Sistem Pengurusan Giliran
            </h2>
            <p className="text-blue-100 mb-4">
              Uruskan pelanggan dengan cekap dan pantas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MOBILE APP (KIOSK) ---
const MobileCustomerApp = ({
  onTakeNumber,
  onSubmitFeedback,
  myTicket,
  customerTicketId,
  onGoToLogin,
  onExit,
  isSubmitting,
  config,
  services,
}) => {
  const [activeService, setActiveService] = useState(null);
  const [phone, setPhone] = useState("");
  const [showServingPopup, setShowServingPopup] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [isCheckingGeo, setIsCheckingGeo] = useState(false);
  const prevStatusRef = useRef(myTicket?.status);

  useEffect(() => {
    if (myTicket && myTicket.status === "SERVING") {
      if (
        prevStatusRef.current !== "SERVING" ||
        myTicket.called_at !== prevStatusRef.current?.called_at
      ) {
        playNotificationSound();
        if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
        setShowServingPopup(true);
      }
    }

    if (
      myTicket &&
      myTicket.status === "COMPLETED" &&
      prevStatusRef.current !== "COMPLETED"
    ) {
      setShowServingPopup(false);
      setShowFeedbackPopup(true);
    }
    prevStatusRef.current = myTicket ? { ...myTicket } : null;
  }, [myTicket]);

  const checkOperatingHours = () => {
    if (!config || !config.startTime || !config.endTime) return true;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = config.startTime.split(":").map(Number);
    const [endH, endM] = config.endTime.split(":").map(Number);
    return (
      currentTime >= startH * 60 + startM && currentTime <= endH * 60 + endM
    );
  };

  const handleSelectService = (srv) => {
    if (!checkOperatingHours()) {
      alert(
        `Kaunter Tutup. Masa operasi: ${config.startTime} - ${config.endTime}`
      );
      return;
    }
    setActiveService(srv);
  };

  const handleSubmit = () => {
    setGeoError(null);
    if (config?.geoEnabled) {
      setIsCheckingGeo(true);
      if (!navigator.geolocation) {
        setGeoError("GPS tidak disokong.");
        setIsCheckingGeo(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const dist = getDistanceFromLatLonInMeters(
            position.coords.latitude,
            position.coords.longitude,
            config.premiseLat || DEFAULT_CONFIG.premiseLat,
            config.premiseLng || DEFAULT_CONFIG.premiseLng
          );
          setIsCheckingGeo(false);
          if (dist > (config.radius || DEFAULT_CONFIG.radius)) {
            setGeoError(
              `Luar kawasan (${Math.round(dist)}m). Sila hadir ke premis.`
            );
          } else {
            onTakeNumber(activeService, phone);
          }
        },
        (error) => {
          setIsCheckingGeo(false);
          setGeoError("Gagal lokasi. Sila aktifkan GPS.");
        }
      );
    } else {
      onTakeNumber(activeService, phone);
    }
  };

  const handleFeedback = (rating) => {
    onSubmitFeedback(myTicket.id, rating);
    setShowFeedbackPopup(false);
    alert("Terima kasih!");
    setActiveService(null);
    setPhone("");
    onExit();
  };

  const getServiceIcon = (iconName) => {
    switch (iconName) {
      case "Stethoscope":
        return <Stethoscope size={28} />;
      case "Pill":
        return <Pill size={28} />;
      default:
        return <User size={28} />;
    }
  };

  if (customerTicketId && !myTicket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Menjana Tiket...</h2>
        <p className="text-slate-500 mt-2">Menyimpan data...</p>
      </div>
    );
  }

  if (myTicket) {
    const isServing = myTicket.status === "SERVING";
    return (
      <div
        className={`min-h-screen flex flex-col ${
          isServing ? "bg-green-600" : "bg-slate-900"
        } transition-colors duration-500 relative`}
      >
        {showServingPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-50">
                <Bell size={40} className="text-green-600 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                GILIRAN ANDA!
              </h2>
              <p className="text-slate-600 mb-6">Sila ke kaunter sekarang.</p>
              <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                <span className="block text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
                  Sila Ke
                </span>
                <span className="text-4xl font-black text-blue-600">
                  KAUNTER {myTicket.servedBy}
                </span>
              </div>
              <button
                onClick={() => setShowServingPopup(false)}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-600/20 transition active:scale-95"
              >
                Saya Hadir
              </button>
            </div>
          </div>
        )}
        {showFeedbackPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Penilaian Servis
                </h2>
              </div>
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => handleFeedback(1)}
                  className="flex flex-col items-center gap-2 p-2 hover:scale-110 transition"
                >
                  <div className="text-4xl">😠</div>
                  <span className="text-xs font-bold text-red-500">Teruk</span>
                </button>
                <button
                  onClick={() => handleFeedback(3)}
                  className="flex flex-col items-center gap-2 p-2 hover:scale-110 transition"
                >
                  <div className="text-4xl">😐</div>
                  <span className="text-xs font-bold text-yellow-500">
                    Biasa
                  </span>
                </button>
                <button
                  onClick={() => handleFeedback(5)}
                  className="flex flex-col items-center gap-2 p-2 hover:scale-110 transition"
                >
                  <div className="text-4xl">😍</div>
                  <span className="text-xs font-bold text-green-500">
                    Puas Hati
                  </span>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackPopup(false);
                  setActiveService(null);
                  onExit();
                }}
                className="text-slate-400 text-sm hover:text-slate-600"
              >
                Abaikan
              </button>
            </div>
          </div>
        )}
        <div className="p-6 text-white flex justify-between items-center">
          <span className="font-bold text-lg">MyQueue</span>
          <button
            onClick={onExit}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20"
          >
            <LogOut size={18} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden">
            {isServing && (
              <div className="absolute top-0 left-0 w-full bg-green-500 text-white text-xs font-bold py-1 animate-pulse">
                SEDANG BERURUSAN
              </div>
            )}
            <p className="text-slate-500 mb-2 text-sm uppercase tracking-wider">
              Nombor Anda
            </p>
            <div
              className={`text-6xl font-black mb-4 ${
                isServing ? "text-green-600 scale-110" : "text-slate-800"
              } transition-transform duration-300`}
            >
              {myTicket.number}
            </div>
            <div className="border-t border-slate-100 my-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded ${
                    isServing
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {translateStatus(isServing ? "SERVING" : "WAITING")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Servis</span>
                <span className="font-bold text-slate-900">
                  {myTicket.service}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-blue-600 text-white p-6 pt-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10"></div>
        <div className="relative z-10 text-center">
          <button
            onClick={onGoToLogin}
            className="absolute top-0 right-0 p-2 text-blue-200 hover:text-white"
          >
            <Lock size={16} />
          </button>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
            <LayoutGrid size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 leading-tight">
            Selamat Datang ke
            <br />
            Klinik Kesihatan Labuan
          </h1>
          <p className="text-blue-100 text-xs font-medium max-w-[250px] mx-auto leading-relaxed opacity-90">
            Sila pilih perkhidmatan seperti dibawah untuk mendapatkan nombor
            giliran.
          </p>
        </div>
      </div>

      <main className="flex-1 px-6 pb-6 overflow-y-auto">
        {!checkOperatingHours() && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-3 shadow-sm">
            <Clock size={20} />{" "}
            <span>
              Kaunter Tutup ({config?.startTime} - {config?.endTime}).
            </span>
          </div>
        )}

        {!activeService ? (
          <div className="grid gap-4">
            {services.map((srv) => (
              <button
                key={srv.id}
                onClick={() => handleSelectService(srv)}
                className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all duration-300 flex items-center gap-5 text-left active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                  {getServiceIcon(srv.icon)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800 text-lg mb-0.5">
                    {srv.name}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> Anggaran menunggu:{" "}
                    <span className="font-bold text-blue-600">
                      {srv.avgTime} min
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:text-blue-500 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 mt-2">
            <button
              onClick={() => setActiveService(null)}
              className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft size={16} /> Kembali
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                {getServiceIcon(activeService.icon)}
              </div>
              <h3 className="font-bold text-xl text-slate-800">
                {activeService.name}
              </h3>
              <p className="text-sm text-slate-500">
                Masukkan nombor telefon untuk notifikasi.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                  No. Telefon (Pilihan)
                </label>
                <input
                  type="tel"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="01X-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {geoError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-3 border border-red-100">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />{" "}
                  {geoError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isCheckingGeo}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting || isCheckingGeo ? (
                  <Loader2 className="animate-spin" />
                ) : config?.geoEnabled ? (
                  "Semak Lokasi & Ambil Nombor"
                ) : (
                  "Dapatkan Nombor"
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <div className="p-4 text-center text-[10px] text-slate-400 font-medium">
        &copy; 2025 Klinik Kesihatan Labuan
      </div>
    </div>
  );
};

// --- 2. COUNTER DASHBOARD ---
const CounterView = ({
  user,
  tickets,
  onCallNext,
  onCallSpecific,
  onComplete,
  onRecall,
  onNoShow,
  onChangeCounter,
  onLogout,
  onUpdateProfile,
  isOffline,
  services,
}) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [serviceFilter, setServiceFilter] = useState("ALL");

  // DATE FILTER STATE
  const [historyDateFilter, setHistoryDateFilter] = useState({
    start: "",
    end: "",
  });

  const [editName, setEditName] = useState(user.name || "");
  const [editPassword, setEditPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const currentCounterId = user.counterId || 1;

  const myTicket = tickets.find(
    (t) => t.status === "SERVING" && t.servedBy === currentCounterId
  );
  const waitingCount = tickets.filter((t) => t.status === "WAITING").length;

  const filteredQueue = tickets.filter(
    (t) =>
      t.status === "WAITING" &&
      (serviceFilter === "ALL" || t.service === serviceFilter)
  );

  const handleSaveProfile = () => {
    onUpdateProfile({ ...user, name: editName, password: editPassword });
    setProfileSaved(true);
    setEditPassword("");
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // HISTORY LOGIC WITH DATE FILTER & DATE DISPLAY
  const counterHistory = tickets
    .filter(
      (t) =>
        (t.status === "COMPLETED" || t.status === "NO_SHOW") &&
        t.servedBy === currentCounterId
    )
    .filter((t) => {
      if (!historyDateFilter.start && !historyDateFilter.end) return true;
      const tDate = t.raw_timestamp ? new Date(t.raw_timestamp) : new Date();
      const start = historyDateFilter.start
        ? new Date(historyDateFilter.start).setHours(0, 0, 0, 0)
        : 0;
      const end = historyDateFilter.end
        ? new Date(historyDateFilter.end).setHours(23, 59, 59, 999)
        : 8640000000000000;
      return tDate >= start && tDate <= end;
    });

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleDateString("ms-MY");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      <Sidebar
        role="staff"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        isOpen={isMenuOpen}
        toggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        isOffline={isOffline}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center gap-4 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-slate-500"
            >
              <Menu />
            </button>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                isBreak ? "bg-yellow-500" : "bg-purple-600"
              }`}
            >
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-800">{user.name}</h1>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kaunter:
                </span>
                <select
                  className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded px-2 py-1 outline-none cursor-pointer hover:bg-slate-200 transition"
                  value={currentCounterId}
                  onChange={(e) => onChangeCounter(Number(e.target.value))}
                >
                  {COUNTERS_CONFIG.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {isBreak ? (
                  <span className="text-yellow-600 text-xs font-bold flex items-center gap-1 ml-2">
                    <Clock size={10} /> Rehat
                  </span>
                ) : (
                  <span className="text-green-600 text-xs font-bold flex items-center gap-1 ml-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>{" "}
                    Online
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold">
                Menunggu
              </div>
              <div className="text-xl font-black text-slate-800 leading-none">
                {waitingCount}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab === "dashboard" &&
            (isBreak ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Coffee size={64} className="mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-slate-600">
                  Anda Sedang Berehat
                </h2>
                <p className="mb-6">
                  Sila matikan mod rehat untuk menyambung tugas.
                </p>
                <button
                  onClick={() => setActiveTab("break")}
                  className="text-blue-600 underline"
                >
                  Tetapan Rehat
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden min-h-[400px]">
                    {myTicket ? (
                      <div className="text-center w-full max-w-md z-10">
                        <div className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold mb-8">
                          SEDANG DILAYANI
                        </div>
                        <div className="text-8xl font-black text-slate-900 mb-2 tracking-tighter">
                          {myTicket.number}
                        </div>
                        <div className="text-xl text-slate-500 mb-8">
                          {myTicket.service}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => onComplete(myTicket.id)}
                            className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-600/20 transition transform hover:-translate-y-1"
                          >
                            Selesai
                          </button>
                          <button
                            onClick={() => onRecall(myTicket.id)}
                            className="bg-white border-2 border-yellow-400 text-yellow-600 py-3 rounded-xl font-bold hover:bg-yellow-50 flex items-center justify-center gap-2"
                          >
                            <RotateCcw size={18} /> Panggil Semula
                          </button>
                          <button
                            onClick={() => onNoShow(myTicket.id)}
                            className="bg-white border-2 border-red-200 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-2"
                          >
                            <Ban size={18} /> Tidak Hadir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center z-10">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                          <Bell size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                          Kaunter {currentCounterId} Bersedia
                        </h2>
                        <button
                          onClick={() => onCallNext(currentCounterId)}
                          disabled={waitingCount === 0}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-600/30 transition transform hover:scale-105 flex items-center gap-3 mx-auto"
                        >
                          <Bell size={20} /> Panggil Seterusnya
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">
                        Senarai Giliran
                      </span>
                      <Settings size={16} className="text-slate-400" />
                    </div>
                    <div className="relative">
                      <select
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none"
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                      >
                        <option value="ALL">Semua Servis</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <Filter
                        size={14}
                        className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredQueue.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (window.confirm(`Panggil ${t.number} sekarang?`))
                            onCallSpecific(t.id, currentCounterId);
                        }}
                        className="p-3 rounded-lg border bg-white border-slate-100 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition group flex justify-between items-center"
                        title="Klik untuk panggil nombor ini"
                      >
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-2">
                            {t.number}
                            <MousePointerClick
                              size={14}
                              className="opacity-0 group-hover:opacity-100 text-blue-400"
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase">
                            {t.service}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                            MENUNGGU
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredQueue.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        Tiada giliran dalam kategori ini.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {activeTab === "history" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800">
                  Sejarah Tiket (Kaunter {currentCounterId})
                </h2>

                {/* HISTORY DATE FILTER */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-slate-400" />
                  <input
                    type="date"
                    className="border p-1 rounded text-slate-600"
                    value={historyDateFilter.start}
                    onChange={(e) =>
                      setHistoryDateFilter({
                        ...historyDateFilter,
                        start: e.target.value,
                      })
                    }
                  />
                  <span className="text-slate-300">-</span>
                  <input
                    type="date"
                    className="border p-1 rounded text-slate-600"
                    value={historyDateFilter.end}
                    onChange={(e) =>
                      setHistoryDateFilter({
                        ...historyDateFilter,
                        end: e.target.value,
                      })
                    }
                  />
                  {(historyDateFilter.start || historyDateFilter.end) && (
                    <button
                      onClick={() =>
                        setHistoryDateFilter({ start: "", end: "" })
                      }
                      className="text-red-500 text-xs font-bold hover:underline ml-2"
                    >
                      Set Semula
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium uppercase">
                    <tr>
                      <th className="px-6 py-3">No. Tiket</th>
                      <th className="px-6 py-3">Servis</th>
                      <th className="px-6 py-3">Tarikh & Masa</th>
                      <th className="px-6 py-3">Staf</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {counterHistory.map((t) => (
                      <tr key={t.id}>
                        <td className="px-6 py-4 font-bold">{t.number}</td>
                        <td className="px-6 py-4">{t.service}</td>
                        <td className="px-6 py-4 flex flex-col">
                          <span className="font-bold text-slate-700">
                            {formatDate(t.raw_timestamp)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {t.timestamp}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-600">
                          {t.staffName ? t.staffName.split(" ")[0] : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              t.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {t.status === "COMPLETED"
                              ? "Selesai"
                              : "Tidak Hadir"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {counterHistory.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-6 text-center text-slate-400"
                        >
                          Tiada sejarah untuk kaunter ini pada tarikh dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "break" && (
            <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  isBreak
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <Coffee size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Status: {isBreak ? "SEDANG REHAT" : "AKTIF"}
              </h2>
              <button
                onClick={() => setIsBreak(!isBreak)}
                className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                  isBreak
                    ? "bg-slate-800 text-white"
                    : "bg-yellow-500 text-white"
                }`}
              >
                {isBreak ? "Sambung Bertugas" : "Mula Rehat"}
              </button>
            </div>
          )}
          {activeTab === "profile" && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-blue-600 p-8 text-white text-center">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="opacity-80">{user.role.toUpperCase()}</p>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tukar Kata Laluan
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <button
                    onClick={handleSaveProfile}
                    className="bg-blue-600 text-white w-full py-3 rounded-lg font-bold"
                  >
                    Simpan Profil
                  </button>
                  {profileSaved && (
                    <p className="text-green-600 text-sm mt-2">
                      Berjaya dikemaskini.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// --- WAITING ROOM & ADMIN VIEWS (Shortened for brevity as logic is mostly display) ---
const WaitingRoomView = ({ tickets, lastCalled, onExit }) => {
  const prevCallRef = useRef(null);

  useEffect(() => {
    if (lastCalled) {
      const isNewCall =
        !prevCallRef.current ||
        lastCalled.id !== prevCallRef.current.id ||
        lastCalled.called_at !== prevCallRef.current.called_at;

      if (isNewCall) {
        // FORMAT SEBUTAN: "Nombor, A, 1, 0, 0, 1, Sila ke Kaunter 1"
        const ticketSpaced = lastCalled.number.split("").join(", ");
        const text = `Nombor, ${ticketSpaced}, Sila ke Kaunter ${lastCalled.servedBy}`;
        speakAnnouncement(text);
        prevCallRef.current = lastCalled;
      }
    }
  }, [lastCalled]);

  const waitingTickets = tickets.filter((t) => t.status === "WAITING");
  const servingTickets = tickets.filter((t) => t.status === "SERVING");
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 flex flex-col font-sans">
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <LayoutGrid className="text-blue-500" size={32} />
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
            Ruang Menunggu Utama
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => speakAnnouncement("Ujian Suara, Satu, Dua, Tiga")}
            className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-400 flex items-center gap-2 text-xs"
          >
            <Volume2 size={16} /> Uji Audio
          </button>
          <button
            onClick={onExit}
            className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
      </header>
      <div className="flex flex-col md:flex-row flex-1 gap-6 overflow-hidden">
        <div className="w-full md:w-8/12 flex flex-col gap-4">
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl p-8 flex flex-col items-center justify-center flex-[2] shadow-2xl shadow-blue-900/50 relative overflow-hidden">
            <h2 className="text-2xl md:text-3xl font-medium text-blue-200 mb-4">
              GILIRAN SEKARANG
            </h2>
            <div className="text-[6rem] md:text-[10rem] font-black tracking-tighter leading-none mb-6 relative z-10 drop-shadow-xl">
              {lastCalled ? lastCalled.number : "----"}
            </div>
            <div className="bg-white text-blue-900 px-10 py-4 rounded-2xl shadow-lg relative z-10 animate-bounce-slow w-full max-w-md text-center">
              <span className="text-sm font-bold text-slate-500 block uppercase tracking-widest mb-1">
                SILA KE
              </span>
              <span className="text-3xl md:text-5xl font-black">
                {lastCalled ? `KAUNTER ${lastCalled.servedBy}` : "SILA TUNGGU"}
              </span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            {servingTickets
              .filter((t) => t.id !== lastCalled?.id)
              .slice(0, 3)
              .map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-700"
                >
                  <span className="text-4xl font-bold text-white mb-1">
                    {t.number}
                  </span>
                  <span className="text-xs text-green-400 font-bold">
                    KAUNTER {t.servedBy}
                  </span>
                </div>
              ))}
          </div>
        </div>
        <div className="w-full md:w-4/12 flex flex-col gap-4">
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2 sticky top-0 bg-slate-800 pb-2 border-b border-slate-700 z-10">
              <Users className="text-yellow-500" /> Giliran Seterusnya
            </h3>
            <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2">
              {waitingTickets.length > 0 ? (
                waitingTickets.slice(0, 6).map((t, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-700/50 p-4 rounded-xl border-l-4 border-yellow-500 flex justify-between items-center"
                  >
                    <span className="text-3xl font-bold text-white tracking-wider">
                      {t.number}
                    </span>
                    <span className="text-xs font-bold bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase">
                      {t.service}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-10 italic">
                  Tiada giliran menunggu.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminAnalyticsView = ({
  tickets,
  users,
  config,
  services,
  onUpdateConfig,
  onAddUser,
  onDeleteUser,
  onAddService,
  onDeleteService,
  onUpdateService,
  onExit,
  isOffline,
}) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    role: "staff",
    password: "",
  });
  const [newService, setNewService] = useState({
    name: "",
    prefix: "",
    avgTime: "",
  });
  const [localConfig, setLocalConfig] = useState(config || DEFAULT_CONFIG);
  const [configSaved, setConfigSaved] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  const handleSaveConfig = () => {
    onUpdateConfig(localConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };
  const handleAddUserSubmit = () => {
    if (newUser.name && newUser.password) {
      onAddUser(newUser);
      setNewUser({ name: "", role: "staff", password: "" });
    } else {
      alert("Sila isi nama dan kata laluan.");
    }
  };

  // --- FIXED FUNCTION NAME ---
  const handleServiceSubmit = () => {
    if (!serviceForm.name || !serviceForm.prefix) {
      alert("Sila isi Nama Servis dan Prefix.");
      return;
    }
    if (isEditingService) {
      onUpdateService(serviceForm);
    } else {
      onAddService({ ...serviceForm, id: serviceForm.prefix + Date.now() });
    }
    setServiceForm({ id: null, name: "", prefix: "", avgTime: "" });
  };

  // Service Form State
  const [serviceForm, setServiceForm] = useState({
    id: null,
    name: "",
    prefix: "",
    avgTime: "",
  });
  const isEditingService = !!serviceForm.id;

  const startEditService = (srv) => {
    setServiceForm(srv);
  };
  const cancelEditService = () => {
    setServiceForm({ id: null, name: "", prefix: "", avgTime: "" });
  };

  // --- DATE FILTER LOGIC ---
  const filterTicketsByDate = (allTickets) => {
    if (!dateFilter.start || !dateFilter.end) return allTickets;
    const start = new Date(dateFilter.start).setHours(0, 0, 0, 0);
    const end = new Date(dateFilter.end).setHours(23, 59, 59, 999);
    return allTickets.filter((t) => {
      const tDate = t.raw_timestamp ? new Date(t.raw_timestamp) : new Date();
      return tDate >= start && tDate <= end;
    });
  };

  const filteredTickets = filterTicketsByDate(tickets);

  // ANALYTICS LOGIC
  const ratedTickets = filteredTickets.filter((t) => t.feedback);
  const noShowTickets = filteredTickets.filter((t) => t.status === "NO_SHOW");
  const avgRating =
    ratedTickets.length > 0
      ? (
          ratedTickets.reduce((acc, t) => acc + t.feedback, 0) /
          ratedTickets.length
        ).toFixed(1)
      : 0;

  const counterRatings = {};
  ratedTickets.forEach((t) => {
    const counter = t.servedBy || "Unknown";
    if (!counterRatings[counter])
      counterRatings[counter] = { sum: 0, count: 0 };
    counterRatings[counter].sum += t.feedback;
    counterRatings[counter].count += 1;
  });

  const ratingCounts = { 5: 0, 3: 0, 1: 0 };
  ratedTickets.forEach((t) => {
    if (ratingCounts[t.feedback] !== undefined) ratingCounts[t.feedback]++;
  });

  // Peak Hour Logic
  const hours = new Array(24).fill(0);
  filteredTickets.forEach((t) => {
    if (t.raw_timestamp) {
      const h = new Date(t.raw_timestamp).getHours();
      hours[h]++;
    }
  });
  const maxHourCount = Math.max(...hours) || 1;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      <Sidebar
        role="admin"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onExit}
        isOpen={isMenuOpen}
        toggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        isOffline={isOffline}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-slate-500"
            >
              <Menu />
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Panel Admin</h1>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
          {/* DATE FILTER BAR */}
          {(activeTab === "dashboard" || activeTab === "reports") && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Calendar size={18} /> Penapis Tarikh
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="border p-2 rounded text-sm"
                  value={dateFilter.start}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, start: e.target.value })
                  }
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  className="border p-2 rounded text-sm"
                  value={dateFilter.end}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, end: e.target.value })
                  }
                />
                {(dateFilter.start || dateFilter.end) && (
                  <button
                    onClick={() => setDateFilter({ start: "", end: "" })}
                    className="text-red-500 text-xs font-bold hover:underline"
                  >
                    Set Semula
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">
                    Jumlah Tiket
                  </h3>
                  <div className="text-4xl font-bold text-blue-600">
                    {filteredTickets.length}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">
                    Selesai
                  </h3>
                  <div className="text-4xl font-bold text-green-600">
                    {
                      filteredTickets.filter((t) => t.status === "COMPLETED")
                        .length
                    }
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">
                    Menunggu
                  </h3>
                  <div className="text-4xl font-bold text-yellow-500">
                    {
                      filteredTickets.filter((t) => t.status === "WAITING")
                        .length
                    }
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RATING */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Star size={20} className="text-yellow-500" /> Kepuasan
                    Keseluruhan
                  </h2>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-6xl font-black text-slate-800 mb-2">
                        {avgRating}
                      </div>
                      <div className="flex gap-1 text-yellow-500 justify-center">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={20}
                            fill={
                              i <= Math.round(avgRating)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        {ratedTickets.length} Penilaian
                      </p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 3, 1].map((star) => (
                        <div key={star} className="flex items-center text-xs">
                          <span className="w-12 font-bold">{star} Bintang</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full mx-2">
                            <div
                              className={`h-2 rounded-full ${
                                star === 5
                                  ? "bg-green-500"
                                  : star === 3
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${
                                  (ratingCounts[star] / ratedTickets.length ||
                                    0) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="w-6 text-right">
                            {ratingCounts[star]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* PEAK HOUR */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-500" /> Analitik
                    Waktu Puncak
                  </h2>
                  <div className="h-32 flex items-end gap-1">
                    {hours.slice(8, 18).map((count, i) => {
                      const height = (count / maxHourCount) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${i + 8}:00 - ${count} tiket`}
                        ></div>
                      );
                    })}
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-4">
                    Data dipaparkan dari 08:00 hingga 17:00
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* UPDATED REPORTS TAB - FULL RESTORE */}
          {activeTab === "reports" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold">
                    Jumlah Tiket
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredTickets.length}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold">
                    Selesai
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      filteredTickets.filter((t) => t.status === "COMPLETED")
                        .length
                    }
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold">
                    Tidak Hadir
                  </p>
                  <p className="text-2xl font-bold text-red-500">
                    {noShowTickets.length}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold">
                    Purata Rating
                  </p>
                  <p className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                    <Star size={18} fill="currentColor" /> {avgRating}
                  </p>
                </div>
              </div>

              {/* Service Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg">Ringkasan Servis</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded text-xs font-bold hover:bg-slate-200"
                    >
                      <Printer size={14} /> PDF
                    </button>
                    <button
                      onClick={() =>
                        downloadCSV(filteredTickets, "laporan_qms.csv")
                      }
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                    >
                      <Download size={14} /> Excel
                    </button>
                  </div>
                </div>
                <table className="w-full text-sm text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
                    <tr>
                      <th className="p-3 border">Servis</th>
                      <th className="p-3 border">Jumlah</th>
                      <th className="p-3 border">Selesai</th>
                      <th className="p-3 border">No Show</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((srv) => {
                      const srvTickets = filteredTickets.filter(
                        (t) => t.service === srv.name
                      );
                      return (
                        <tr key={srv.id}>
                          <td className="p-3 border font-bold">{srv.name}</td>
                          <td className="p-3 border">{srvTickets.length}</td>
                          <td className="p-3 border text-green-600 font-bold">
                            {
                              srvTickets.filter((t) => t.status === "COMPLETED")
                                .length
                            }
                          </td>
                          <td className="p-3 border text-red-500">
                            {
                              srvTickets.filter((t) => t.status === "NO_SHOW")
                                .length
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Feedback List */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
                <h2 className="font-bold text-lg mb-4">
                  Rekod Penilaian Pelanggan
                </h2>
                <div className="max-h-64 overflow-y-auto border rounded">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="p-3">Tiket</th>
                        <th className="p-3">Servis</th>
                        <th className="p-3">Kaunter</th>
                        <th className="p-3">Rating</th>
                        <th className="p-3">Tarikh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ratedTickets.map((t) => (
                        <tr key={t.id}>
                          <td className="p-3 font-bold">{t.number}</td>
                          <td className="p-3">{t.service}</td>
                          <td className="p-3">K{t.servedBy}</td>
                          <td className="p-3 text-yellow-500 font-bold flex items-center gap-1">
                            <Star size={12} fill="currentColor" />
                            {t.feedback}
                          </td>
                          <td className="p-3 text-slate-500 text-xs">
                            {new Date(t.raw_timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {ratedTickets.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-4 text-center text-slate-400"
                          >
                            Tiada penilaian direkodkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* No Show List */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
                <h2 className="font-bold text-lg mb-4 text-red-600">
                  Rekod Tidak Hadir (No Show)
                </h2>
                <div className="max-h-64 overflow-y-auto border rounded">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="p-3">Tiket</th>
                        <th className="p-3">Servis</th>
                        <th className="p-3">Kaunter Panggil</th>
                        <th className="p-3">Masa Panggil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {noShowTickets.map((t) => (
                        <tr key={t.id}>
                          <td className="p-3 font-bold">{t.number}</td>
                          <td className="p-3">{t.service}</td>
                          <td className="p-3">K{t.servedBy}</td>
                          <td className="p-3 text-slate-500 text-xs">
                            {t.called_at
                              ? new Date(t.called_at).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                      {noShowTickets.length === 0 && (
                        <tr>
                          <td
                            colSpan="4"
                            className="p-4 text-center text-slate-400"
                          >
                            Tiada rekod No Show.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ... other admin tabs ... */}
          {activeTab === "users" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Users size={20} /> Pengurusan Pengguna
              </h2>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Nama
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Katalaluan
                  </label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Peranan
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                  >
                    <option value="staff">Staf</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={handleAddUserSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full flex items-center gap-2 justify-center"
                >
                  <UserPlus size={16} /> Tambah
                </button>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">Nama</th>
                    <th className="p-3">Peranan</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.role}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "services" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Database size={20} /> Pengurusan Servis
              </h2>
              <div
                className={`p-4 rounded-lg border mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end ${
                  isEditingService
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Nama Servis
                  </label>
                  <input
                    className="w-full p-2 border rounded"
                    value={serviceForm.name}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Prefix
                  </label>
                  <input
                    className="w-full p-2 border rounded"
                    value={serviceForm.prefix}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, prefix: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Masa (Min)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={serviceForm.avgTime}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        avgTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleServiceSubmit}
                    className={`flex-1 px-4 py-2 rounded font-bold text-white ${
                      isEditingService
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isEditingService ? "Kemaskini" : "+ Tambah"}
                  </button>
                  {isEditingService && (
                    <button
                      onClick={cancelEditService}
                      className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-4">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-100 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {srv.prefix}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          {srv.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Masa: {srv.avgTime} min
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditService(srv)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDeleteService(srv.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "settings" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Settings size={20} /> Tetapan Operasi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 border-b pb-2">
                    Waktu Operasi
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Mula
                      </label>
                      <input
                        type="time"
                        className="w-full p-2 border rounded"
                        value={localConfig.startTime}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Tamat
                      </label>
                      <input
                        type="time"
                        className="w-full p-2 border rounded"
                        value={localConfig.endTime}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            endTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 border-b pb-2">
                    Kawalan Lokasi
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={localConfig.geoEnabled}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          geoEnabled: e.target.checked,
                        })
                      }
                    />
                    <label className="text-sm font-medium">Aktifkan GPS</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="w-full p-2 border rounded"
                        value={localConfig.premiseLat}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            premiseLat: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="w-full p-2 border rounded"
                        value={localConfig.premiseLng}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            premiseLng: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Radius (Meter)
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={localConfig.radius}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            radius: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
                >
                  Simpan Tetapan
                </button>
              </div>
              {configSaved && (
                <p className="text-green-600 text-sm mt-2 text-right font-bold">
                  Tetapan disimpan!
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// --- MAIN CONTROLLER ---
export default function QMSApp() {
  useTailwindCDN();
  const [view, setView] = useState("MOBILE"); // START IN KIOSK MODE
  const [user, setUser] = useState(null);
  const [customerTicketId, setCustomerTicketId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [tempTicket, setTempTicket] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [lastCalled, setLastCalled] = useState(null);
  const [isConnecting, setIsConnecting] = useState(!globalMockMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState("connected");
  const [useMock, setUseMock] = useState(globalMockMode);

  const isOffline = useMock;

  // --- DEFINE HANDLERS BEFORE USE ---
  const handleGoToLogin = () => {
    setView("LOGIN");
  };
  const handleBackToKiosk = () => {
    setCustomerTicketId(null);
    setTempTicket(null);
    setView("MOBILE");
  };

  // --- SECURE LOGIN HANDLER ---
  const handleLogin = (username, password, role) => {
    // 1. Check against Hardcoded Master Key (Fallback if DB empty)
    if (username === "admin" && password === "admin123") {
      setUser({ name: "System Admin", role: "admin", id: "master" });
      setView("ADMIN");
      return;
    }

    // 2. Check against Database Users
    const validUser = usersList.find(
      (u) =>
        u.name.toLowerCase() === username.toLowerCase() &&
        u.password === password && // In real app, use hashing!
        u.role === role
    );

    if (validUser) {
      setUser(validUser);
      setView(role === "admin" ? "ADMIN" : "COUNTER");
    } else {
      alert(
        "Log Masuk Gagal! Sila periksa Nama, Kata Laluan dan Peranan anda."
      );
    }
  };

  useEffect(() => {
    if (useMock || !auth) {
      setIsConnecting(false);
      return;
    }
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth Error:", error);
        setIsConnecting(false);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) setIsConnecting(false);
    });
    return () => unsubscribeAuth();
  }, [useMock]);

  useEffect(() => {
    if (useMock) {
      if (servicesList.length === 0) setServicesList(INITIAL_SERVICES);
      return;
    }
    if (!db) return;

    const unsubTickets = onSnapshot(
      collection(db, "qms_tickets"),
      (snapshot) => {
        const fetchedTickets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        fetchedTickets.sort(
          (a, b) => (a.raw_timestamp || 0) - (b.raw_timestamp || 0)
        );
        setTickets(fetchedTickets);
      },
      (error) => setSyncStatus("error")
    );

    const unsubUsers = onSnapshot(
      collection(db, "qms_users"),
      (snapshot) => {
        const fetchedUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsersList(fetchedUsers);
      },
      (error) => {}
    );

    const unsubServices = onSnapshot(
      collection(db, "qms_services"),
      (snapshot) => {
        if (!snapshot.empty) {
          const fetchedServices = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setServicesList(fetchedServices);
        } else {
          setServicesList([]);
        }
      },
      (error) => {}
    );

    const unsubConfig = onSnapshot(
      doc(db, "qms_config", "settings"),
      (doc) => {
        if (doc.exists()) {
          setConfig(doc.data());
        }
      },
      (error) => {}
    );

    return () => {
      unsubTickets();
      unsubUsers();
      unsubConfig();
      unsubServices();
    };
  }, [isConnecting, useMock]);

  useEffect(() => {
    const serving = tickets.filter((t) => t.status === "SERVING");
    if (serving.length > 0) {
      serving.sort((a, b) => (a.called_at || 0) - (b.called_at || 0));
      setLastCalled(serving[serving.length - 1]);
    } else {
      setLastCalled(null);
    }
  }, [tickets]);

  const handleQRScan = () => {
    setView("MOBILE");
  };
  const handleOpenTV = () => {
    setView("WAITING");
  };
  const handleSwitchToMock = () => {
    setUseMock(true);
    window.location.reload();
  };

  const handleTakeNumber = async (service, phone) => {
    setIsSubmitting(true);
    setSyncStatus("saving");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTickets = tickets.filter(
      (t) =>
        t.number.startsWith(service.prefix) &&
        t.raw_timestamp >= todayStart.getTime()
    );

    let maxNum = 1000;
    if (todayTickets.length > 0) {
      const numbers = todayTickets.map((t) => {
        const match = t.number.match(/\d+/);
        return match ? parseInt(match[0]) : 1000;
      });
      maxNum = Math.max(...numbers);
      if (isNaN(maxNum)) maxNum = 1000;
    }
    const nextNum = maxNum + 1;
    const newNumber = `${service.prefix}${nextNum}`;

    const newTicketData = {
      number: newNumber,
      service: service.name,
      status: "WAITING",
      phone: phone,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      raw_timestamp: Date.now(),
      servedBy: null,
      feedback: null,
    };

    const tempId = "temp-" + Date.now();
    const optimisticTicket = { ...newTicketData, id: tempId };
    setTempTicket(optimisticTicket);
    setCustomerTicketId(tempId);

    if (useMock) {
      setTickets((prev) => [...prev, optimisticTicket]);
      await new Promise((r) => setTimeout(r, 500));
      setSyncStatus("connected");
    } else if (db) {
      try {
        const docRef = await addDoc(
          collection(db, "qms_tickets"),
          newTicketData
        );
        setTempTicket({ ...optimisticTicket, id: docRef.id });
        setCustomerTicketId(docRef.id);
        setSyncStatus("connected");
      } catch (e) {
        console.error(e);
        setSyncStatus("error");
        alert("Ralat Simpan Data");
      }
    }
    setIsSubmitting(false);
  };

  const handleCallSpecific = async (ticketId, counterId) => {
    const staffName = user?.name || "Staf";
    if (useMock) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: "SERVING",
                servedBy: counterId,
                staffName: staffName,
                called_at: Date.now(),
              }
            : t
        )
      );
    } else if (db) {
      await updateDoc(doc(db, "qms_tickets", ticketId), {
        status: "SERVING",
        servedBy: counterId,
        staffName: staffName,
        called_at: Date.now(),
      });
    }
  };

  const handleRecall = async (ticketId) => {
    if (useMock) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, called_at: Date.now() } : t
        )
      );
    } else if (db) {
      await updateDoc(doc(db, "qms_tickets", ticketId), {
        called_at: Date.now(),
      });
    }
  };

  const handleNoShow = async (ticketId) => {
    if (useMock) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: "NO_SHOW", completed_at: Date.now() }
            : t
        )
      );
    } else if (db) {
      await updateDoc(doc(db, "qms_tickets", ticketId), {
        status: "NO_SHOW",
        completed_at: Date.now(),
      });
    }
  };

  const handleCallNext = async (counterId) => {
    const nextTicket = tickets.find((t) => t.status === "WAITING");
    if (nextTicket) {
      handleCallSpecific(nextTicket.id, counterId);
    }
  };
  const handleComplete = async (ticketId) => {
    if (useMock) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: "COMPLETED", completed_at: Date.now() }
            : t
        )
      );
    } else if (db) {
      await updateDoc(doc(db, "qms_tickets", ticketId), {
        status: "COMPLETED",
        completed_at: Date.now(),
      });
    }
  };
  const handleSubmitFeedback = async (ticketId, rating) => {
    if (db && !useMock) {
      await updateDoc(doc(db, "qms_tickets", ticketId), { feedback: rating });
    }
  };
  const handleUpdateConfig = async (newConfig) => {
    if (useMock) {
      setConfig(newConfig);
    } else if (db) {
      await setDoc(doc(db, "qms_config", "settings"), newConfig);
    }
  };
  const handleAddUser = async (newUser) => {
    if (useMock) {
      setUsersList((prev) => [
        ...prev,
        { ...newUser, id: Date.now().toString() },
      ]);
    } else if (db) {
      await addDoc(collection(db, "qms_users"), newUser);
    }
  };
  const handleDeleteUser = async (userId) => {
    if (useMock) {
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    } else if (db) {
      await deleteDoc(doc(db, "qms_users", userId));
    }
  };

  const handleAddService = async (newService) => {
    if (useMock) {
      setServicesList((prev) => [...prev, newService]);
    } else if (db) {
      await addDoc(collection(db, "qms_services"), newService);
    }
  };

  const handleUpdateService = async (updatedService) => {
    if (useMock) {
      setServicesList((prev) =>
        prev.map((s) => (s.id === updatedService.id ? updatedService : s))
      );
    } else if (db) {
      const { id, ...data } = updatedService;
      try {
        await setDoc(doc(db, "qms_services", id), data, { merge: true });
      } catch (e) {
        console.error("Update Service Error:", e);
        alert("Gagal mengemaskini: " + e.message);
      }
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (useMock) {
      setServicesList((prev) => prev.filter((s) => s.id !== serviceId));
    } else if (db) {
      try {
        await deleteDoc(doc(db, "qms_services", serviceId));
      } catch (e) {
        console.error("Delete Error:", e);
      }
    }
  };

  const handleUpdateProfile = async (updatedUser) => {
    setUser(updatedUser);
  };
  const handleChangeCounter = (newId) => {
    setUser((prev) => ({ ...prev, counterId: newId }));
  };
  const handleLogout = () => {
    setUser(null);
    setCustomerTicketId(null);
    setView("LOGIN");
  };

  if (view === "LOGIN")
    return (
      <LoginView
        onLogin={handleLogin}
        onScanQR={handleQRScan}
        onOpenTV={handleOpenTV}
        isConnecting={isConnecting}
        isOffline={isOffline}
        onBackToKiosk={handleBackToKiosk}
      />
    );
  if (view === "MOBILE") {
    const dbTicket = tickets.find((t) => t.id === customerTicketId);
    const myTicket =
      dbTicket ||
      (tempTicket && tempTicket.id === customerTicketId ? tempTicket : null);

    // Use real service list if available, fallback to Initial if empty (prevents blank screen)
    const displayServices =
      servicesList.length > 0
        ? servicesList
        : isOffline
        ? INITIAL_SERVICES
        : [];

    return (
      <MobileCustomerApp
        onTakeNumber={handleTakeNumber}
        onSubmitFeedback={handleSubmitFeedback}
        myTicket={myTicket}
        customerTicketId={customerTicketId}
        onGoToLogin={handleGoToLogin}
        onExit={handleBackToKiosk}
        isSubmitting={isSubmitting}
        config={config}
        services={displayServices}
      />
    );
  }

  return (
    <>
      <ConnectionBadge
        isConnected={!isConnecting}
        isOffline={isOffline}
        syncStatus={syncStatus}
      />
      {view === "COUNTER" && (
        <CounterView
          user={user}
          tickets={tickets}
          onCallNext={handleCallNext}
          onCallSpecific={handleCallSpecific}
          onComplete={handleComplete}
          onRecall={handleRecall}
          onNoShow={handleNoShow}
          onChangeCounter={handleChangeCounter}
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateProfile}
          isOffline={isOffline}
          services={servicesList}
        />
      )}
      {view === "WAITING" && (
        <WaitingRoomView
          tickets={tickets}
          lastCalled={lastCalled}
          onExit={handleLogout}
        />
      )}
      {view === "ADMIN" && (
        <AdminAnalyticsView
          tickets={tickets}
          users={usersList}
          services={servicesList}
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
          onAddService={handleAddService}
          onUpdateService={handleUpdateService}
          onDeleteService={handleDeleteService}
          onExit={handleLogout}
          isOffline={isOffline}
        />
      )}
    </>
  );
}
