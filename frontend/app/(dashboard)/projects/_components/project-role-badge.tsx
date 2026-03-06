import { Badge } from '@/components/ui/badge';
import { ProjectRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProjectRoleBadgeProps {
  role: ProjectRole;
  className?: string;
}

export function ProjectRoleBadge({ role, className }: ProjectRoleBadgeProps) {
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

interface ProjectRoleBadgesProps {
  roles: ProjectRole[];
  max?: number;
  className?: string;
}

export function ProjectRoleBadges({ roles, max = 3, className }: ProjectRoleBadgesProps) {
  const visibleRoles = roles.slice(0, max);
  const remainingCount = roles.length - max;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visibleRoles.map((role) => (
        <ProjectRoleBadge key={role.id} role={role} />
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
