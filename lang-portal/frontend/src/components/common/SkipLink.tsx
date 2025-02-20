import React from 'react';

interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, children }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white dark:focus:bg-gray-800 focus:text-primary-600 dark:focus:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {children}
    </a>
  );
}; 