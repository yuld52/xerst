import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 transition-colors ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
