'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, MessageSquare, Sparkles, Settings, User, Search, Bell } from 'lucide-react';
import { useState } from 'react';

export default function TopNavigation() {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  const navItems = [
    { href: '/patients', label: 'Patients', icon: Users },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/engagement', label: 'Messages', icon: MessageSquare, comingSoon: true },
  ];

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-sky-400 rounded-lg flex items-center justify-center group-hover:bg-sky-500 transition-colors">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">CareLoop</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              if (item.comingSoon) {
                return (
                  <div
                    key={item.href}
                    className="relative px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                    ${active 
                      ? 'text-sky-400 bg-sky-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sky-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side - Search, Notifications & Profile */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-600 group-hover:text-sky-400 transition-colors" />
            </button>

            {/* Notifications */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-sky-400 transition-colors" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-sky-600" />
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-gray-900">Dr. Smith</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">Dr. Sarah Smith</div>
                      <div className="text-xs text-gray-500">smith@careloop.com</div>
                    </div>
                    
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Add logout logic here
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 mt-4 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-gray-400 min-w-fit"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-fit
                  ${active 
                    ? 'text-sky-400 bg-sky-50' 
                    : 'text-gray-600'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {active && (
                  <div className="w-full h-0.5 bg-sky-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Global Search Bar (Slide-in from top) */}
      {showSearchBar && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-30 animate-slide-down">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients, appointments, or insurance providers..."
                autoFocus
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowSearchBar(false);
                }}
              />
              <button
                onClick={() => setShowSearchBar(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ESC
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-100 rounded">⌘</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">K</kbd> to search anytime
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for search */}
      {showSearchBar && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20"
          onClick={() => setShowSearchBar(false)}
        />
      )}
    </header>
  );
}
