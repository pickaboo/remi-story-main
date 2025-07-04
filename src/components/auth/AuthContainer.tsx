
import React from 'react';

interface AuthContainerProps {
  children: React.ReactNode;
  title: string;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* You can add a logo here if desired */}
          {/* <img className="mx-auto h-12 w-auto" src="YOUR_LOGO_URL" alt="REMI Story" /> */}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        </div>
        <div className="bg-card-bg dark:bg-slate-800 p-8 shadow-xl rounded-xl">
          {children}
        </div>
      </div>
    </div>
  );
};