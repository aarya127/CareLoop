'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  sparkline?: number[];
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function KPICard({
  title,
  value,
  trend,
  sparkline,
  icon,
  className,
  onClick,
}: KPICardProps) {
  const hasPositiveTrend = trend !== undefined && trend > 0;
  const hasNegativeTrend = trend !== undefined && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
    >
      <Card
        hover={!!onClick}
        onClick={onClick}
        className={cn('overflow-hidden', className)}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {icon && <div className="text-muted-foreground">{icon}</div>}
          </div>
          
          <div className="flex items-baseline gap-2">
            <motion.div
              className="text-3xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {value}
            </motion.div>
            
            {trend !== undefined && (
              <div
                className={cn(
                  'flex items-center text-xs font-medium',
                  hasPositiveTrend && 'text-green-600',
                  hasNegativeTrend && 'text-red-600'
                )}
              >
                {hasPositiveTrend && <TrendingUp className="h-3 w-3 mr-1" />}
                {hasNegativeTrend && <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>

          {sparkline && sparkline.length > 0 && (
            <div className="mt-4 h-8">
              <MiniSparkline data={sparkline} />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  return (
    <div className="flex items-end justify-between h-full gap-0.5">
      {data.map((value, index) => {
        const height = range === 0 ? 50 : ((value - min) / range) * 100;
        return (
          <motion.div
            key={index}
            className="flex-1 bg-primary/20 rounded-t-sm"
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          />
        );
      })}
    </div>
  );
}
