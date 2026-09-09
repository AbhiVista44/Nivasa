import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AdminDashboard } from '../../pages/admin/AdminDashboard';
import { ResidentDashboard } from '../../pages/resident/ResidentDashboard';
import { SecurityDashboard } from '../../pages/security/SecurityDashboard';
import { VendorDashboard } from '../../pages/vendor/VendorDashboard';

export const DashboardLayout = () => {
  const { role, society } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard onNavigate={setActiveTab} />;
      case 'resident':
        return <ResidentDashboard onNavigate={setActiveTab} />;
      case 'security':
        return <SecurityDashboard onNavigate={setActiveTab} />;
      case 'vendor':
        return <VendorDashboard onNavigate={setActiveTab} />;
      default:
        return <ResidentDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* Multi-Tenant Active Banner */}
      <div className="bg-teal-950 text-teal-100 text-[11px] py-1.5 px-4 sm:px-6 border-b border-teal-800 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Connected to <strong>{society?.name}</strong> ({society?.code}) • Sector: {society?.city} • Tenant Isolation Verified
          </span>
          <span className="ml-auto hidden md:inline-block font-mono text-amber-300 text-[10px]">
            Role: {role.toUpperCase()} MODE
          </span>
        </div>
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-5xl">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
