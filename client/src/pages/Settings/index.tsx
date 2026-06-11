import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from "../../firebase/authClient";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { resetServerOnboarding } from "../../api/onboardingApi";
import { resetLocalOnboardingPages } from "../../utils/onboardingState";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";

const mapFirebaseEmailError = (error: unknown) => {
  const errorCode =
    typeof error === "object" && error !== null && "code" in error ? String((error as { code?: string }).code) : "";

  switch (errorCode) {
    case "auth/requires-recent-login":
      return "Please confirm your current password to continue.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/email-already-in-use":
      return "That email address is already in use.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Current password is incorrect.";
    case "auth/network-request-failed":
      return "Network error while contacting Firebase. Try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/operation-not-allowed":
      return "Firebase requires you to verify the new email address before the change is applied. Check your inbox for the verification email.";
    case "auth/unauthorized-continue-uri":
      return "Email verification link is blocked by Firebase settings. Add this app domain to Firebase Authentication authorized domains.";
    case "auth/invalid-continue-uri":
      return "Email verification link configuration is invalid. Contact support.";
    default:
      return errorCode ? `Unable to update email. Firebase returned ${errorCode}.` : "Unable to update email.";
  }
};

const isValidEmail = (value: string) => {
  const trimmed = value.trim();
  // Keep this stricter than HTML5 email validation to reduce obvious invalid inputs.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
};

const cardStyle = {
  backgroundColor: "#faf9fd",
  border: "1px solid #c9bde8",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 4px 20px rgba(92, 63, 163, 0.08)",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#7a6e99",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #c9bde8",
  backgroundColor: "#faf9fd",
  fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
};

