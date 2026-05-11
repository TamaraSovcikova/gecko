import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import axios from "axios";
import TopNav from "../../components/TopNav";
import Modal from "../../components/Modal";
import ProfileAvatar, {
  PROFILE_AVATAR_OPTIONS,
  type ProfileAvatarChoice,
} from "../../components/ProfileAvatar";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";

const PAYSLIP_PROFILE_CACHE_KEY = "zoar.payslipProfileFields";
const ALLOWED_AVATAR_CHOICES: ProfileAvatarChoice[] = ["initial", "photo1", "photo2", "photo3", "photo5"];

const normalizeAvatarChoice = (value: unknown): ProfileAvatarChoice => {
  if (typeof value !== "string") {
    return "initial";
  }

  const normalized = value.trim().toLowerCase() as ProfileAvatarChoice;
  return ALLOWED_AVATAR_CHOICES.includes(normalized) ? normalized : "initial";
};

const clearClientUserData = () => {
  const localPrefixes = [
    "zoar.",
    "zoar:",
    "learn_read_topics_",
    "badge_shown_level_",
    "dashboard_tip_seen_",
  ];

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) {
        continue;
      }

      if (key === PAYSLIP_PROFILE_CACHE_KEY || localPrefixes.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore storage cleanup failures and continue logout.
  }

  try {
    window.sessionStorage.removeItem("zoar.onboarding.activeStepNumber");
  } catch {
    // Ignore session cleanup failures.
  }
};

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
  const {
    isOpen: isOnboardingOpen,
    activeStepNumber,
    steps: onboardingSteps,
    closeGuide,
    completeGuide,
    goToStep,
  } = usePageOnboarding("/profile");

  // Fetch user data from backend
  useEffect(() => {
    if (loading || !token) return;

    const fetchUserData = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/user/profile`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setUserData(res.data);

        try {
          localStorage.setItem(
            PAYSLIP_PROFILE_CACHE_KEY,
            JSON.stringify({
              jobTitle:
                typeof res.data?.payslipData?.jobTitle === "string"
                  ? res.data.payslipData.jobTitle.trim()
                  : "",
              location:
                typeof res.data?.payslipData?.location === "string"
                  ? res.data.payslipData.location.trim()
                  : "",
            }),
          );
        } catch {
          // Ignore local cache failures and keep profile rendering.
        }

        setLoadingData(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
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
    if (avatarSaving) {
      return;
    }

    setAvatarPickerOpen(false);
    setSelectedAvatarChoice(normalizeAvatarChoice(userData?.avatarChoice));
  };

  const handleSaveAvatar = async () => {
    if (!token) {
      return;
    }

    setAvatarSaving(true);

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/user/profile`,
        { avatarChoice: selectedAvatarChoice },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setUserData(response.data);
      setProfile((previous) => ({
        ...(previous || {}),
        avatarChoice: selectedAvatarChoice,
      }));
      await refreshProfile(token);
      setAvatarPickerOpen(false);
    } catch (err) {
      console.error("Error updating avatar:", err);
      setError("Failed to update profile photo");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/user/export-data`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      // Create a download link for the PDF
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "my-data.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting data:", err);
      setError("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (
      window.confirm(
        "Deleting your account is irreversible. This will permanently remove your profile and associated data, including monthly snapshots and newsletter subscriptions ",
      )
    ) {
      setDeleting(true);
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        clearClientUserData();

        // Sign out
        await signOut(auth);
        navigate("/");
      } catch (err) {
        console.error("Error deleting profile:", err);
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error || "Failed to delete profile"
          : "Failed to delete profile";
        setError(message);
        setDeleting(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#7a6e99" }}>
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          color: "#d9534f",
          backgroundColor: "#f8f6f3",
          minHeight: "100vh",
        }}
      >
        <p>{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ede6db",
            border: "1px solid #ddd4c9",
            borderRadius: "4px",
            cursor: "pointer",
            color: "#7a6e99",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="app-page" style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}>
      <TopNav />

      {/* Main container */}
      <div className="app-content">
        {/* Top section: Profile heading - centered */}
        <div
          data-onboarding="profile-heading"
          style={{
            textAlign: "center",
            marginBottom: "34px",
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: "300",
              margin: "0",
              color: "#5c3fa3",
              letterSpacing: "2px",
            }}
          >
            PROFILE
          </h1>
        </div>

        {/* Middle section: User info */}
        <div
          style={{
            display: "block",
            marginBottom: "50px",
            maxWidth: "760px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {/* User Info */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "#faf9fd",
              borderRadius: "8px",
              border: "1px solid #c9bde8",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "12px",
                    color: "#7a6e99",
                  }}
                >
                  Name
                </p>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "16px",
                    color: "#1a1040",
                  }}
                >
                  {userData?.displayName || "Not set"}
                </p>

                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "12px",
                    color: "#7a6e99",
                  }}
                >
                  Email
                </p>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    color: "#7a6e99",
                  }}
                >
                  {userData?.email || currentUser?.email}
                </p>

                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "12px",
                    color: "#7a6e99",
                  }}
                >
                  Member Since
                </p>
                <p style={{ margin: "0", fontSize: "14px", color: "#7a6e99" }}>
                  {userData?.createdAt
                    ? new Date(userData.createdAt).toLocaleDateString()
                    : "Recently"}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "142px",
                  marginTop: "34px",
                }}
              >
                <button
                  type="button"
                  aria-label="Change profile photo"
                  onClick={openAvatarPicker}
                  onMouseEnter={() => setAvatarHovering(true)}
                  onMouseLeave={() => setAvatarHovering(false)}
                  style={{
                    position: "relative",
                    width: "74px",
                    height: "74px",
                    border: "none",
                    background: "transparent",
                    borderRadius: "50%",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <ProfileAvatar
                    size={74}
                    avatarChoice={normalizeAvatarChoice(userData?.avatarChoice)}
                    displayName={userData?.displayName || currentUser?.displayName || ""}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: "rgba(26, 16, 64, 0.46)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      opacity: avatarHovering ? 1 : 0,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    Change
                  </div>
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="gecko-pill-btn"
                  style={{
                    width: "100%",
                    marginTop: "44px",
                    padding: "8px 12px",
                    backgroundColor: "#ede8f8",
                    fontSize: "13px",
                  }}
                >
                  Edit Details
                </button>
              </div>
            </div>

            {/* Payslip Details */}
            <div style={{ borderTop: "1px solid #c9bde8", paddingTop: "16px" }}>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "14px",
                  color: "#1a1040",
                  fontWeight: "600",
                }}
              >
                Current Payslip Details
              </h3>
              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#7a6e99" }}
              >
                Gross Salary
              </p>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  color: "#5c3fa3",
                  fontWeight: "500",
                }}
              >
                £{userData?.payslipData?.grossSalary?.toFixed(2) || "0.00"}
              </p>

              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#7a6e99" }}
              >
                Job Title
              </p>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  color: "#1a1040",
                }}
              >
                {userData?.payslipData?.jobTitle || "Not set"}
              </p>

              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#7a6e99" }}
              >
                Location
              </p>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  color: "#1a1040",
                }}
              >
                {userData?.payslipData?.location || "Not set"}
              </p>

              <button
                onClick={() =>
                  navigate("/payslip", {
                    state: {
                      prefillJobTitle:
                        typeof userData?.payslipData?.jobTitle === "string"
                          ? userData.payslipData.jobTitle
                          : "",
                      prefillLocation:
                        typeof userData?.payslipData?.location === "string"
                          ? userData.payslipData.location
                          : "",
                    },
                  })
                }
                className="gecko-pill-btn"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ede8f8",
                  color: "#5c3fa3",
                  border: "1px solid #c9bde8",
                  fontSize: "13px",
                  marginTop: "8px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e2d9f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ede8f8")
                }
              >
                Edit Payslip/Budget
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="gecko-pill-btn"
            style={{
              padding: "12px 20px",
              backgroundColor: "#f4f1fb",
              color: "#4a3f6b",
              fontSize: "14px",
              opacity: loggingOut ? 0.6 : 1,
              minWidth: "180px",
            }}
            onMouseEnter={(e) =>
              !loggingOut && (e.currentTarget.style.backgroundColor = "#ede8f8")
            }
            onMouseLeave={(e) =>
              !loggingOut && (e.currentTarget.style.backgroundColor = "#f4f1fb")
            }
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>

          <button
            onClick={handleExportData}
            disabled={exporting}
            className="gecko-pill-btn"
            style={{
              padding: "12px 20px",
              backgroundColor: "#ede8f8",
              color: "#5c3fa3",
              border: "1px solid #c9bde8",
              fontSize: "14px",
              opacity: exporting ? 0.6 : 1,
              minWidth: "180px",
            }}
            onMouseEnter={(e) =>
              !exporting && (e.currentTarget.style.backgroundColor = "#e2d9f5")
            }
            onMouseLeave={(e) =>
              !exporting && (e.currentTarget.style.backgroundColor = "#ede8f8")
            }
          >
            {exporting ? "Exporting..." : "📥 Export My Data"}
          </button>

          <button
            onClick={handleDeleteProfile}
            disabled={deleting}
            className="gecko-pill-btn"
            style={{
              padding: "12px 20px",
              backgroundColor: "#e8c8c8",
              color: "#1a1040",
              border: "1px solid #ddb5b5",
              fontSize: "14px",
              opacity: deleting ? 0.6 : 1,
              minWidth: "180px",
            }}
            onMouseEnter={(e) =>
              !deleting && (e.currentTarget.style.backgroundColor = "#ddb5b5")
            }
            onMouseLeave={(e) =>
              !deleting && (e.currentTarget.style.backgroundColor = "#e8c8c8")
            }
          >
            {deleting ? "Deleting..." : "🗑️ Delete Profile"}
          </button>
        </div>
      </div>
      {avatarPickerOpen && (
        <Modal onClose={closeAvatarPicker}>
          <div style={{ maxWidth: "740px", margin: "0 auto" }}>
            <h3
              style={{
                margin: "0 0 10px",
                color: "#1a1040",
                fontSize: "24px",
                fontWeight: 700,
                fontFamily: "'Sora', 'Manrope', 'Segoe UI', Arial, sans-serif",
              }}
            >
              Choose Profile Photo
            </h3>
            <p style={{ margin: "0 0 18px", color: "#665b86", fontSize: "14px" }}>
              Pick one of your avatar options, then save or cancel.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              {PROFILE_AVATAR_OPTIONS.map((option) => {
                const selected = selectedAvatarChoice === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedAvatarChoice(option.value)}
                    style={{
                      border: selected ? "2px solid #5c3fa3" : "1px solid #c9bde8",
                      borderRadius: "14px",
                      background: selected ? "#f1e9ff" : "#ffffff",
                      padding: "12px 10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <ProfileAvatar
                      size={62}
                      avatarChoice={option.value}
                      displayName={userData?.displayName || currentUser?.displayName || ""}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: selected ? "#4e358f" : "#665b86",
                      }}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="gecko-pill-btn"
                onClick={closeAvatarPicker}
                disabled={avatarSaving}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#f4f1fb",
                  color: "#4a3f6b",
                  border: "1px solid #c9bde8",
                  opacity: avatarSaving ? 0.7 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gecko-pill-btn"
                onClick={handleSaveAvatar}
                disabled={avatarSaving}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#5c3fa3",
                  color: "#ffffff",
                  border: "1px solid #4e358f",
                  opacity: avatarSaving ? 0.7 : 1,
                }}
              >
                {avatarSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      <TooltipGuide
        isOpen={isOnboardingOpen}
        activeStepNumber={activeStepNumber}
        steps={onboardingSteps}
        onClose={closeGuide}
        onComplete={completeGuide}
        onGoToStep={goToStep}
      />
    </div>
  );
};

export default Profile;
