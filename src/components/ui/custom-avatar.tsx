import React from "react";

export interface AvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg";
  src?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = "md", src, className = "" }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold flex items-center justify-center shadow-sm select-none ${className}`}
    >
      {initials}
    </div>
  );
};
