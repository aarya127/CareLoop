/**
 * Floating Action Button (FAB)
 * + Book button for creating new appointments
 */

'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export default function FloatingActionButton({
  onClick,
  label = 'Book',
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="
        group fixed bottom-8 right-8 z-50 
        flex h-16 items-center gap-2 
        rounded-full bg-gradient-to-r from-[#87CEEB] to-[#6BA8D9] 
        px-6 text-white shadow-lg 
        transition-all duration-200
        hover:shadow-xl
        focus:outline-none focus:ring-4 focus:ring-[#87CEEB]/30
      "
      style={{
        boxShadow: '0 8px 16px rgba(135, 206, 235, 0.4)',
      }}
    >
      {/* Plus Icon */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
        <Plus size={20} className="text-white" strokeWidth={2.5} />
      </div>

      {/* Label */}
      <span className="text-base font-semibold">{label}</span>

      {/* Ripple effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white"
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}

/**
 * Compact FAB variant for mobile
 */
export function CompactFAB({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="
        fixed bottom-6 right-6 z-50 
        flex h-14 w-14 items-center justify-center 
        rounded-full bg-gradient-to-r from-[#87CEEB] to-[#6BA8D9] 
        text-white shadow-lg 
        transition-all duration-200
        hover:shadow-xl
        focus:outline-none focus:ring-4 focus:ring-[#87CEEB]/30
      "
      style={{
        boxShadow: '0 8px 16px rgba(135, 206, 235, 0.4)',
      }}
      aria-label="Create new booking"
    >
      <Plus size={24} strokeWidth={2.5} />
    </motion.button>
  );
}