const SettingsPage = () => {
  const { currentUser, token, loading, profile, refreshProfile, setProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [usernameState, setUsernameState] = useState({
    saving: false,
    message: "",
    error: "",
  });
  const [emailState, setEmailState] = useState({
    saving: false,
    message: "",
    error: "",
  });
  const [emailSyncState, setEmailSyncState] = useState({
    syncing: false,
    message: "",
    error: "",
  });
  const [onboardingState, setOnboardingState] = useState({
    saving: false,
    message: "",
    error: "",
  });
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [newsletterState, setNewsletterState] = useState({
    saving: false,
    message: "",
    error: "",
  });
  const [newsletterTestState, setNewsletterTestState] = useState({
    sending: false,
    message: "",
    error: "",
  });
  const {
    isOpen: isOnboardingOpen,
    activeStepNumber,
    steps: onboardingSteps,
    closeGuide,
    completeGuide,
    goToStep,
  } = usePageOnboarding("/settings");

  useEffect(() => {
    setUsername(profile?.displayName || "");
    setEmail(profile?.email || currentUser?.email || "");
    setConfirmEmail(profile?.email || currentUser?.email || "");
    setNewsletterOptIn(Boolean(profile?.newsletterOptIn));
  }, [profile, currentUser]);

  const usernameChanged = useMemo(() => {
    return username.trim() !== (profile?.displayName || "").trim();
  }, [profile, username]);

  const emailChanged = useMemo(() => {
    return email.trim().toLowerCase() !== (profile?.email || currentUser?.email || "").trim().toLowerCase();
  }, [currentUser, email, profile]);
  const supportsPasswordProvider =
    currentUser?.providerData?.some((provider: any) => provider.providerId === "password") ?? false;
  const isGoogleOnlyAccount =
    Boolean(currentUser) &&
    !supportsPasswordProvider &&
    (currentUser?.providerData?.some((provider: any) => provider.providerId === "google.com") ?? false);

  const handleUsernameSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setUsernameState({ saving: true, message: "", error: "" });

    const nextName = username.trim();

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/user/${currentUser.uid}/profile`,
        { displayName: nextName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile((prev) => ({
        ...prev,
        displayName: response.data.displayName,
      }));
      setUsername(response.data.displayName || "");
      setUsernameState({
        saving: false,
        message: "Username updated.",
        error: "",
      });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || "Unable to update username."
        : "Unable to update username.";
      setUsernameState({ saving: false, message: "", error: message });
    }
  };

  const handleEmailSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailState({ saving: true, message: "", error: "" });

    if (!currentUser?.email) {
      setEmailState({
        saving: false,
        message: "",
        error: "No authenticated user found.",
      });
      return;
    }

    if (!supportsPasswordProvider) {
      setEmailState({
        saving: false,
        message: "",
        error: "This account is managed by Google sign-in. Change the email in your Google account settings.",
      });
      return;
    }

    const updatedEmail = email.trim().toLowerCase();
    const currentEmail = String(profile?.email || currentUser?.email || "")
      .trim()
      .toLowerCase();

    if (!isValidEmail(updatedEmail)) {
      setEmailState({
        saving: false,
        message: "",
        error: "Enter a valid email address.",
      });
      return;
    }

    if (updatedEmail === currentEmail) {
      setEmailState({
        saving: false,
        message: "",
        error: "Enter a different email address.",
      });
      return;
    }

    if (confirmEmail.trim().toLowerCase() !== updatedEmail) {
      setEmailState({
        saving: false,
        message: "",
        error: "New email and confirmation email must match.",
      });
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, emailPassword);
      await reauthenticateWithCredential(currentUser, credential);
      const activeUser = auth.currentUser || currentUser;

      await verifyBeforeUpdateEmail(activeUser, updatedEmail, {
        url: `${window.location.origin}/login?emailVerification=pending`,
        handleCodeInApp: false,
      });
      await activeUser.reload();
      await refreshProfile(token);
      setEmail(updatedEmail);
      setConfirmEmail(updatedEmail);

      setEmailPassword("");
      setEmailState({
        saving: false,
        message: "Verification email sent to your new address. Your email will update after you open that link.",
        error: "",
      });
    } catch (error) {
      console.error("Email update failed", error);

      let message = "Unable to update email.";

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error || message;
      } else {
        message = mapFirebaseEmailError(error);
      }

      setEmailState({ saving: false, message: "", error: message });
    }
  };

  const handleEmailSync = async () => {
    if (!currentUser) {
      setEmailSyncState({
        syncing: false,
        message: "",
        error: "No authenticated user found.",
      });
      return;
    }

    setEmailSyncState({ syncing: true, message: "", error: "" });

    try {
      await currentUser.reload();
      const refreshedToken = await currentUser.getIdToken(true);
      await refreshProfile(refreshedToken);
      const latestEmail = String(auth.currentUser?.email || currentUser.email || "").toLowerCase();
      setEmail(latestEmail);
      setConfirmEmail(latestEmail);
      setEmailSyncState({
        syncing: false,
        message: "Email synced from Firebase.",
        error: "",
      });
    } catch (error) {
      console.error("Failed to sync email", error);
      setEmailSyncState({
        syncing: false,
        message: "",
        error: "Unable to sync email right now.",
      });
    }
  };

  const handleReplayOnboarding = async () => {
    setOnboardingState({ saving: true, message: "", error: "" });

    try {
      resetLocalOnboardingPages();

      let completedPages: string[] = [];
      if (token) {
        completedPages = await resetServerOnboarding(token);
      }

      setProfile((previous) => ({
        ...(previous || {}),
        onboardingCompletedPages: completedPages,
      }));

      setOnboardingState({
        saving: false,
        message: "Onboarding reset. Visit any supported page to replay numbered tips.",
        error: "",
      });
    } catch (error) {
      console.error("Failed to reset onboarding", error);
      setOnboardingState({
        saving: false,
        message: "",
        error: "Unable to reset onboarding right now.",
      });
    }
  };

  const handleNewsletterSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setNewsletterState({ saving: true, message: "", error: "" });

    if (!currentUser?.uid || !token) {
      setNewsletterState({
        saving: false,
        message: "",
        error: "Please sign in again to update newsletter settings.",
      });
      return;
    }

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/user/${currentUser.uid}/profile`,
        { newsletterOptIn },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const nextValue = Boolean(response.data?.newsletterOptIn);
      setProfile((prev) => ({ ...(prev || {}), newsletterOptIn: nextValue }));
      setNewsletterOptIn(nextValue);
      setNewsletterState({
        saving: false,
        message: nextValue
          ? "Newsletter subscription enabled. You can opt out anytime here or from the email link."
          : "Newsletter subscription disabled.",
        error: "",
      });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || "Unable to update newsletter preference."
        : "Unable to update newsletter preference.";
      setNewsletterState({ saving: false, message: "", error: message });
    }
  };

  const handleSendNewsletterTest = async () => {
    setNewsletterTestState({ sending: true, message: "", error: "" });

    if (!currentUser?.uid || !token) {
      setNewsletterTestState({
        sending: false,
        message: "",
        error: "Please sign in again to send a test email.",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/user/newsletter/send-test`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sentTo = response.data?.email || profile?.email || currentUser?.email || "your email";
      const period = response.data?.period?.label ? ` for ${response.data.period.label}` : "";
      const consistencyChecks = Array.isArray(response.data?.consistencyChecks)
        ? response.data.consistencyChecks.join(" ")
        : "";
      setNewsletterTestState({
        sending: false,
        message: `Test newsletter sent to ${sentTo}${period}. ${consistencyChecks}`.trim(),
        error: "",
      });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || "Unable to send test newsletter."
        : "Unable to send test newsletter.";
      setNewsletterTestState({ sending: false, message: "", error: message });
    }
  };

  if (loading) {
    return <div className="app-page">Loading account settings...</div>;
  }

  return (
    <div className="app-page">
      <div className="app-content">
        <div style={{ marginBottom: "24px" }} data-onboarding="settings-heading">
          <p
            style={{
              margin: 0,
              color: "#7a6e99",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Account
          </p>
          <h1
            style={{
              margin: "8px 0 0",
              color: "#5c3fa3",
              fontSize: "44px",
              fontWeight: 300,
            }}
          >
            Edit Account Details
          </h1>
        </div>

        {isGoogleOnlyAccount && (
          <div
            style={{
              ...cardStyle,
              backgroundColor: "#ede8f8",
              borderColor: "#c9bde8",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "10px",
                color: "#4a3f6b",
              }}
            >
              Google sign-in notice
            </h2>
            <p style={{ margin: 0, color: "#4a3f6b", lineHeight: 1.6 }}>
              This account is currently managed through Google sign-in. Username changes still work here, but email and
              password changes are not handled inside this app for Google-only accounts. Use your Google account
              settings if you need to change those credentials.
            </p>
          </div>
        )}

        <div className="app-card-grid two-col">
          <form onSubmit={handleUsernameSave} style={cardStyle}>
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "14px",
                color: "#4a3f6b",
              }}
            >
              Username
            </h2>
            <label style={labelStyle} htmlFor="username">
              Display name
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              style={inputStyle}
            />
            {usernameState.message && <p style={{ margin: "10px 0 0", color: "#5bb8c4" }}>{usernameState.message}</p>}
            {usernameState.error && <p style={{ margin: "10px 0 0", color: "#e05c5c" }}>{usernameState.error}</p>}
            <button
              type="submit"
              className="gecko-pill-btn"
              disabled={!usernameChanged || usernameState.saving || !username.trim()}
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: "#ede8f8",
              }}
            >
              {usernameState.saving ? "Saving..." : "Save username"}
            </button>
          </form>

          <form onSubmit={handleEmailSave} style={cardStyle}>
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "14px",
                color: "#4a3f6b",
              }}
            >
              Email address
            </h2>
            <label style={labelStyle} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
              disabled={isGoogleOnlyAccount}
            />
            <label style={{ ...labelStyle, marginTop: "14px" }} htmlFor="confirm-email">
              Confirm new email
            </label>
            <input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              style={inputStyle}
              disabled={isGoogleOnlyAccount}
            />
            <label style={{ ...labelStyle, marginTop: "14px" }} htmlFor="email-password">
              Current password
            </label>
            <input
              id="email-password"
              type="password"
              value={emailPassword}
              onChange={(event) => setEmailPassword(event.target.value)}
              style={inputStyle}
              disabled={isGoogleOnlyAccount}
            />
            <p style={{ margin: "10px 0 0", color: "#7a6e99", fontSize: "13px" }}>
              Firebase may require recent sign-in before sensitive email changes.
            </p>
            <button
              type="button"
              className="gecko-pill-btn"
              onClick={handleEmailSync}
              disabled={emailSyncState.syncing || isGoogleOnlyAccount}
              style={{
                marginTop: "10px",
                padding: "10px 12px",
                backgroundColor: "#fff",
              }}
            >
              {emailSyncState.syncing ? "Syncing..." : "Refresh verified email"}
            </button>
            {emailState.message && <p style={{ margin: "10px 0 0", color: "#5bb8c4" }}>{emailState.message}</p>}
            {emailState.error && <p style={{ margin: "10px 0 0", color: "#e05c5c" }}>{emailState.error}</p>}
            {emailSyncState.message && <p style={{ margin: "10px 0 0", color: "#5bb8c4" }}>{emailSyncState.message}</p>}
            {emailSyncState.error && <p style={{ margin: "10px 0 0", color: "#e05c5c" }}>{emailSyncState.error}</p>}
            <button
              type="submit"
              className="gecko-pill-btn"
              disabled={
                isGoogleOnlyAccount ||
                !emailChanged ||
                emailState.saving ||
                !emailPassword.trim() ||
                confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()
              }
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: "#ede8f8",
              }}
            >
              {emailState.saving ? "Saving..." : "Save email"}
            </button>
          </form>

          <form onSubmit={handleNewsletterSave} style={cardStyle} data-onboarding="settings-newsletter-card">
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "14px",
                color: "#4a3f6b",
              }}
            >
              Newsletter
            </h2>
            <p style={{ margin: "0 0 12px", color: "#4a3f6b", lineHeight: 1.6 }}>
              Opt in to receive one monthly email with a concise financial snapshot. You can unsubscribe any time from
              this page or from the unsubscribe link in the email.
            </p>
            <p style={{ margin: "0 0 14px", color: "#7a6e99", fontSize: "13px" }}>
              Monthly comparison and history insights are not live yet and are currently placeholder content.
            </p>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#4a3f6b",
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={(event) => setNewsletterOptIn(event.target.checked)}
                data-onboarding="settings-newsletter-toggle"
              />
              Send me the monthly newsletter
            </label>
            {newsletterState.message && (
              <p style={{ margin: "10px 0 0", color: "#5bb8c4" }}>{newsletterState.message}</p>
            )}
            {newsletterState.error && <p style={{ margin: "10px 0 0", color: "#e05c5c" }}>{newsletterState.error}</p>}
            <button
              type="submit"
              className="gecko-pill-btn"
              disabled={newsletterState.saving}
              data-onboarding="settings-newsletter-save"
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: "#ede8f8",
              }}
            >
              {newsletterState.saving ? "Saving..." : "Save newsletter preference"}
            </button>

            <button
              type="button"
              className="gecko-pill-btn"
              onClick={handleSendNewsletterTest}
              disabled={newsletterTestState.sending || newsletterState.saving}
              data-onboarding="settings-newsletter-test-send"
              style={{
                marginTop: "14px",
                padding: "12px 16px",
                backgroundColor: "#ede8f8",
              }}
            >
              {newsletterTestState.sending ? "Sending test..." : "Get Last Month's Newsletter"}
            </button>
            {newsletterTestState.message && (
              <p style={{ margin: "10px 0 0", color: "#5bb8c4" }}>{newsletterTestState.message}</p>
            )}
            {newsletterTestState.error && (
              <p style={{ margin: "10px 0 0", color: "#e05c5c" }}>{newsletterTestState.error}</p>
            )}
          </form>

          <section style={cardStyle}>
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "14px",
                color: "#4a3f6b",
              }}
            >
              Tutorial / Onboarding
            </h2>
            <p style={{ margin: 0, color: "#4a3f6b", lineHeight: 1.6 }}>
              Replay the financial walkthrough tooltips for completed areas of the app.
            </p>
            {onboardingState.message && (
              <p style={{ margin: "10px 0 0", color: "#5bb8c4" }}>{onboardingState.message}</p>
            )}
            {onboardingState.error && <p style={{ margin: "10px 0 0", color: "#e05c5c" }}>{onboardingState.error}</p>}
            <button
              type="button"
              className="gecko-pill-btn"
              disabled={onboardingState.saving}
              onClick={handleReplayOnboarding}
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: "#ede8f8",
              }}
            >
              {onboardingState.saving ? "Resetting..." : "Replay onboarding"}
            </button>
          </section>
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

export default SettingsPage;
