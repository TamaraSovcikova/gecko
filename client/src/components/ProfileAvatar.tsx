import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

export const PROFILE_AVATAR_OPTIONS = [
  { value: "initial", label: "Default Initial", imageSrc: null },
  { value: "photo1", label: "Coin", imageSrc: "/coin.jpeg" },
  { value: "photo2", label: "Money Pouch", imageSrc: "/moneypouch.jpeg" },
  { value: "photo3", label: "Gecko", imageSrc: "/gecko.jpeg" },
  { value: "photo5", label: "Gecko Text", imageSrc: "/geckotext.jpeg" },
] as const;

export type ProfileAvatarChoice = (typeof PROFILE_AVATAR_OPTIONS)[number]["value"];

const AVATAR_SRC_BY_CHOICE: Record<Exclude<ProfileAvatarChoice, "initial">, string> = {
  photo1: "/coin.jpeg",
  photo2: "/moneypouch.jpeg",
  photo3: "/gecko.jpeg",
  photo5: "/geckotext.jpeg",
};

type ProfileAvatarProps = {
  size?: number;
  avatarChoice?: ProfileAvatarChoice;
  displayName?: string;
};

const ProfileAvatar = ({ size = 42, avatarChoice, displayName }: ProfileAvatarProps) => {
  const { currentUser, profile } = useAuth();
  const [imageFailed, setImageFailed] = useState(false);

  const effectiveAvatarChoice: ProfileAvatarChoice = useMemo(() => {
    const candidate = avatarChoice || profile?.avatarChoice;

    if (candidate === "photo1" || candidate === "photo2" || candidate === "photo3" || candidate === "photo5") {
      return candidate;
    }

    return "initial";
  }, [avatarChoice, profile?.avatarChoice]);

  useEffect(() => {
    setImageFailed(false);
  }, [effectiveAvatarChoice]);

  const avatarLetter = (
    displayName?.[0] ||
    profile?.displayName?.[0] ||
    currentUser?.displayName?.[0] ||
    currentUser?.email?.[0] ||
    "B"
  ).toUpperCase();

  const imageSrc = effectiveAvatarChoice === "initial" ? null : AVATAR_SRC_BY_CHOICE[effectiveAvatarChoice];
  const showImage = Boolean(imageSrc && !imageFailed);

  return (
    <div
      aria-label="User profile avatar"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: "1px solid #8b6fd4",
        background: "#5c3fa3",
        color: "#fffdf8",
        fontWeight: 700,
        fontSize: `${Math.max(14, Math.floor(size * 0.36))}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 16px rgba(58, 95, 67, 0.18)",
        overflow: "hidden",
      }}
    >
      {showImage ? (
        <img
          src={imageSrc as string}
          alt="User avatar"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        avatarLetter
      )}
    </div>
  );
};

export default ProfileAvatar;