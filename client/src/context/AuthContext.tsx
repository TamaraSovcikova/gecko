// AuthContext.tsx - Global authentication state for the entire app.
//
// What this does:
//   - Listens to Firebase for auth state changes (login, logout, token refresh)
//   - Stores the current user and their ID token so any component can access them
//   - Exposes a loading state so we don't flash the wrong page before Firebase
//     has confirmed whether the user is logged in or not

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  loading: boolean;
}

// Create the context with defaults
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  token: null,
  loading: true,
});

// AuthProvider wraps the whole app (see main.tsx) so every component
// can call useAuth() to get the current user and token
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires every time the user logs in or out,
    // and once immediately on page load to restore the session if one exists
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Get the Firebase ID token
        // forceRefresh: false means it uses the cached token if it hasn't expired
        const idToken = await user.getIdToken(false);
        setToken(idToken);
      } else {
        setToken(null);
      }

      // Firebase has confirmed auth state - safe to render the app now
      setLoading(false);
    });

    // Cleanup: stop listening when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — import this in any component that needs auth state
export const useAuth = () => useContext(AuthContext);
