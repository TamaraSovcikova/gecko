import { useMemo, useState } from "react";
import axios from "axios";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import TopNav from "../../components/TopNav";
import { useAuth } from "../../context/AuthContext";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";

const strengthLabel = (password: string) => {
  if (!password) return { text: "Enter a new password", color: "#7a6e99" };
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  const checks = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (checks >= 4) {
    return { text: "Strong", color: "#5bb8c4" };
  }
  if (checks >= 3) {
    return { text: "Good", color: "#c2872c" };
  }
  return { text: "Weak: use 8+ chars, uppercase, lowercase, number, and special character (!@#$%^&*)", color: "#e05c5c" };
};

const ChangePasswordPage = () => {
  const { currentUser, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  const passwordStrongEnough = useMemo(() => {
    const hasLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*]/.test(newPassword);
    const checks = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    return checks >= 4;
  }, [newPassword]);
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;
  const strength = strengthLabel(newPassword);
  const supportsPasswordProvider =
    currentUser?.providerData?.some(
      (provider: any) => provider.providerId === "password",
    ) ?? false;
  const isGoogleOnlyAccount =
    Boolean(currentUser) &&
    !supportsPasswordProvider &&
    (currentUser?.providerData?.some(
      (provider: any) => provider.providerId === "google.com",
    ) ??
      false);
  const {
    isOpen: isOnboardingOpen,
    activeStepNumber,
    steps: onboardingSteps,
    closeGuide,
    completeGuide,
    goToStep,
  } = usePageOnboarding("/change-password");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    if (!currentUser?.email) {
      setState({
        saving: false,
        message: "",
        error: "No authenticated user found.",
      });
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      const freshToken = await currentUser.getIdToken(true);

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/user/${currentUser.uid}/profile`,
        { auditEvent: "password_changed" },
        { headers: { Authorization: `Bearer ${freshToken || token}` } },
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setState({ saving: false, message: "Password updated.", error: "" });
    } catch (error) {
      let message = "Unable to change password.";

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error || message;
      } else if (error instanceof Error) {
        if (error.message.includes("auth/weak-password")) {
          message = "Use at least 8 characters and one number.";
        } else if (
          error.message.includes("auth/wrong-password") ||
          error.message.includes("auth/invalid-credential")
        ) {
          message = "Current password is incorrect.";
        } else if (error.message.includes("auth/requires-recent-login")) {
          message = "Please sign in again and retry this change.";
        }
      }

      setState({ saving: false, message: "", error: message });
    }
  };

  return (
    <div className="app-page">
      <TopNav />
      <div
        className="app-content app-surface"
        style={{
          padding: "24px",
          maxWidth: "980px",
        }}
        data-onboarding="change-password-heading"
      >
        <p
          style={{
            margin: 0,
            color: "#7a6e99",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Security
        </p>
        <h1
          style={{
            margin: "8px 0 20px",
            color: "#5c3fa3",
            fontSize: "42px",
            fontWeight: 300,
          }}
        >
          Change Password
        </h1>

        {isGoogleOnlyAccount && (
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #c9bde8",
              background: "#f4f1fb",
              color: "#4a3f6b",
            }}
          >
            Google-only sign-in accounts do not currently manage passwords
            inside this app. Change your password through your Google account
            instead.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="current-password"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "12px",
              color: "#7a6e99",
              textTransform: "uppercase",
            }}
          >
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="gecko-input"
            style={{
              width: "100%",
              padding: "12px 14px",
              marginBottom: "16px",
            }}
            disabled={isGoogleOnlyAccount}
          />

          <label
            htmlFor="new-password"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "12px",
              color: "#7a6e99",
              textTransform: "uppercase",
            }}
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="gecko-input"
            style={{
              width: "100%",
              padding: "12px 14px",
            }}
            disabled={isGoogleOnlyAccount}
          />
          <p
            style={{
              margin: "10px 0 0",
              color: strength.color,
              fontSize: "13px",
            }}
          >
            {strength.text}
          </p>

          <label
            htmlFor="confirm-password"
            style={{
              display: "block",
              margin: "16px 0 8px",
              fontSize: "12px",
              color: "#7a6e99",
              textTransform: "uppercase",
            }}
          >
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="gecko-input"
            style={{
              width: "100%",
              padding: "12px 14px",
            }}
            disabled={isGoogleOnlyAccount}
          />
          {confirmPassword && !passwordsMatch && (
            <p
              style={{ margin: "10px 0 0", color: "#e05c5c", fontSize: "13px" }}
            >
              Passwords must match before saving.
            </p>
          )}
          {state.message && (
            <p style={{ margin: "14px 0 0", color: "#5bb8c4" }}>
              {state.message}
            </p>
          )}
          {state.error && (
            <p style={{ margin: "14px 0 0", color: "#e05c5c" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            className="gecko-pill-btn"
            disabled={
              isGoogleOnlyAccount ||
              !currentPassword ||
              !passwordStrongEnough ||
              !passwordsMatch ||
              state.saving
            }
            style={{
              marginTop: "18px",
              padding: "12px 16px",
              backgroundColor: "#ede8f8",
            }}
          >
            {state.saving ? "Saving..." : "Update password"}
          </button>
        </form>
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

export default ChangePasswordPage;
