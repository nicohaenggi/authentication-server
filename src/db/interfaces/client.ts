export interface IClientDocument {
  name: string;
	clientId: string;
  clientSecret: string;
  licenseRequired: boolean;
  grants: string[];
  redirectUris: string[];
  accessTokenLifetime: number;
  refreshTokenLifetime: number;
  maxActiveSessions: number;
  fingerprintSecret: string;
  minimumVersion?: number;
}