import React from 'react';

interface AuthContainerProps {
  children: React.ReactNode;
  title: string;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ children, title }) => {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url(/images/Login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-md w-full -mt-10">
        <div className="bg-card-bg dark:bg-dark-bg p-8 shadow-xl rounded-xl backdrop-blur-sm bg-opacity-20 dark:bg-opacity-20 hover:bg-opacity-90 dark:hover:bg-opacity-90 transition-all duration-[1000ms] ease-in-out">
          <div className="flex justify-center mb-6">
            <img src="/images/Remi_namn40_neg.png" alt="REMI Story" className="h-8 w-auto" />
          </div>
          <h1 className="text-center text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
};