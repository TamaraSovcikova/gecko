import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import TopNav from "../../components/TopNav";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";

const mapFirebaseEmailError = (error: unknown) => {
  const errorCode = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: string }).code)
    : "";

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
    default:
      return errorCode
        ? `Unable to update email. Firebase returned ${errorCode}.`
        : "Unable to update email.";
  }
};

const cardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5dfd6",
  borderRadius: "14px",
  padding: "24px",
  boxShadow: "0 12px 24px rgba(77, 87, 69, 0.06)",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#7d7a72",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d6d0c8",
  backgroundColor: "#fffdf9",
};

const SettingsPage = () => {
  const { currentUser, token, loading, profile, refreshProfile, setProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [usernameState, setUsernameState] = useState({ saving: false, message: "", error: "" });
  const [emailState, setEmailState] = useState({ saving: false, message: "", error: "" });

  useEffect(() => {
    setUsername(profile?.displayName || "");
    setEmail(profile?.email || currentUser?.email || "");
  }, [profile, currentUser]);

  const usernameChanged = useMemo(() => {
    return username.trim() !== (profile?.displayName || "").trim();
  }, [profile, username]);

  const emailChanged = useMemo(() => {
    return email.trim().toLowerCase() !== (profile?.email || currentUser?.email || "").trim().toLowerCase();
  }, [currentUser, email, profile]);
  const supportsPasswordProvider = currentUser?.providerData?.some((provider: any) => provider.providerId === "password") ?? false;
  const isGoogleOnlyAccount = Boolean(currentUser) && !supportsPasswordProvider && (currentUser?.providerData?.some((provider: any) => provider.providerId === "google.com") ?? false);

  const handleUsernameSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setUsernameState({ saving: true, message: "", error: "" });

    const nextName = username.trim();

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/user/${currentUser.uid}/profile`,
        { displayName: nextName },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setProfile((prev) => ({ ...prev, displayName: response.data.displayName }));
      setUsername(response.data.displayName || "");
      setUsernameState({ saving: false, message: "Username updated.", error: "" });
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
      setEmailState({ saving: false, message: "", error: "No authenticated user found." });
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

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, emailPassword);
      await reauthenticateWithCredential(currentUser, credential);
      const updatedEmail = email.trim().toLowerCase();
      const activeUser = auth.currentUser || currentUser;

      await verifyBeforeUpdateEmail(activeUser, updatedEmail);
      await refreshProfile(token);
      setEmail(profile?.email || currentUser?.email || "");

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

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading account settings...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafaf8", padding: "24px" }}>
      <TopNav />
      <div style={{ maxWidth: "980px", margin: "24px auto 0" }}>
        <div style={{ marginBottom: "24px" }}>
          <p style={{ margin: 0, color: "#7e887e", letterSpacing: "0.08em", textTransform: "uppercase" }}>Account</p>
          <h1 style={{ margin: "8px 0 0", color: "#355f46", fontSize: "44px", fontWeight: 300 }}>Edit Account Details</h1>
        </div>

        {isGoogleOnlyAccount && (
          <div style={{ ...cardStyle, backgroundColor: "#fff7e9", borderColor: "#ecd8ad" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "10px", color: "#7b5a17" }}>Google sign-in notice</h2>
            <p style={{ margin: 0, color: "#70571f", lineHeight: 1.6 }}>
              This account is currently managed through Google sign-in. Username changes still work here,
              but email and password changes are not handled inside this app for Google-only accounts.
              Use your Google account settings if you need to change those credentials.
            </p>
          </div>
        )}

        <div style={{ display: "grid", gap: "20px" }}>
          <form onSubmit={handleUsernameSave} style={cardStyle}>
            <h2 style={{ fontSize: "20px", marginBottom: "14px", color: "#35483a" }}>Username</h2>
            <label style={labelStyle} htmlFor="username">Display name</label>
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} style={inputStyle} />
            {usernameState.message && <p style={{ margin: "10px 0 0", color: "#3c7b52" }}>{usernameState.message}</p>}
            {usernameState.error && <p style={{ margin: "10px 0 0", color: "#b54848" }}>{usernameState.error}</p>}
            <button
              type="submit"
              disabled={!usernameChanged || usernameState.saving || !username.trim()}
              style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "10px", border: "1px solid #8db095", backgroundColor: "#dcebdc", color: "#2d5237", fontWeight: 600 }}
            >
              {usernameState.saving ? "Saving..." : "Save username"}
            </button>
          </form>

          <form onSubmit={handleEmailSave} style={cardStyle}>
            <h2 style={{ fontSize: "20px", marginBottom: "14px", color: "#35483a" }}>Email address</h2>
            <label style={labelStyle} htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} disabled={isGoogleOnlyAccount} />
            <label style={{ ...labelStyle, marginTop: "14px" }} htmlFor="email-password">Current password</label>
            <input id="email-password" type="password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} style={inputStyle} disabled={isGoogleOnlyAccount} />
            <p style={{ margin: "10px 0 0", color: "#7d7a72", fontSize: "13px" }}>
              Firebase may require recent sign-in before sensitive email changes.
            </p>
            {emailState.message && <p style={{ margin: "10px 0 0", color: "#3c7b52" }}>{emailState.message}</p>}
            {emailState.error && <p style={{ margin: "10px 0 0", color: "#b54848" }}>{emailState.error}</p>}
            <button
              type="submit"
              disabled={isGoogleOnlyAccount || !emailChanged || emailState.saving || !emailPassword.trim()}
              style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "10px", border: "1px solid #8db095", backgroundColor: "#dcebdc", color: "#2d5237", fontWeight: 600 }}
            >
              {emailState.saving ? "Saving..." : "Save email"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;