import React from 'react';
import { Feather } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-stone-950">
      <header className="flex-none h-16 bg-stone-900/80 backdrop-blur-md border-b border-stone-800 flex items-center justify-between px-8 z-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center shadow-lg shadow-stone-900/50">
             <Feather className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-wide text-stone-100">LEA</h1>
          </div>
        </div>
        <div className="text-xs font-medium tracking-widest uppercase text-stone-500">Literary Expansion Architect</div>
      </header>
      <main className="flex-1 overflow-hidden relative flex">
        {children}
      </main>
    </div>
  );
};