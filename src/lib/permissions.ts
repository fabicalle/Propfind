import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { getServerSession } from '@/lib/supabase/server';
import type { user_role } from '@prisma/client';

export type Role = user_role;

export const ROLES: Role[] = ['FINDER', 'OWNER', 'REALTOR', 'DEVELOPER_B2B', 'ADMIN'];

const ROLE_HIERARCHY: Role[] = ['FINDER', 'OWNER', 'REALTOR', 'DEVELOPER_B2B', 'ADMIN'];

export enum Permission {
  VIEW_PROPERTIES = 'view_properties',
  SEARCH_PROPERTIES = 'search_properties',
  SAVE_FAVORITES = 'save_favorites',
  REPORT_PROPERTIES = 'report_properties',
  CREATE_PROPERTY = 'create_property',
  EDIT_OWN_PROPERTY = 'edit_own_property',
  PAUSE_OWN_PROPERTY = 'pause_own_property',
  DELETE_OWN_PROPERTY = 'delete_own_property',
  UNLIMITED_LISTINGS = 'unlimited_listings',
  VIEW_BUSINESS_CONTACT = 'view_business_contact',
  MANAGE_DEVELOPMENTS = 'manage_developments',
  DASHBOARD_ACCESS = 'dashboard_access',
  MODERATE_REPORTS = 'moderate_reports',
  MANAGE_USERS = 'manage_users',
}

const PERMISSION_MATRIX: Record<Role, Permission[]> = {
  FINDER: [
    Permission.VIEW_PROPERTIES,
    Permission.SEARCH_PROPERTIES,
    Permission.SAVE_FAVORITES,
    Permission.REPORT_PROPERTIES,
  ],
  OWNER: [
    Permission.VIEW_PROPERTIES,
    Permission.SEARCH_PROPERTIES,
    Permission.SAVE_FAVORITES,
    Permission.REPORT_PROPERTIES,
    Permission.CREATE_PROPERTY,
    Permission.EDIT_OWN_PROPERTY,
    Permission.PAUSE_OWN_PROPERTY,
    Permission.DELETE_OWN_PROPERTY,
  ],
  REALTOR: [
    Permission.VIEW_PROPERTIES,
    Permission.SEARCH_PROPERTIES,
    Permission.SAVE_FAVORITES,
    Permission.REPORT_PROPERTIES,
    Permission.CREATE_PROPERTY,
    Permission.EDIT_OWN_PROPERTY,
    Permission.PAUSE_OWN_PROPERTY,
    Permission.DELETE_OWN_PROPERTY,
    Permission.UNLIMITED_LISTINGS,
    Permission.VIEW_BUSINESS_CONTACT,
  ],
  DEVELOPER_B2B: [
    Permission.VIEW_PROPERTIES,
    Permission.SEARCH_PROPERTIES,
    Permission.SAVE_FAVORITES,
    Permission.REPORT_PROPERTIES,
    Permission.CREATE_PROPERTY,
    Permission.EDIT_OWN_PROPERTY,
    Permission.PAUSE_OWN_PROPERTY,
    Permission.DELETE_OWN_PROPERTY,
    Permission.UNLIMITED_LISTINGS,
    Permission.VIEW_BUSINESS_CONTACT,
    Permission.MANAGE_DEVELOPMENTS,
  ],
  ADMIN: [
    Permission.VIEW_PROPERTIES,
    Permission.SEARCH_PROPERTIES,
    Permission.SAVE_FAVORITES,
    Permission.REPORT_PROPERTIES,
    Permission.CREATE_PROPERTY,
    Permission.EDIT_OWN_PROPERTY,
    Permission.PAUSE_OWN_PROPERTY,
    Permission.DELETE_OWN_PROPERTY,
    Permission.UNLIMITED_LISTINGS,
    Permission.VIEW_BUSINESS_CONTACT,
    Permission.MANAGE_DEVELOPMENTS,
    Permission.DASHBOARD_ACCESS,
    Permission.MODERATE_REPORTS,
    Permission.MANAGE_USERS,
  ],
};

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSION_MATRIX[role].includes(permission);
}

export function hasMinimumRole(role: Role | null | undefined, minRole: Role): boolean {
  if (!role) return false;
  const roleIndex = ROLE_HIERARCHY.indexOf(role);
  const minIndex = ROLE_HIERARCHY.indexOf(minRole);
  return roleIndex >= minIndex;
}

export function hasRole(role: Role | null | undefined, allowedRoles: Role[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: Role;
}

export class UnauthorizedError extends Error {
  constructor(message = 'No autorizado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export async function getCurrentUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
  const session = request ? await getSessionFromRequest(request) : await getServerSession();

  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: (user.role as Role) || 'FINDER',
  };
}

export function requireRole(allowedRoles: Role[]): (user: AuthenticatedUser | null) => void {
  return (user: AuthenticatedUser | null) => {
    if (!user) throw new UnauthorizedError();
    if (!hasRole(user.role, allowedRoles)) throw new UnauthorizedError();
  };
}

export function requirePermission(permission: Permission): (user: AuthenticatedUser | null) => void {
  return (user: AuthenticatedUser | null) => {
    if (!user) throw new UnauthorizedError();
    if (!hasPermission(user.role, permission)) throw new UnauthorizedError();
  };
}

export function assertOwnerOrAdmin(
  resourceUserId: string,
  currentUser: AuthenticatedUser | null,
): void {
  if (!currentUser) throw new UnauthorizedError();
  if (currentUser.id !== resourceUserId && currentUser.role !== 'ADMIN') {
    throw new UnauthorizedError('No autorizado para modificar este recurso');
  }
}

export function getMaxActiveListings(role: Role): number | null {
  switch (role) {
    case 'FINDER':
    case 'REALTOR':
      return null;
    case 'OWNER':
      return 3;
    case 'DEVELOPER_B2B':
      return null;
    case 'ADMIN':
      return null;
    default:
      return 3;
  }
}
