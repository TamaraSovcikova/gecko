// authApi.ts - Functions that call the backend auth routes.
// All requests include the Firebase ID token in the Authorization header
// so the backend middleware can verify the user is who they say they are.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Called after Firebase creates a new user.
// Tells the backend to create a User document in MongoDB.
// Returns firstLogin: true if this is a brand new user.
export const registerUser = async (token: string, displayName?: string) => {
  const response = await axios.post(
    `${API_URL}/api/v1/auth/register`,
    displayName ? { displayName } : {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
};
