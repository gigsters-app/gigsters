// src/roles/roles.seed.ts
export const STATIC_ROLES = [
    {
      name: 'superadmin',
      description: 'System super administrator with full access',
      isSuperAdmin: true,
    },
    {
      name: 'user',
      description: 'Standard user with limited access',
      isSuperAdmin: false,
    },
  ];