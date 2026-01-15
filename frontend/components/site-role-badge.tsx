import { Badge } from '@/components/ui/badge';
import { SiteRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SiteRoleBadgeProps {
  role: SiteRole;
  className?: string;
}

export function SiteRoleBadge({ role, className }: SiteRoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('border-2', className)}
      style={{
        borderColor: role.color || '#94A3B8',
        color: role.color || '#64748B',
      }}
    >
      {role.name}
    </Badge>
  );
}

interface SiteRoleBadgesProps {
  roles: SiteRole[];
  max?: number;
  className?: string;
}

export function SiteRoleBadges({ roles, max = 3, className }: SiteRoleBadgesProps) {
  const visibleRoles = roles.slice(0, max);
  const remainingCount = roles.length - max;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visibleRoles.map((role) => (
        <SiteRoleBadge key={role.id} role={role} />
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
