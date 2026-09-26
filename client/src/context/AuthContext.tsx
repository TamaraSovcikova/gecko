// AuthContext.tsx - Global authentication state for the entire app.
//
// What this does:
//   - Listens to Firebase for auth state changes (login, logout, token refresh)
//   - Stores the current user and their ID token so any component can access them
//   - Exposes a loading state so we don't flash the wrong page before Firebase
//     has confirmed whether the user is logged in or not
//   - Implements 1-hour session timeout for security

import axios from "axios";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onIdTokenChanged, signOut } from "../firebase/authClient";
import { auth } from "../firebase/config";
import { setAuthToken } from "../api/client";

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

type AuthProfile = {
  displayName?: string;
  email?: string;
  avatarChoice?: "initial" | "photo1" | "photo2" | "photo3" | "photo5";
  onboardingCompletedPages?: string[];
  newsletterOptIn?: boolean;
  seenSnapshotPopupKeys?: string[];
  payslipData?: {
    jobTitle?: string;
    location?: string;
    grossSalary?: number;
  };
};

interface AuthContextType {
  currentUser: any | null;
  token: string | null;
  loading: boolean;
  profile: AuthProfile | null;
  refreshProfile: (overrideToken?: string | null) => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<AuthProfile | null>>;
}

// Create the context with defaults
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  token: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
  setProfile: () => null,
});

// AuthProvider wraps the whole app (see main.tsx) so every component
// can call useAuth() to get the current user and token
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirror the token into the shared axios client so TanStack Query hooks
  // (and any direct apiClient.get/post call) carry Authorization automatically.
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const refreshProfile = async (overrideToken?: string | null) => {
    const activeToken = overrideToken ?? token;

    if (!activeToken) {
      setProfile(null);
      return;
    }

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      setProfile({
        displayName: response.data?.displayName,
        email: response.data?.email,
        avatarChoice: response.data?.avatarChoice,
        onboardingCompletedPages: response.data?.financialOnboarding?.completedPages || [],
        newsletterOptIn: Boolean(response.data?.newsletterOptIn),
        seenSnapshotPopupKeys: Array.isArray(response.data?.seenSnapshotPopupKeys)
          ? response.data.seenSnapshotPopupKeys
          : [],
        payslipData: {
          jobTitle: response.data?.payslipData?.jobTitle,
          location: response.data?.payslipData?.location,
          grossSalary: response.data?.payslipData?.grossSalary,
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && auth.currentUser) {
        try {
          const refreshedToken = await auth.currentUser.getIdToken(true);
          const retryResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, {
            headers: {
              Authorization: `Bearer ${refreshedToken}`,
            },
          });

          setToken(refreshedToken);
          setProfile({
            displayName: retryResponse.data?.displayName,
            email: retryResponse.data?.email,
            avatarChoice: retryResponse.data?.avatarChoice,
            onboardingCompletedPages: retryResponse.data?.financialOnboarding?.completedPages || [],
            newsletterOptIn: Boolean(retryResponse.data?.newsletterOptIn),
            seenSnapshotPopupKeys: Array.isArray(retryResponse.data?.seenSnapshotPopupKeys)
              ? retryResponse.data.seenSnapshotPopupKeys
              : [],
            payslipData: {
              jobTitle: retryResponse.data?.payslipData?.jobTitle,
              location: retryResponse.data?.payslipData?.location,
              grossSalary: retryResponse.data?.payslipData?.grossSalary,
            },
          });
          return;
        } catch (retryError) {
          console.error("Profile retry after token refresh failed", retryError);
        }
      }

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setProfile(null);
        return;
      }

      console.error("Failed to refresh profile", error);
    }
  };

  // Reset session timeout on user activity
  const resetSessionTimeout = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    if (currentUser) {
      timeoutIdRef.current = setTimeout(() => {
        signOut(auth);
        setCurrentUser(null);
        setToken(null);
        setProfile(null);
      }, SESSION_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    // onIdTokenChanged also covers token refreshes after sensitive auth updates.
    const unsubscribe = onIdTokenChanged(auth, async (user: any) => {
      setCurrentUser(user);

      if (user) {
        const idToken = await user.getIdToken(false);
        setToken(idToken);
        await refreshProfile(idToken);
        resetSessionTimeout();
      } else {
        setToken(null);
        setProfile(null);
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      }

      setLoading(false);
    });

    // Set up activity listeners to reset timeout
    const activityListener = () => {
      if (currentUser) {
        resetSessionTimeout();
      }
    };

    window.addEventListener("click", activityListener);
    window.addEventListener("keydown", activityListener);
    window.addEventListener("mousemove", activityListener);

    // Cleanup: stop listening and clear timeout when the component unmounts
    return () => {
      unsubscribe();
      window.removeEventListener("click", activityListener);
      window.removeEventListener("keydown", activityListener);
      window.removeEventListener("mousemove", activityListener);
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        profile,
        refreshProfile,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook - import this in any component that needs auth state
export const useAuth = () => useContext(AuthContext);
