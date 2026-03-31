import { useMemo, useState } from "react";
import axios from "axios";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import TopNav from "../../components/TopNav";
import { useAuth } from "../../context/AuthContext";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";

const strengthLabel = (password: string) => {
  if (!password) return { text: "Enter a new password", color: "#7d7a72" };
  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);

  if (hasLength && hasNumber) {
    return { text: "Strong enough", color: "#3c7b52" };
  }

  if (password.length >= 6) {
    return { text: "Almost there: use 8+ characters and a number", color: "#c2872c" };
  }

  return { text: "Too weak", color: "#b54848" };
};

const ChangePasswordPage = () => {
  const { currentUser, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  const passwordStrongEnough = useMemo(() => {
    return newPassword.length >= 8 && /\d/.test(newPassword);
  }, [newPassword]);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const strength = strengthLabel(newPassword);
  const supportsPasswordProvider = currentUser?.providerData?.some((provider: any) => provider.providerId === "password") ?? false;
  const isGoogleOnlyAccount = Boolean(currentUser) && !supportsPasswordProvider && (currentUser?.providerData?.some((provider: any) => provider.providerId === "google.com") ?? false);
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
      setState({ saving: false, message: "", error: "No authenticated user found." });
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
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
        } else if (error.message.includes("auth/wrong-password") || error.message.includes("auth/invalid-credential")) {
          message = "Current password is incorrect.";
        } else if (error.message.includes("auth/requires-recent-login")) {
          message = "Please sign in again and retry this change.";
        }
      }

      setState({ saving: false, message: "", error: message });
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafaf8", padding: "24px" }}>
      <TopNav />
      <div style={{ maxWidth: "860px", margin: "24px auto 0", backgroundColor: "#fff", border: "1px solid #e5dfd6", borderRadius: "14px", padding: "24px", boxShadow: "0 12px 24px rgba(77, 87, 69, 0.06)" }} data-onboarding="change-password-heading">
        <p style={{ margin: 0, color: "#7e887e", letterSpacing: "0.08em", textTransform: "uppercase" }}>Security</p>
        <h1 style={{ margin: "8px 0 20px", color: "#355f46", fontSize: "42px", fontWeight: 300 }}>Change Password</h1>

        {isGoogleOnlyAccount && (
          <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "12px", border: "1px solid #ecd8ad", backgroundColor: "#fff7e9", color: "#70571f" }}>
            Google-only sign-in accounts do not currently manage passwords inside this app.
            Change your password through your Google account instead.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="current-password" style={{ display: "block", marginBottom: "8px", fontSize: "12px", color: "#7d7a72", textTransform: "uppercase" }}>Current password</label>
          <input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #d6d0c8", marginBottom: "16px" }} disabled={isGoogleOnlyAccount} />

          <label htmlFor="new-password" style={{ display: "block", marginBottom: "8px", fontSize: "12px", color: "#7d7a72", textTransform: "uppercase" }}>New password</label>
          <input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #d6d0c8" }} disabled={isGoogleOnlyAccount} />
          <p style={{ margin: "10px 0 0", color: strength.color, fontSize: "13px" }}>{strength.text}</p>

          <label htmlFor="confirm-password" style={{ display: "block", margin: "16px 0 8px", fontSize: "12px", color: "#7d7a72", textTransform: "uppercase" }}>Confirm new password</label>
          <input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #d6d0c8" }} disabled={isGoogleOnlyAccount} />
          {confirmPassword && !passwordsMatch && <p style={{ margin: "10px 0 0", color: "#b54848", fontSize: "13px" }}>Passwords must match before saving.</p>}
          {state.message && <p style={{ margin: "14px 0 0", color: "#3c7b52" }}>{state.message}</p>}
          {state.error && <p style={{ margin: "14px 0 0", color: "#b54848" }}>{state.error}</p>}

          <button
            type="submit"
            disabled={isGoogleOnlyAccount || !currentPassword || !passwordStrongEnough || !passwordsMatch || state.saving}
            style={{ marginTop: "18px", padding: "12px 16px", borderRadius: "10px", border: "1px solid #8db095", backgroundColor: "#dcebdc", color: "#2d5237", fontWeight: 600 }}
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