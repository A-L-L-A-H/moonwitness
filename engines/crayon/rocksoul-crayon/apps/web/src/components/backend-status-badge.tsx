import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api-client';

export function BackendStatusBadge() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      try {
        await api.request('/health');
        if (mounted) {
          setOnline(true);
        }
      } catch {
        if (mounted) {
          setOnline(false);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (online === null) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-pointer">
            <span
              className={`inline-block size-2 rounded-full ${
                online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <Badge
              variant={online ? 'outline' : 'destructive'}
              className="text-[10px] px-1.5 py-0 font-medium tracking-tight"
            >
              {online ? 'API Live' : 'API Offline'}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {online ? 'Backend health check succeeded.' : 'Backend health check failed.'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
