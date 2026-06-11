import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "../../firebase/authClient";
import { auth } from "../../firebase/config";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Download, Trash2, Settings, Camera, User, Briefcase, MapPin, Calendar } from "lucide-react";
import TopNav from "../../components/TopNav";
import Modal from "../../components/Modal";
import ProfileAvatar, {
  PROFILE_AVATAR_OPTIONS,
  type ProfileAvatarChoice,
} from "../../components/ProfileAvatar";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

const PAYSLIP_PROFILE_CACHE_KEY = "zoar.payslipProfileFields";
const ALLOWED_AVATAR_CHOICES: ProfileAvatarChoice[] = ["initial", "photo1", "photo2", "photo3", "photo5"];

const normalizeAvatarChoice = (value: unknown): ProfileAvatarChoice => {
  if (typeof value !== "string") return "initial";
  const normalized = value.trim().toLowerCase() as ProfileAvatarChoice;
  return ALLOWED_AVATAR_CHOICES.includes(normalized) ? normalized : "initial";
};

const clearClientUserData = () => {
  const localPrefixes = ["zoar.", "zoar:", "learn_read_topics_", "badge_shown_level_", "dashboard_tip_seen_"];
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key === PAYSLIP_PROFILE_CACHE_KEY || localPrefixes.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch { /* ignore */ }
  try {
    window.sessionStorage.removeItem("zoar.onboarding.activeStepNumber");
  } catch { /* ignore */ }
};

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start gap-3 py-3 border-b border-purple-100 last:border-0">
    <div className="mt-0.5 w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-purple-600" />
    </div>
    <div>
      <p className="text-xs text-purple-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-purple-900">{value || "Not set"}</p>
    </div>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, token, loading, setProfile, refreshProfile } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarHovering, setAvatarHovering] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [selectedAvatarChoice, setSelectedAvatarChoice] = useState<ProfileAvatarChoice>("initial");
  const { isOpen: isOnboardingOpen, activeStepNumber, steps: onboardingSteps, closeGuide, completeGuide, goToStep } = usePageOnboarding("/profile");

  useEffect(() => {
    if (loading || !token) return;
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        setUserData(res.data);
        try {
          localStorage.setItem(PAYSLIP_PROFILE_CACHE_KEY, JSON.stringify({
            jobTitle: typeof res.data?.payslipData?.jobTitle === "string" ? res.data.payslipData.jobTitle.trim() : "",
            location: typeof res.data?.payslipData?.location === "string" ? res.data.payslipData.location.trim() : "",
          }));
        } catch { /* ignore */ }
        setLoadingData(false);
      } catch (err) {
        setError("Failed to load profile data");
        setLoadingData(false);
      }
    };
    fetchUserData();
  }, [token, loading]);

  useEffect(() => {
    setSelectedAvatarChoice(normalizeAvatarChoice(userData?.avatarChoice));
  }, [userData?.avatarChoice]);

  const openAvatarPicker = () => {
    setSelectedAvatarChoice(normalizeAvatarChoice(userData?.avatarChoice));
    setAvatarPickerOpen(true);
  };
  const closeAvatarPicker = () => {
    if (avatarSaving) return;
    setAvatarPickerOpen(false);
    setSelectedAvatarChoice(normalizeAvatarChoice(userData?.avatarChoice));
  };

  const handleSaveAvatar = async () => {
    if (!token) return;
    setAvatarSaving(true);
    try {
      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, { avatarChoice: selectedAvatarChoice }, { headers: { Authorization: `Bearer ${token}` } });
      setUserData(response.data);
      setProfile((previous) => ({ ...(previous || {}), avatarChoice: selectedAvatarChoice }));
      await refreshProfile(token);
      setAvatarPickerOpen(false);
    } catch {
      setError("Failed to update profile photo");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/export-data`, { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "my-data.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm("Deleting your account is irreversible. This will permanently remove your profile and associated data, including monthly snapshots and newsletter subscriptions.")) return;
    setDeleting(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      clearClientUserData();
      await signOut(auth);
      navigate("/");
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || "Failed to delete profile" : "Failed to delete profile";
      setError(message);
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      navigate("/", { replace: true });
    } catch {
      setError("Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-purple-300 border-t-purple-600 animate-spin" />
          <p className="text-purple-500 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate("/dashboard")} variant="secondary">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50" style={{ fontFamily: "Manrope, Segoe UI, Arial, sans-serif" }}>
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
              {error}
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">x</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div data-onboarding="profile-heading" className="text-center mb-8">
          <h1 className="text-4xl font-light tracking-widest text-purple-700 mb-1">PROFILE</h1>
          <p className="text-sm text-purple-400">Manage your account and payslip details</p>
        </div>

        <div className="space-y-4">
          {/* User info card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
            <div className="p-5 flex items-start gap-4 border-b border-purple-100">
              {/* Avatar */}
              <div className="relative shrink-0">
                <button type="button" aria-label="Change profile photo" onClick={openAvatarPicker}
                  onMouseEnter={() => setAvatarHovering(true)} onMouseLeave={() => setAvatarHovering(false)}
                  className="relative w-20 h-20 rounded-full overflow-hidden block cursor-pointer border-2 border-purple-200 hover:border-purple-500 transition-colors">
                  <ProfileAvatar size={80} avatarChoice={normalizeAvatarChoice(userData?.avatarChoice)} displayName={userData?.displayName || currentUser?.displayName || ""} />
                  <div className={cn("absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200", avatarHovering ? "opacity-100" : "opacity-0")}>
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>
              </div>
              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-purple-900 truncate">{userData?.displayName || "User"}</h2>
                  <Badge variant="primary" className="text-xs">Active</Badge>
                </div>
                <p className="text-sm text-purple-500 mt-0.5 truncate">{userData?.email || currentUser?.email}</p>
                <p className="text-xs text-purple-400 mt-1">
                  Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "recently"}
                </p>
              </div>
              {/* Edit buttons */}
              <div className="hidden sm:flex flex-col gap-2 shrink-0">
                <Button size="sm" variant="secondary" onClick={() => navigate("/settings")}>
                  <Settings className="w-3.5 h-3.5 mr-1" />Edit Details
                </Button>
              </div>
            </div>

            {/* Mobile edit button */}
            <div className="sm:hidden px-5 py-3 border-b border-purple-100">
              <Button size="sm" variant="secondary" className="w-full" onClick={() => navigate("/settings")}>
                <Settings className="w-3.5 h-3.5 mr-1" />Edit Account Details
              </Button>
            </div>
          </motion.div>

          {/* Payslip details card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-purple-100 flex items-center justify-between">
              <h3 className="font-bold text-purple-900 text-sm uppercase tracking-wider">Current Payslip</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate("/payslip", { state: { prefillJobTitle: userData?.payslipData?.jobTitle || "", prefillLocation: userData?.payslipData?.location || "" } })}>
                Edit Payslip
              </Button>
            </div>
            <div className="px-5 py-2">
              <InfoRow icon={User} label="Gross Salary" value={userData?.payslipData?.grossSalary ? "\xA3" + Number(userData.payslipData.grossSalary).toLocaleString("en-GB", { minimumFractionDigits: 2 }) : "Not set"} />
              <InfoRow icon={Briefcase} label="Job Title" value={userData?.payslipData?.jobTitle || "Not set"} />
              <InfoRow icon={MapPin} label="Location" value={userData?.payslipData?.location || "Not set"} />
              <InfoRow icon={Calendar} label="Last Updated" value={userData?.payslipData?.updatedAt ? new Date(userData.payslipData.updatedAt).toLocaleDateString("en-GB") : "Not available"} />
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="secondary" onClick={handleLogout} loading={loggingOut} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />{loggingOut ? "Logging out..." : "Logout"}
            </Button>
            <Button variant="outline" onClick={handleExportData} loading={exporting} className="w-full">
              <Download className="w-4 h-4 mr-2" />{exporting ? "Exporting..." : "Export Data"}
            </Button>
            <Button variant="danger" onClick={handleDeleteProfile} loading={deleting} className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />{deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Avatar picker modal */}
      {avatarPickerOpen && (
        <Modal onClose={closeAvatarPicker}>
          <div className="max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-purple-900 mb-1" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>Choose Profile Photo</h3>
            <p className="text-sm text-purple-500 mb-5">Pick an avatar then save.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
              {PROFILE_AVATAR_OPTIONS.map((option) => {
                const selected = selectedAvatarChoice === option.value;
                return (
                  <button key={option.value} type="button" onClick={() => setSelectedAvatarChoice(option.value)}
                    className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                      selected ? "border-purple-600 bg-purple-50 shadow-sm" : "border-purple-200 bg-white hover:border-purple-400")}>
                    <ProfileAvatar size={52} avatarChoice={option.value} displayName={userData?.displayName || currentUser?.displayName || ""} />
                    <span className={cn("text-xs font-semibold", selected ? "text-purple-700" : "text-purple-500")}>{option.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeAvatarPicker} disabled={avatarSaving}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveAvatar} loading={avatarSaving}>{avatarSaving ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </Modal>
      )}

      <TooltipGuide isOpen={isOnboardingOpen} activeStepNumber={activeStepNumber} steps={onboardingSteps} onClose={closeGuide} onComplete={completeGuide} onGoToStep={goToStep} />
    </div>
  );
};

export default Profile;
