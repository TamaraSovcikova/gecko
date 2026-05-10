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
import { useGamification } from "../../context/GamificationContext";

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, token, loading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { data: gamification } = useGamification();
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#faf9fd",
        padding: "30px 20px",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
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
                <ProfileAvatar size={74} />
                <button
                  onClick={() => navigate("/settings")}
                  style={{
                    width: "100%",
                    marginTop: "44px",
                    padding: "8px 12px",
                    backgroundColor: "#ede8f8",
                    color: "#5c3fa3",
                    border: "1px solid #c9bde8",
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
                onClick={() => navigate("/payslip")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f5d899",
                  color: "#1a1040",
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
              backgroundColor: "#f4f1fb",
              color: "#4a3f6b",
              border: "1px solid #c9bde8",
              borderRadius: "4px",
              cursor: loggingOut ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: loggingOut ? 0.6 : 1,
              transition: "background-color 0.2s",
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
            style={{
              padding: "12px 20px",
              backgroundColor: "#f5d899",
              color: "#1a1040",
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
              color: "#1a1040",
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
