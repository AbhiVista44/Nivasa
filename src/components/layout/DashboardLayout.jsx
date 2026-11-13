import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AdminDashboard } from '../../pages/admin/AdminDashboard';
import { ResidentDashboard } from '../../pages/resident/ResidentDashboard';
import { SecurityDashboard } from '../../pages/security/SecurityDashboard';
import { VendorDashboard } from '../../pages/vendor/VendorDashboard';
import { Building2, X } from 'lucide-react';

export const DashboardLayout = () => {
  const { role, society } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (role === 'security') return 'gate-console';
    if (role === 'vendor') return 'assigned-jobs';
    if (role === 'resident') return 'home';
    return 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync default tab if role switches
  useEffect(() => {
    if (role === 'security') {
      if (activeTab !== 'deliveries' && activeTab !== 'gate-console') {
        setActiveTab('gate-console');
      }
    } else if (role === 'vendor') {
      if (!['assigned-jobs', 'schedule', 'history', 'profile'].includes(activeTab)) {
        setActiveTab('assigned-jobs');
      }
    }
  }, [role]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard activeTab={activeTab} onNavigate={setActiveTab} />;
      case 'resident':
        return <ResidentDashboard activeTab={activeTab} onNavigate={setActiveTab} />;
      case 'security':
        return <SecurityDashboard activeTab={activeTab} onNavigate={setActiveTab} />;
      case 'vendor':
        return <VendorDashboard activeTab={activeTab} onNavigate={setActiveTab} />;
      default:
        return <ResidentDashboard activeTab={activeTab} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans w-full">
      {/* Top Navbar - Full width */}
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Multi-Tenant Active Banner - Full width */}
      <div className="bg-teal-950 text-teal-100 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 xl:px-10 border-b border-teal-800 w-full shrink-0">
        <div className="flex items-center gap-2 w-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate text-[10px] sm:text-[11px]">
            Connected to <strong>{society?.name}</strong> ({society?.code}) • <span className="hidden sm:inline">Sector: {society?.city} • Tenant Isolation Verified</span>
          </span>
          <span className="ml-auto hidden md:inline-block font-mono text-amber-300 text-[10px] shrink-0">
            Role: {role.toUpperCase()} MODE
          </span>
        </div>
      </div>

      {/* Main Workspace Body - Fills 100% of the screen width */}
      <div className="flex-1 flex w-full min-w-0">
        {/* Desktop Sidebar (visible on md: and above) */}
        <div className="hidden md:flex shrink-0">
          <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        </div>
        
        {/* Main Content Area - Expands to fill screen with generous padding */}
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Slide-Over Drawer (visible on < md:) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200 border-r border-slate-800">
            <div className="px-4 py-3.5 bg-slate-950 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                <span className="font-bold text-white text-sm">Navigation Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }}
                isMobileDrawer={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
