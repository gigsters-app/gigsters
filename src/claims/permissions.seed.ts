// src/claims/permissions.seed.ts

export const STATIC_CLAIMS = [
  // 🔹 User Claims
  { name: 'user:create', description: 'Create a new user' },
  { name: 'user:read:all', description: 'Read all users' },
  { name: 'user:read', description: 'Read a specific user by ID' },
  { name: 'user:read:email', description: 'Read a user by email' },
  { name: 'user:update', description: 'Update own user profile or any user with permission' },
  { name: 'user:delete', description: 'Soft delete a user' },
  { name: 'user:restore', description: 'Restore a soft-deleted user' },

  // 🔹 Business Profile Claims
  { name: 'business-profile:create', description: 'Create a new business profile for a user' },
  { name: 'business-profile:register', description: 'Register own business profile (only one allowed)' },
  { name: 'business-profile:read:all', description: 'Read all business profiles' },
  { name: 'business-profile:read', description: 'Read a specific business profile' },
  { name: 'business-profile:update', description: 'Update own or any business profile if authorized' },
  { name: 'business-profile:delete', description: 'Delete a business profile' },

  // 🔹 Role Claims
  { name: 'roles:create', description: 'Create a new role' },
  { name: 'roles:read:all', description: 'Read all roles' },
  { name: 'roles:read', description: 'Read a specific role' },
  { name: 'roles:update', description: 'Update a role' },
  { name: 'roles:delete', description: 'Delete a role' },

  // 🔹 Claim Management Claims
  { name: 'claims:create', description: 'Create a new claim' },
  { name: 'claims:read:all', description: 'Read all claims' },
  { name: 'claims:read', description: 'Read a specific claim' },
  { name: 'claims:update', description: 'Update a claim' },
  { name: 'claims:delete', description: 'Delete a claim' },
];