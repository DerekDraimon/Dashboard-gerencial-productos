import { Schema, model } from 'mongoose';
import { USER_ROLES, type UserRole } from './users.types.js';

export interface UserRecord {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  active: boolean;
  creationAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserRecord>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: { type: String, enum: USER_ROLES, required: true, default: 'USER' },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    toJSON: {
      transform: (_doc, ret) => {
        const { _id, __v, password, ...rest } = ret;
        void __v;
        void password;
        return { id: String(_id), ...rest };
      },
    },
  },
);

export const UserModel = model<UserRecord>('User', userSchema);
