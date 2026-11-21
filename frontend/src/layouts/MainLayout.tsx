import React, { ReactNode, useState, useCallback } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#E8EEF5] text-[#243447]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0">
        <Sidebar onClose={closeSidebar} />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-xs lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col lg:hidden shadow-modal animate-in slide-in-from-left duration-200">
            <Sidebar onClose={closeSidebar} isMobile />
          </aside>
        </>
      )}

      {/* Right column: Navbar + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Sticky navbar */}
        <Navbar onMenuClick={toggleSidebar} />

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 bg-[#E8EEF5]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
