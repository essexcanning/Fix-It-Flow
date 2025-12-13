import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'pink';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 font-bold font-mono transition-all duration-100 flex items-center justify-center gap-2 text-sm border-2 border-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";
  
  const variants = {
    primary: "bg-banana text-black shadow-hard hover:bg-yellow-300 disabled:bg-gray-300 disabled:shadow-none disabled:border-gray-500 disabled:text-gray-500",
    secondary: "bg-white text-black shadow-hard hover:bg-gray-50 disabled:opacity-50",
    outline: "bg-transparent text-black border-2 border-black shadow-hard hover:bg-black hover:text-white",
    pink: "bg-hot-pink text-black shadow-hard hover:bg-pink-400"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${isLoading ? 'cursor-wait opacity-80' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
      )}
      {children}
    </button>
  );
};