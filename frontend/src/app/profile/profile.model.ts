export interface SystemOwnershipDto {
  systemId: string;
  systemCode: string;
  systemName: string;
  systemIcon: string | null;
  roleCode: string;
  roleName: string;
  canVerifyApi: boolean;
  canDefineApi: boolean;
  validFrom: string;
  validTo: string | null;
  active: boolean;
}

export interface ApiOwnershipDto {
  apiId: string;
  apiCode: string;
  apiName: string;
  apiVersion: string | null;
  producerSystemName: string | null;
  roleCode: string;
  roleName: string;
  canEditApi: boolean;
  validFrom: string;
  validTo: string | null;
  active: boolean;
}

export interface GovernanceCapabilitiesDto {
  canVerifyApisForAnySystems: boolean;
  canDefineApisForAnySystems: boolean;
  verifiableSystemIds: string[];
}

export interface UserProfileDto {
  email: string;
  fullName: string;
  username: string;
  platformRoles: string[];
  systemOwnerships: SystemOwnershipDto[];
  apiOwnerships: ApiOwnershipDto[];
  governanceCapabilities: GovernanceCapabilitiesDto;
}
