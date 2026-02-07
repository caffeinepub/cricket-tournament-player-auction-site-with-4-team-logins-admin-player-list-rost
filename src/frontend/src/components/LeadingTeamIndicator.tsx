import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LeadingTeamIndicatorProps {
  teamName: string;
  className?: string;
}

export default function LeadingTeamIndicator({ teamName, className = '' }: LeadingTeamIndicatorProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge 
        variant="default" 
        className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md animate-leading-glow motion-reduce:animate-none"
      >
        <Crown className="w-3.5 h-3.5 mr-1.5" />
        Leading
      </Badge>
      <span className="font-semibold text-amber-700 dark:text-amber-400">
        {teamName}
      </span>
    </div>
  );
}
