import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import axios from "axios";
import TopNav from "../../components/TopNav";
import ProfileAvatar from "../../components/ProfileAvatar";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, token, loading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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
          `${import.meta.env.VITE_API_URL}/v1/user/profile`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setUserData(res.data);
        setLoadingData(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile data");
        setLoadingData(false);
      }
    };

    fetchUserData();
  }, [token, loading]);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/v1/user/export-data`,
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
        await axios.delete(`${import.meta.env.VITE_API_URL}/v1/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Sign out
        await signOut(auth);
        navigate("/login");
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
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  };

  // Calculate XP level and progress
  const xpTotal = userData?.xpTotal || 0;
  const xpPerLevel = 100;
  const currentLevel = Math.floor(xpTotal / xpPerLevel) + 1;
  const xpInCurrentLevel = xpTotal % xpPerLevel;
  const xpProgressPercent = (xpInCurrentLevel / xpPerLevel) * 100;

  if (loading || loadingData) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
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
            color: "#666",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fafaf8",
        padding: "30px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <TopNav />

      {/* Main container */}
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Top section: Profile heading - centered */}
        <div
          data-onboarding="profile-heading"
          style={{
            textAlign: "center",
            marginBottom: "50px",
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: "300",
              margin: "0",
              color: "#6ba3d9",
              letterSpacing: "2px",
            }}
          >
            PROFILE
          </h1>
        </div>

        {/* Middle section: User info left, Tree + gecko right */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "60px",
            marginBottom: "50px",
            marginLeft: "80px",
            marginRight: "80px",
          }}
        >
          {/* User Info - Left */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e0ddd5",
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
                    color: "#999",
                  }}
                >
                  Name
                </p>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "16px",
                    color: "#333",
                  }}
                >
                  {userData?.displayName || "Not set"}
                </p>

                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "12px",
                    color: "#999",
                  }}
                >
                  Email
                </p>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  {userData?.email || currentUser?.email}
                </p>

                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "12px",
                    color: "#999",
                  }}
                >
                  Member Since
                </p>
                <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
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
                <ProfileAvatar size={74} />
                <button
                  onClick={() => navigate("/settings")}
                  style={{
                    width: "100%",
                    marginTop: "44px",
                    padding: "8px 12px",
                    backgroundColor: "#eef5eb",
                    color: "#2d5237",
                    border: "1px solid #bfd1c0",
                    borderRadius: "999px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Edit Details
                </button>
              </div>
            </div>

            {/* Payslip Details */}
            <div style={{ borderTop: "1px solid #e8dfd5", paddingTop: "16px" }}>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "14px",
                  color: "#333",
                  fontWeight: "600",
                }}
              >
                Current Payslip Details
              </h3>
              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#999" }}
              >
                Gross Salary
              </p>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  color: "#2d8659",
                  fontWeight: "500",
                }}
              >
                £{userData?.payslipData?.grossSalary?.toFixed(2) || "0.00"}
              </p>

              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#999" }}
              >
                Job Title
              </p>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  color: "#333",
                }}
              >
                {userData?.payslipData?.jobTitle || "Not set"}
              </p>

              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#999" }}
              >
                Location
              </p>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  color: "#333",
                }}
              >
                {userData?.payslipData?.location || "Not set"}
              </p>

              <button
                onClick={() => navigate("/payslip")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f5d899",
                  color: "#333",
                  border: "1px solid #ead966",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  transition: "background-color 0.2s",
                  marginTop: "8px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ead966")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f5d899")
                }
              >
                Edit Payslip/Budget
              </button>
            </div>
          </div>

          {/* Tree + Gecko + XP Bar - Right */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              position: "relative",
              gap: "20px",
            }}
          >
            {/* Tree SVG */}
            <svg width="280" height="240" viewBox="0 0 280 240">
              {/* Ground */}
              <ellipse
                cx="140"
                cy="230"
                rx="120"
                ry="15"
                fill="#2d8659"
                opacity="0.3"
              />

              {/* Tree trunk */}
              <rect
                x="125"
                y="130"
                width="30"
                height="100"
                fill="#6b4423"
                rx="3"
              />

              {/* Tree shadow on trunk */}
              <rect
                x="125"
                y="130"
                width="8"
                height="100"
                fill="#5a3a1a"
                opacity="0.4"
                rx="3"
              />

              {/* Foliage - three levels with better styling */}
              {/* Bottom crown - largest */}
              <ellipse cx="140" cy="140" rx="70" ry="65" fill="#2d8659" />
              <ellipse
                cx="135"
                cy="145"
                rx="10"
                ry="12"
                fill="#3d9969"
                opacity="0.6"
              />
              <ellipse
                cx="160"
                cy="148"
                rx="12"
                ry="14"
                fill="#3d9969"
                opacity="0.5"
              />
              <ellipse
                cx="145"
                cy="168"
                rx="11"
                ry="13"
                fill="#3d9969"
                opacity="0.6"
              />

              {/* Middle crown */}
              <ellipse cx="140" cy="95" rx="55" ry="50" fill="#1d6649" />
              <ellipse
                cx="130"
                cy="100"
                rx="9"
                ry="11"
                fill="#2d7659"
                opacity="0.5"
              />
              <ellipse
                cx="155"
                cy="98"
                rx="10"
                ry="12"
                fill="#2d7659"
                opacity="0.6"
              />

              {/* Top crown - smallest */}
              <ellipse cx="140" cy="50" rx="40" ry="38" fill="#2d8659" />
              <ellipse
                cx="140"
                cy="45"
                rx="8"
                ry="10"
                fill="#3d9969"
                opacity="0.6"
              />
            </svg>

            {/* XP Bar Under Tree */}
            <div
              style={{
                width: "100%",
                maxWidth: "300px",
                padding: "16px",
                backgroundColor: "#f0f4f8",
                borderRadius: "8px",
                border: "1px solid #d9e3ed",
                textAlign: "center",
              }}
            >
              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#999" }}
              >
                LEVEL
              </p>
              <h2
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "28px",
                  fontWeight: "300",
                  color: "#6ba3d9",
                }}
              >
                {currentLevel}
              </h2>

              {/* XP Bar */}
              <div
                style={{
                  marginBottom: "8px",
                  backgroundColor: "#e8eef6",
                  height: "10px",
                  borderRadius: "5px",
                  overflow: "hidden",
                  border: "1px solid #d9e3ed",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${xpProgressPercent}%`,
                    backgroundColor: "#6ba3d9",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <p style={{ margin: "0", fontSize: "11px", color: "#999" }}>
                {xpInCurrentLevel} / {xpPerLevel} XP
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "400px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              padding: "12px 20px",
              backgroundColor: "#f2ece4",
              color: "#6a4a3a",
              border: "1px solid #ddccb8",
              borderRadius: "4px",
              cursor: loggingOut ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: loggingOut ? 0.6 : 1,
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              !loggingOut && (e.currentTarget.style.backgroundColor = "#eadfce")
            }
            onMouseLeave={(e) =>
              !loggingOut && (e.currentTarget.style.backgroundColor = "#f2ece4")
            }
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>

          <button
            onClick={handleExportData}
            disabled={exporting}
            style={{
              padding: "12px 20px",
              backgroundColor: "#f5d899",
              color: "#333",
              border: "1px solid #ead966",
              borderRadius: "4px",
              cursor: exporting ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: exporting ? 0.6 : 1,
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              !exporting && (e.currentTarget.style.backgroundColor = "#ead966")
            }
            onMouseLeave={(e) =>
              !exporting && (e.currentTarget.style.backgroundColor = "#f5d899")
            }
          >
            {exporting ? "Exporting..." : "📥 Export My Data"}
          </button>

          <button
            onClick={handleDeleteProfile}
            disabled={deleting}
            style={{
              padding: "12px 20px",
              backgroundColor: "#e8c8c8",
              color: "#333",
              border: "1px solid #ddb5b5",
              borderRadius: "4px",
              cursor: deleting ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: deleting ? 0.6 : 1,
              transition: "background-color 0.2s",
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
