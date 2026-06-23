import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SlaBadgeProps {
  created_at: string;
  sla_due_at: string;
  resolved_at?: string | null;
  status: string;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({ created_at, sla_due_at, resolved_at, status }) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [badgeStyle, setBadgeStyle] = useState<string>('');

  useEffect(() => {
    const calculateSla = () => {
      const now = new Date();
      const due = new Date(sla_due_at);
      const isResolved = status === 'Resolved' || status === 'Closed';

      if (isResolved) {
        const resolveTime = resolved_at ? new Date(resolved_at) : now;
        const met = resolveTime <= due;
        
        if (met) {
          setTimeLeftStr('SLA Met');
          setBadgeStyle('bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30');
        } else {
          setTimeLeftStr('SLA Breached');
          setBadgeStyle('bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30');
        }
        return;
      }

      // Open ticket countdown
      const diffMs = due.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeLeftStr('Breached');
        setBadgeStyle('bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30 animate-pulse');
        return;
      }

      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);

      let str = '';
      if (diffHrs > 0) str += `${diffHrs}h `;
      str += `${diffMins}m remaining`;

      setTimeLeftStr(str);

      // Warning thresholds
      if (diffMs < 3600000) { // < 1 hour
        setBadgeStyle('bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30');
      } else {
        setBadgeStyle('bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30');
      }
    };

    calculateSla();
    const interval = setInterval(calculateSla, 30000); // update every 30s

    return () => clearInterval(interval);
  }, [sla_due_at, resolved_at, status]);

  const getIcon = () => {
    if (status === 'Resolved' || status === 'Closed') {
      const due = new Date(sla_due_at);
      const resolveTime = resolved_at ? new Date(resolved_at) : new Date();
      return resolveTime <= due ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />;
    }
    return <Clock className="h-3 w-3" />;
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeStyle}`}>
      {getIcon()}
      <span>{timeLeftStr}</span>
    </span>
  );
};
