// import dependencies
import * as bcrypt from 'bcrypt';
import * as validator from 'validator';
import { Document, Schema, Model, model, HookNextFunction} from 'mongoose';
import { IUserDocument } from '../interfaces/user';

const SALT_WORK_FACTOR = 12;

export interface IUser extends IUserDocument, Document {
	comparePassword(comparePassword: string) : Promise<boolean>;
	isVerified() : boolean;
	setEmailVerified() : Promise<IUser>;
	linkDiscord(discordId: string) : Promise<IUser>;
}

export interface IUserModel extends Model<IUser>  {
	getUser(username: string, password: string) : Promise<IUser>;
}

export const UserModel: Schema = new Schema({
  username: { type: String, required: true, unique: true, index: true, lowercase: true, validate: { 
		validator: (username: string) => validator.isEmail(username), 
		message: '{VALUE} is not a valid email' } 
	},
	password: { type: String, required: true },
	emailVerified: { type: Boolean, required: true, default: false },
	discordId: { type: String, default: null }
}, { timestamps: true });

UserModel.pre<IUser>('save', async function(next: HookNextFunction) {
	// only hash the password if it has been modified (or is new)
	if (!this.isModified('password')) return next();

	// generate a new for storing the password
	try {
		let salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
		let hash = await bcrypt.hash(this.password, salt);

		// override the cleartext password with the hashed one
		this.password = hash;
		next();
	} catch (err) {
		return next(err);
	}
});

UserModel.methods.comparePassword = async function comparePassword(comparePassword: string) : Promise<boolean> {
	return await bcrypt.compare(comparePassword, this.password);
};

UserModel.methods.setEmailVerified = async function setEmailVerified() : Promise<IUser> {
	this.emailVerified = true;
	return await this.save();
};

UserModel.methods.linkDiscord = async function linkDiscord(discordId: string) : Promise<IUser> {
	// prevent linking more than once
	if (this.discordId != null) return null; 

	// link discord account
	this.discordId = discordId;
	return await this.save();
}

UserModel.methods.isVerified = function isVerified() : boolean {
	return this.emailVerified && (this.discordId != null);
};

UserModel.statics.getUser = async function getUser(username: string, password: string) : Promise<IUser> {
	let user = await User.findOne({ username });
	if (!user) return null;

	// validate password
	let isPasswordCorrect = await user.comparePassword(password);
	return isPasswordCorrect ? user : null; 
};

export const User: IUserModel = model<IUser, IUserModel>('User', UserModel);
