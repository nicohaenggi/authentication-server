export interface IUserDocument {
	username: string;
  password: string;
  emailVerified: boolean;
  discordId?: string;
}