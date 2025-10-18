'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn, getInitials } from '@/lib/utils';
import {
  Users,
  Calendar,
  Phone,
  CreditCard,
  BarChart3,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Calls', href: '/calls', icon: Phone },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Insights', href: '/insights', icon: BarChart3 },
  { label: 'Support', href: '/support', icon: HelpCircle },
];

export function Navigation() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-all duration-200',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl shadow-sm'
          : 'bg-background'
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="font-semibold text-lg">CareLoop</span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {getInitials('Dr. Smith')}
                </span>
              </div>
              <span className="hidden md:inline text-sm font-medium">
                Dr. Smith
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
