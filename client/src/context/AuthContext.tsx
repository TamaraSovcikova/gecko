// AuthContext.tsx - Global authentication state for the entire app.
//
// What this does:
//   - Listens to Firebase for auth state changes (login, logout, token refresh)
//   - Stores the current user and their ID token so any component can access them
//   - Exposes a loading state so we don't flash the wrong page before Firebase
//     has confirmed whether the user is logged in or not

import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../firebase/config";

type AuthProfile = {
  displayName?: string;
  email?: string;
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

  const refreshProfile = async (overrideToken?: string | null) => {
    const activeToken = overrideToken ?? token;

    if (!activeToken) {
      setProfile(null);
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        },
      );

      setProfile({
        displayName: response.data?.displayName,
        email: response.data?.email,
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && auth.currentUser) {
        try {
          const refreshedToken = await auth.currentUser.getIdToken(true);
          const retryResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/v1/user/profile`,
            {
              headers: {
                Authorization: `Bearer ${refreshedToken}`,
              },
            },
          );

          setToken(refreshedToken);
          setProfile({
            displayName: retryResponse.data?.displayName,
            email: retryResponse.data?.email,
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

  useEffect(() => {
    // onIdTokenChanged also covers token refreshes after sensitive auth updates.
    const unsubscribe = onIdTokenChanged(auth, async (user: any) => {
      setCurrentUser(user);

      if (user) {
        const idToken = await user.getIdToken(false);
        setToken(idToken);
        await refreshProfile(idToken);
      } else {
        setToken(null);
        setProfile(null);
      }

      setLoading(false);
    });

    // Cleanup: stop listening when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, token, loading, profile, refreshProfile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — import this in any component that needs auth state
export const useAuth = () => useContext(AuthContext);
