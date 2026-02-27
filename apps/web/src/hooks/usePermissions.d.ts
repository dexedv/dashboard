export declare function usePermissions(): {
    permissions: {
        id: string;
        name: string;
        description: string;
        category: string;
    }[];
    isLoading: boolean;
    error: Error;
    hasPermission: (permissionName: string) => boolean;
    hasAnyPermission: (permissionNamesToCheck: string[]) => boolean;
    hasAllPermissions: (permissionNamesToCheck: string[]) => boolean;
};
//# sourceMappingURL=usePermissions.d.ts.map