import { Session } from "next-auth";

/**
 * Returns whereClause for Contract model based on user role and companyId
 *
 * SUPER_ADMIN: No filters (sees everything)
 * ADMIN/OWNER: Filters by companyId (sees all company data)
 * SUPERVISOR/TECHNICIAN: Filters by companyId + assigned contracts only
 */
export function getContractWhereClause(session: Session | null) {
  if (!session) {
    throw new Error("Session required");
  }

  // SUPER_ADMIN sees everything
  if (session.user.role === "SUPER_ADMIN") {
    return {};
  }

  // ADMIN/OWNER sees all contracts from their company
  if (session.user.role === "ADMIN" || session.user.role === "OWNER") {
    return { companyId: session.user.companyId };
  }

  // SUPERVISOR/TECHNICIAN sees only assigned contracts from their company
  return {
    companyId: session.user.companyId,
    users: {
      some: { userId: session.user.id }
    }
  };
}

/**
 * Returns whereClause for models with indirect relation to Contract
 * (Report, Asset, Inspection, etc.)
 *
 * SUPER_ADMIN: No filters
 * ADMIN/OWNER: Filters by companyId
 * SUPERVISOR/TECHNICIAN: Filters by companyId + contract assigned to user
 */
export function getCompanyWhereClause(session: Session | null) {
  if (!session) {
    throw new Error("Session required");
  }

  // SUPER_ADMIN sees everything
  if (session.user.role === "SUPER_ADMIN") {
    return {};
  }

  // ADMIN/OWNER sees all data from their company
  if (session.user.role === "ADMIN" || session.user.role === "OWNER") {
    return { companyId: session.user.companyId };
  }

  // SUPERVISOR/TECHNICIAN sees only data from assigned contracts
  return {
    companyId: session.user.companyId,
    contract: {
      users: {
        some: { userId: session.user.id }
      }
    }
  };
}

/**
 * Returns whereClause for models with direct relation to Company only
 * (User, ReportTemplate, etc.)
 */
export function getDirectCompanyWhereClause(session: Session | null) {
  if (!session) {
    throw new Error("Session required");
  }

  // SUPER_ADMIN sees everything
  if (session.user.role === "SUPER_ADMIN") {
    return {};
  }

  // All other roles see only their company data
  return { companyId: session.user.companyId };
}

/**
 * Validates if user has access to a resource by companyId
 * Returns true if user can access, false otherwise
 */
export async function validateCompanyAccess(
  session: Session | null,
  resourceCompanyId: string
): Promise<boolean> {
  if (!session) {
    return false;
  }

  // SUPER_ADMIN can access everything
  if (session.user.role === "SUPER_ADMIN") {
    return true;
  }

  // Other roles can only access their own company's resources
  return session.user.companyId === resourceCompanyId;
}

/**
 * Helper to check if user is SUPER_ADMIN
 */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.role === "SUPER_ADMIN";
}

/**
 * Helper to check if user is ADMIN or OWNER (company administrator)
 */
export function isCompanyAdmin(session: Session | null): boolean {
  if (!session) return false;
  return session.user.role === "ADMIN" || session.user.role === "OWNER";
}
