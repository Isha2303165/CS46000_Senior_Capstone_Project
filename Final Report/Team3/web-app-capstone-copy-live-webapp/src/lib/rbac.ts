/**
 * Role-Based Access Control (RBAC) System
 * Manages user roles, permissions, and access control
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  THERAPIST = 'therapist',
  RECEPTIONIST = 'receptionist',
  BILLING_STAFF = 'billing_staff',
  LAB_TECHNICIAN = 'lab_technician',
  PHARMACIST = 'pharmacist',
  CLIENT = 'client',
  CAREGIVER = 'caregiver',
  VIEWER = 'viewer'
}

export enum Permission {
  // Client Management
  VIEW_CLIENTS = 'view_clients',
  CREATE_CLIENTS = 'create_clients',
  EDIT_CLIENTS = 'edit_clients',
  DELETE_CLIENTS = 'delete_clients',
  VIEW_CLIENT_DETAILS = 'view_client_details',
  VIEW_SENSITIVE_DATA = 'view_sensitive_data',
  
  // Medical Records
  VIEW_MEDICAL_RECORDS = 'view_medical_records',
  CREATE_MEDICAL_RECORDS = 'create_medical_records',
  EDIT_MEDICAL_RECORDS = 'edit_medical_records',
  DELETE_MEDICAL_RECORDS = 'delete_medical_records',
  SIGN_MEDICAL_RECORDS = 'sign_medical_records',
  LOCK_MEDICAL_RECORDS = 'lock_medical_records',
  
  // Medications
  VIEW_MEDICATIONS = 'view_medications',
  PRESCRIBE_MEDICATIONS = 'prescribe_medications',
  EDIT_MEDICATIONS = 'edit_medications',
  DELETE_MEDICATIONS = 'delete_medications',
  APPROVE_MEDICATIONS = 'approve_medications',
  DISPENSE_MEDICATIONS = 'dispense_medications',
  
  // Appointments
  VIEW_APPOINTMENTS = 'view_appointments',
  CREATE_APPOINTMENTS = 'create_appointments',
  EDIT_APPOINTMENTS = 'edit_appointments',
  DELETE_APPOINTMENTS = 'delete_appointments',
  MANAGE_SCHEDULE = 'manage_schedule',
  
  // Lab & Imaging
  VIEW_LAB_RESULTS = 'view_lab_results',
  CREATE_LAB_ORDERS = 'create_lab_orders',
  UPLOAD_LAB_RESULTS = 'upload_lab_results',
  APPROVE_LAB_RESULTS = 'approve_lab_results',
  
  // Billing
  VIEW_BILLING = 'view_billing',
  CREATE_INVOICES = 'create_invoices',
  EDIT_INVOICES = 'edit_invoices',
  PROCESS_PAYMENTS = 'process_payments',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  
  // Communications
  SEND_MESSAGES = 'send_messages',
  VIEW_ALL_MESSAGES = 'view_all_messages',
  SEND_BULK_MESSAGES = 'send_bulk_messages',
  
  // System Administration
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  BACKUP_SYSTEM = 'backup_system',
  
  // Analytics
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_REPORTS = 'view_reports',
  CREATE_REPORTS = 'create_reports',
  
  // Documents
  VIEW_DOCUMENTS = 'view_documents',
  UPLOAD_DOCUMENTS = 'upload_documents',
  DELETE_DOCUMENTS = 'delete_documents',
  SHARE_DOCUMENTS = 'share_documents'
}

export interface RoleDefinition {
  name: string;
  description: string;
  permissions: Permission[];
  inheritsFrom?: UserRole[];
  isSystem: boolean;
  priority: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  customPermissions?: Permission[];
  restrictions?: AccessRestriction[];
  isActive: boolean;
  lastLogin?: string;
}

export interface AccessRestriction {
  type: 'time' | 'location' | 'resource' | 'action';
  condition: string;
  value: any;
  expiresAt?: string;
}

export interface AccessContext {
  user: User;
  resource?: string;
  action?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

class RBACService {
  private roleDefinitions: Map<UserRole, RoleDefinition>;

  constructor() {
    this.roleDefinitions = new Map();
    this.initializeRoles();
  }

  /**
   * Initialize default role definitions
   */
  private initializeRoles(): void {
    // Super Admin - Full system access
    this.roleDefinitions.set(UserRole.SUPER_ADMIN, {
      name: 'Super Administrator',
      description: 'Full system access with all permissions',
      permissions: Object.values(Permission),
      isSystem: true,
      priority: 100
    });

    // Admin - Most permissions except super admin functions
    this.roleDefinitions.set(UserRole.ADMIN, {
      name: 'Administrator',
      description: 'Administrative access with most permissions',
      permissions: [
        Permission.VIEW_CLIENTS,
        Permission.CREATE_CLIENTS,
        Permission.EDIT_CLIENTS,
        Permission.VIEW_CLIENT_DETAILS,
        Permission.VIEW_MEDICAL_RECORDS,
        Permission.VIEW_MEDICATIONS,
        Permission.VIEW_APPOINTMENTS,
        Permission.CREATE_APPOINTMENTS,
        Permission.EDIT_APPOINTMENTS,
        Permission.VIEW_LAB_RESULTS,
        Permission.VIEW_BILLING,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_USERS,
        Permission.MANAGE_SETTINGS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.EXPORT_DATA
      ],
      isSystem: true,
      priority: 90
    });

    // Doctor - Medical permissions
    this.roleDefinitions.set(UserRole.DOCTOR, {
      name: 'Doctor',
      description: 'Medical practitioner with client care permissions',
      permissions: [
        Permission.VIEW_CLIENTS,
        Permission.VIEW_CLIENT_DETAILS,
        Permission.VIEW_SENSITIVE_DATA,
        Permission.VIEW_MEDICAL_RECORDS,
        Permission.CREATE_MEDICAL_RECORDS,
        Permission.EDIT_MEDICAL_RECORDS,
        Permission.SIGN_MEDICAL_RECORDS,
        Permission.VIEW_MEDICATIONS,
        Permission.PRESCRIBE_MEDICATIONS,
        Permission.VIEW_APPOINTMENTS,
        Permission.CREATE_APPOINTMENTS,
        Permission.EDIT_APPOINTMENTS,
        Permission.VIEW_LAB_RESULTS,
        Permission.CREATE_LAB_ORDERS,
        Permission.APPROVE_LAB_RESULTS,
        Permission.SEND_MESSAGES,
        Permission.VIEW_DOCUMENTS,
        Permission.UPLOAD_DOCUMENTS,
        Permission.VIEW_ANALYTICS
      ],
      isSystem: true,
      priority: 80
    });

    // Nurse - Client care with limited prescribing
    this.roleDefinitions.set(UserRole.NURSE, {
      name: 'Nurse',
      description: 'Nursing staff with client care permissions',
      permissions: [
        Permission.VIEW_CLIENTS,
        Permission.VIEW_CLIENT_DETAILS,
        Permission.VIEW_MEDICAL_RECORDS,
        Permission.CREATE_MEDICAL_RECORDS,
        Permission.VIEW_MEDICATIONS,
        Permission.VIEW_APPOINTMENTS,
        Permission.CREATE_APPOINTMENTS,
        Permission.VIEW_LAB_RESULTS,
        Permission.SEND_MESSAGES,
        Permission.VIEW_DOCUMENTS,
        Permission.UPLOAD_DOCUMENTS
      ],
      isSystem: true,
      priority: 70
    });

    // Therapist - Limited medical access
    this.roleDefinitions.set(UserRole.THERAPIST, {
      name: 'Therapist',
      description: 'Therapy staff with limited client access',
      permissions: [
        Permission.VIEW_CLIENTS,
        Permission.VIEW_CLIENT_DETAILS,
        Permission.VIEW_MEDICAL_RECORDS,
        Permission.CREATE_MEDICAL_RECORDS,
        Permission.VIEW_APPOINTMENTS,
        Permission.CREATE_APPOINTMENTS,
        Permission.EDIT_APPOINTMENTS,
        Permission.SEND_MESSAGES,
        Permission.VIEW_DOCUMENTS
      ],
      isSystem: true,
      priority: 60
    });

    // Receptionist - Front desk operations
    this.roleDefinitions.set(UserRole.RECEPTIONIST, {
      name: 'Receptionist',
      description: 'Front desk staff with scheduling permissions',
      permissions: [
        Permission.VIEW_CLIENTS,
        Permission.CREATE_CLIENTS,
        Permission.EDIT_CLIENTS,
        Permission.VIEW_APPOINTMENTS,
        Permission.CREATE_APPOINTMENTS,
        Permission.EDIT_APPOINTMENTS,
        Permission.DELETE_APPOINTMENTS,
        Permission.MANAGE_SCHEDULE,
        Permission.SEND_MESSAGES
      ],
      isSystem: true,
      priority: 50
    });

    // Billing Staff - Financial permissions
    this.roleDefinitions.set(UserRole.BILLING_STAFF, {
      name: 'Billing Staff',
      description: 'Billing department with financial permissions',
      permissions: [
        Permission.VIEW_CLIENTS,
        Permission.VIEW_BILLING,
        Permission.CREATE_INVOICES,
        Permission.EDIT_INVOICES,
        Permission.PROCESS_PAYMENTS,
        Permission.VIEW_FINANCIAL_REPORTS,
        Permission.SEND_MESSAGES
      ],
      isSystem: true,
      priority: 50
    });

    // Lab Technician - Lab operations
    this.roleDefinitions.set(UserRole.LAB_TECHNICIAN, {
      name: 'Lab Technician',
      description: 'Laboratory staff with test result permissions',
      permissions: [
        Permission.VIEW_CLIENTS,
        Permission.VIEW_LAB_RESULTS,
        Permission.UPLOAD_LAB_RESULTS,
        Permission.VIEW_DOCUMENTS,
        Permission.UPLOAD_DOCUMENTS
      ],
      isSystem: true,
      priority: 40
    });

    // Pharmacist - Medication management
    this.roleDefinitions.set(UserRole.PHARMACIST, {
      name: 'Pharmacist',
      description: 'Pharmacy staff with medication permissions',
      permissions: [
        Permission.VIEW_CLIENTS,
        Permission.VIEW_MEDICATIONS,
        Permission.EDIT_MEDICATIONS,
        Permission.APPROVE_MEDICATIONS,
        Permission.DISPENSE_MEDICATIONS,
        Permission.SEND_MESSAGES
      ],
      isSystem: true,
      priority: 50
    });

    // Client - Limited self-access
    this.roleDefinitions.set(UserRole.CLIENT, {
      name: 'Client',
      description: 'Client with access to own records',
      permissions: [
        Permission.VIEW_CLIENT_DETAILS,
        Permission.VIEW_MEDICAL_RECORDS,
        Permission.VIEW_MEDICATIONS,
        Permission.VIEW_APPOINTMENTS,
        Permission.VIEW_LAB_RESULTS,
        Permission.VIEW_DOCUMENTS,
        Permission.SEND_MESSAGES
      ],
      isSystem: true,
      priority: 20
    });

    // Caregiver - Client representative
    this.roleDefinitions.set(UserRole.CAREGIVER, {
      name: 'Caregiver',
      description: 'Authorized caregiver with client access',
      permissions: [
        Permission.VIEW_CLIENT_DETAILS,
        Permission.VIEW_MEDICAL_RECORDS,
        Permission.VIEW_MEDICATIONS,
        Permission.VIEW_APPOINTMENTS,
        Permission.CREATE_APPOINTMENTS,
        Permission.VIEW_LAB_RESULTS,
        Permission.VIEW_DOCUMENTS,
        Permission.SEND_MESSAGES
      ],
      isSystem: true,
      priority: 30
    });

    // Viewer - Read-only access
    this.roleDefinitions.set(UserRole.VIEWER, {
      name: 'Viewer',
      description: 'Read-only access to non-sensitive data',
      permissions: [
        Permission.VIEW_CLIENTS,
        Permission.VIEW_APPOINTMENTS,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_REPORTS
      ],
      isSystem: true,
      priority: 10
    });
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: User, permission: Permission, context?: AccessContext): boolean {
    // Check if user is active
    if (!user.isActive) return false;

    // Check custom permissions first (can override role permissions)
    if (user.customPermissions?.includes(permission)) return true;

    // Check role permissions
    const userPermissions = this.getUserPermissions(user);
    if (!userPermissions.has(permission)) return false;

    // Check restrictions
    if (user.restrictions && context) {
      return this.checkRestrictions(user.restrictions, context);
    }

    return true;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(user: User, permissions: Permission[], context?: AccessContext): boolean {
    return permissions.some(permission => this.hasPermission(user, permission, context));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(user: User, permissions: Permission[], context?: AccessContext): boolean {
    return permissions.every(permission => this.hasPermission(user, permission, context));
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(user: User): Set<Permission> {
    const permissions = new Set<Permission>();

    // Add role permissions
    user.roles.forEach(role => {
      const roleDefinition = this.roleDefinitions.get(role);
      if (roleDefinition) {
        roleDefinition.permissions.forEach(permission => permissions.add(permission));
        
        // Handle inherited permissions
        if (roleDefinition.inheritsFrom) {
          roleDefinition.inheritsFrom.forEach(inheritedRole => {
            const inheritedDefinition = this.roleDefinitions.get(inheritedRole);
            if (inheritedDefinition) {
              inheritedDefinition.permissions.forEach(permission => permissions.add(permission));
            }
          });
        }
      }
    });

    // Add custom permissions
    user.customPermissions?.forEach(permission => permissions.add(permission));

    return permissions;
  }

  /**
   * Check access restrictions
   */
  private checkRestrictions(restrictions: AccessRestriction[], context: AccessContext): boolean {
    for (const restriction of restrictions) {
      // Check if restriction has expired
      if (restriction.expiresAt && new Date(restriction.expiresAt) < new Date()) {
        continue;
      }

      switch (restriction.type) {
        case 'time':
          if (!this.checkTimeRestriction(restriction)) return false;
          break;
        case 'location':
          if (!this.checkLocationRestriction(restriction, context)) return false;
          break;
        case 'resource':
          if (!this.checkResourceRestriction(restriction, context)) return false;
          break;
        case 'action':
          if (!this.checkActionRestriction(restriction, context)) return false;
          break;
      }
    }
    return true;
  }

  /**
   * Check time-based restrictions
   */
  private checkTimeRestriction(restriction: AccessRestriction): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const { startHour, endHour } = restriction.value;
    
    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Handle overnight shifts
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  /**
   * Check location-based restrictions
   */
  private checkLocationRestriction(restriction: AccessRestriction, context: AccessContext): boolean {
    if (!context.ipAddress) return true;
    
    const allowedIPs = restriction.value as string[];
    return allowedIPs.includes(context.ipAddress);
  }

  /**
   * Check resource-based restrictions
   */
  private checkResourceRestriction(restriction: AccessRestriction, context: AccessContext): boolean {
    if (!context.resource) return true;
    
    const allowedResources = restriction.value as string[];
    return allowedResources.includes(context.resource);
  }

  /**
   * Check action-based restrictions
   */
  private checkActionRestriction(restriction: AccessRestriction, context: AccessContext): boolean {
    if (!context.action) return true;
    
    const allowedActions = restriction.value as string[];
    return allowedActions.includes(context.action);
  }

  /**
   * Get role definition
   */
  getRole(role: UserRole): RoleDefinition | undefined {
    return this.roleDefinitions.get(role);
  }

  /**
   * Get all roles
   */
  getAllRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values());
  }

  /**
   * Create custom role
   */
  createCustomRole(
    name: string,
    description: string,
    permissions: Permission[],
    inheritsFrom?: UserRole[]
  ): UserRole {
    const customRole = `custom_${Date.now()}` as UserRole;
    
    this.roleDefinitions.set(customRole, {
      name,
      description,
      permissions,
      inheritsFrom,
      isSystem: false,
      priority: 35
    });

    return customRole;
  }

  /**
   * Check if user can access client data
   */
  canAccessClient(user: User, clientId: string, action: Permission): boolean {
    // Special case for clients accessing their own data
    if (user.roles.includes(UserRole.CLIENT) && user.id === clientId) {
      const clientPermissions = [
        Permission.VIEW_CLIENT_DETAILS,
        Permission.VIEW_MEDICAL_RECORDS,
        Permission.VIEW_MEDICATIONS,
        Permission.VIEW_APPOINTMENTS,
        Permission.VIEW_LAB_RESULTS,
        Permission.VIEW_DOCUMENTS
      ];
      return clientPermissions.includes(action);
    }

    // Check general permission
    return this.hasPermission(user, action);
  }

  /**
   * Get highest priority role for user
   */
  getHighestRole(user: User): UserRole | null {
    let highestRole: UserRole | null = null;
    let highestPriority = 0;

    user.roles.forEach(role => {
      const roleDefinition = this.roleDefinitions.get(role);
      if (roleDefinition && roleDefinition.priority > highestPriority) {
        highestRole = role;
        highestPriority = roleDefinition.priority;
      }
    });

    return highestRole;
  }
}

// Export singleton instance
export const rbacService = new RBACService();

/**
 * React hook for RBAC
 */
export function useRBAC(user: User | null) {
  const hasPermission = (permission: Permission, context?: AccessContext): boolean => {
    if (!user) return false;
    return rbacService.hasPermission(user, permission, context);
  };

  const hasAnyPermission = (permissions: Permission[], context?: AccessContext): boolean => {
    if (!user) return false;
    return rbacService.hasAnyPermission(user, permissions, context);
  };

  const hasAllPermissions = (permissions: Permission[], context?: AccessContext): boolean => {
    if (!user) return false;
    return rbacService.hasAllPermissions(user, permissions, context);
  };

  const canAccessClient = (clientId: string, action: Permission): boolean => {
    if (!user) return false;
    return rbacService.canAccessClient(user, clientId, action);
  };

  const getUserPermissions = (): Set<Permission> => {
    if (!user) return new Set();
    return rbacService.getUserPermissions(user);
  };

  const getHighestRole = (): UserRole | null => {
    if (!user) return null;
    return rbacService.getHighestRole(user);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessClient,
    getUserPermissions,
    getHighestRole,
    isAuthenticated: !!user,
    user
  };
}