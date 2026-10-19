/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  History,
  Globe,
  FileCode,
  BookOpen,
  Info,
  Menu,
  X,
  Lock,
} from 'lucide-react';

export type MainNavTab = 'home' | 'website-checker' | 'file-checker' | 'learn-scams' | 'about';

interface HeaderProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  onOpenHistory: () => void;
  onGoToOwner: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenHistory,
  onGoToOwner,
  historyCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: MainNavTab; label: string; icon: any }> = [
    { id: 'home', label: 'Home', icon: Shield },
    { id: 'website-checker', label: 'Website Checker', icon: Globe },
    { id: 'file-checker', label: 'File Checker', icon: FileCode },
    { id: 'learn-scams', label: 'Learn About Scams', icon: BookOpen },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleNavClick = (tab: MainNavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-[#D8DCE2] bg-[#FFFFFF] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo / Brand */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D7773] rounded shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center text-[#F5F2EA] shadow-xs group-hover:bg-[#2D7773] transition-colors">
              <Shield className="w-4 h-4 text-[#D5A64A]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#111827] whitespace-nowrap block leading-tight">
                TRUST<span className="text-[#2D7773] font-mono">//</span>CHECK
              </span>
              <span className="text-[10px] text-[#697386] font-mono font-medium block">
                Looks real. But is it?
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 lg:gap-4 text-xs font-semibold uppercase tracking-wider text-[#697386]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#F5F2EA] text-[#111827] font-bold border border-[#D8DCE2]'
                      : 'hover:text-[#111827] hover:bg-[#F5F2EA]/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2D7773]' : 'text-[#697386]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Session History & Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EA] hover:bg-[#EBE7DC] border border-[#D8DCE2] rounded-lg text-xs font-semibold text-[#111827] transition-colors"
              title="Recent investigation lookups"
            >
              <History className="w-3.5 h-3.5 text-[#2D7773]" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[#2D7773] text-white rounded-full text-[10px] font-mono">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#697386] hover:text-[#111827] rounded-lg focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#D8DCE2] space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? 'bg-[#111827] text-white'
                      : 'text-[#697386] hover:bg-[#F5F2EA] hover:text-[#111827]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 mt-2 border-t border-[#D8DCE2]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoToOwner();
                }}
                className="w-full text-left px-3 py-2 text-xs font-mono text-[#697386] hover:text-[#111827] flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-[#D5A64A]" />
                <span>Owner Console</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
