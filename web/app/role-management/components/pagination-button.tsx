import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PaginationButtonProps = React.ComponentProps<typeof Button> & {
  active?: boolean;
};

export function PaginationButton({ active, className, ...props }: PaginationButtonProps) {
  return (
    <Button
      className={cn(
        'size-8 rounded border text-[12px] font-bold',
        active
          ? 'border-[#e2e2e2] bg-[#e2e2e2] text-[#2f3131] hover:bg-[#e2e2e2]/90'
          : 'border-[#444748] bg-transparent text-[#c4c7c7] hover:bg-[#2f282a]',
        className,
      )}
      size="icon"
      variant="outline"
      {...props}
    />
  );
}
