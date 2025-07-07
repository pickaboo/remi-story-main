
import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, title }) => {
  return (
    // Added max-w-6xl mx-auto w-full to constrain width and center.
    // Original py-8 sm:px-6 lg:px-8 will now act as padding *within* this max-width container.
    <main className="py-8 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full"> 
      {title && (
        <div className="px-4 sm:px-0"> {/* Ensure title aligns with inner card padding if outer padding is different */}
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">{title}</h1>
        </div>
      )}
      {/* min-h is now viewport height minus header height (h-16 -> 4rem) */}
      {/* Reverted to bg-card-bg (solid white) and removed backdrop-blur */}
      <div className="px-4 py-6 sm:p-8 bg-card-bg dark:bg-dark-bg shadow-xl rounded-xl min-h-[calc(100vh-4rem-4rem)]">
        {children}
      </div>
    </main>
  );
};