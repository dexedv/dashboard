import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
export function usePermissions() {
    const { user } = useAuth();
    const { data: permissionsResponse, isLoading, error } = useQuery({
        queryKey: ['myPermissions', user?.id],
        queryFn: () => api.getMyPermissions(),
        enabled: !!user?.id,
    });
    const permissions = permissionsResponse?.data || [];
    const permissionNames = new Set(permissions.map(p => p.name));
    const hasPermission = (permissionName) => {
        // Admins have all permissions
        if (user?.role === 'ADMIN')
            return true;
        return permissionNames.has(permissionName);
    };
    const hasAnyPermission = (permissionNamesToCheck) => {
        // Admins have all permissions
        if (user?.role === 'ADMIN')
            return true;
        return permissionNamesToCheck.some(name => permissionNames.has(name));
    };
    const hasAllPermissions = (permissionNamesToCheck) => {
        // Admins have all permissions
        if (user?.role === 'ADMIN')
            return true;
        return permissionNamesToCheck.every(name => permissionNames.has(name));
    };
    return {
        permissions,
        isLoading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    };
}
