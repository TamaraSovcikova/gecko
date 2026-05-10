import { useAuth } from "../context/AuthContext";

type ProfileAvatarProps = {
  size?: number;
};

const ProfileAvatar = ({ size = 42 }: ProfileAvatarProps) => {
  const { currentUser, profile } = useAuth();

  const avatarLetter = (
    profile?.displayName?.[0] ||
    currentUser?.displayName?.[0] ||
    currentUser?.email?.[0] ||
    "B"
  ).toUpperCase();

  return (
    <div
      aria-label="User profile avatar"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: "1px solid #8b6fd4",
        background: "linear-gradient(135deg, #8b6fd4 0%, #5c3fa3 100%)",
        color: "#fffdf8",
        fontWeight: 700,
        fontSize: `${Math.max(14, Math.floor(size * 0.36))}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 16px rgba(58, 95, 67, 0.18)",
      }}
    >
      {avatarLetter}
    </div>
  );
};

export default ProfileAvatar;