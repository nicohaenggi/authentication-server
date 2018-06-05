// import dependencies
import * as bcrypt from 'bcrypt';
import { Document, Schema, Model, model, HookNextFunction} from 'mongoose';
import { IUserDocument } from '../interfaces/user';

const SALT_WORK_FACTOR = 12;

export interface IUser extends IUserDocument, Document {
	comparePassword(comparePassword: string) : Promise<boolean>;
}

export interface IUserModel extends Model<IUser>  {
  getUser(username: string, password: string) : Promise<IUser>;
}

export const UserModel: Schema = new Schema({
  username: { type: String, required: true, unique: true, index: true, lowercase: true },
	password: { type: String, required: true },
	verified: { type: Boolean, required: true, default: false }
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

UserModel.statics.getUser = async function getUser(username: string, password: string) : Promise<IUser> {
	let user = await User.findOne({ username });
	if (!user) return null;

	// validate password
	let isPasswordCorrect = await user.comparePassword(password);
	return isPasswordCorrect ? user : null; 
};

export const User: IUserModel = model<IUser, IUserModel>('User', UserModel);
