import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading,
  className = "",
  disabled,
  ...props
}) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow",
  };

  return (
    <button
      className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
      ) : (
        children
      )}
    </button>
  );
};
