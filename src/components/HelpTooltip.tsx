import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HELP_TOOLTIPS } from '@/lib/help-content';

interface HelpTooltipProps {
  field: keyof typeof HELP_TOOLTIPS;
  className?: string;
}

export function HelpTooltip({ field, className = '' }: HelpTooltipProps) {
  const text = HELP_TOOLTIPS[field];
  if (!text) return null;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button type="button" className={`inline-flex items-center text-muted-foreground hover:text-primary transition-colors ${className}`}>
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
