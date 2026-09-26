import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

export default function EmailVerificationBanner() {
  const { currentUser } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!currentUser || currentUser.emailVerified) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendEmailVerification(currentUser);
      setSent(true);
    } catch {
      // ignore - likely rate-limited
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-3 text-sm text-amber-800">
      <span className="font-medium">Verify your email</span>
      <span className="text-amber-600">Check your inbox for a verification link to unlock all features.</span>
      {sent ? (
        <span className="ml-auto text-green-700 font-medium">Email sent!</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={loading}
          className="ml-auto text-purple-700 font-medium hover:underline disabled:opacity-50"
        >
          {loading ? "Sending..." : "Resend email"}
        </button>
      )}
    </div>
  );
}
