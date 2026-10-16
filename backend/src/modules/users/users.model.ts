import { Schema, model } from 'mongoose';
import { USER_ROLES, type UserRole } from './users.types.js';

/** Fields persisted in the `users` collection. */
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
    // bcrypt hash; excluded from every query unless explicitly selected with `+password`.
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: { type: String, enum: USER_ROLES, required: true, default: 'USER' },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    toJSON: {
      // Serialized users expose `id` and never `_id`, `__v` or the password hash.
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
