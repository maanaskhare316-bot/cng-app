import React, { ReactNode, useState, useCallback } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar  = useCallback(() => setIsSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* ── Desktop Sidebar (always visible ≥ lg) ───────── */}
      <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0">
        <Sidebar onClose={closeSidebar} />
      </aside>

      {/* ── Mobile Sidebar Drawer ────────────────────────── */}
      {isSidebarOpen && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          {/* drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col lg:hidden
                            animate-[slideInLeft_0.25s_ease-out]">
            <Sidebar onClose={closeSidebar} isMobile />
          </aside>
        </>
      )}

      {/* ── Right column: Navbar + content ──────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Fixed top navbar */}
        <header
          className="sticky top-0 z-30 h-[56px] flex-shrink-0 bg-white border-b border-slate-200 shadow-sm"
        >
          <Navbar onMenuClick={toggleSidebar} />
        </header>

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
