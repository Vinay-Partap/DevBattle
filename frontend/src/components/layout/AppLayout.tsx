import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';
import { Footer } from './Footer';

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarOffsetClass = isSidebarCollapsed ? 'pl-16' : 'pl-64';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div className={`flex-1 min-w-0 transition-[padding] duration-300 ${sidebarOffsetClass}`}>
          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
            <Breadcrumb />
            <Outlet />
          </main>
        </div>
      </div>

      <div className={`transition-[padding] duration-300 ${sidebarOffsetClass}`}>
        <Footer />
      </div>
    </div>
  );
};
