export interface IClientDocument {
  name: string;
	clientId: string;
  clientSecret: string;
  grants: string[];
  redirectUris: string[];
  accessTokenLifetime: number;
  refreshTokenLifetime: number;
}