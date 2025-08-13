import mongoose, { Schema, Document } from 'mongoose';

export interface IActiveList extends Document {
  serverCode: string;
  username: string;
  userAgent?: string;
  ipAddress?: string;
  lastAccess: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActiveListSchema = new Schema<IActiveList>({
  serverCode: {
    type: String,
    required: true,
    uppercase: true,
  },
  username: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  lastAccess: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Índices compostos para performance
ActiveListSchema.index({ serverCode: 1, username: 1 }, { unique: true });
ActiveListSchema.index({ lastAccess: 1 });
ActiveListSchema.index({ isActive: 1 });

export default mongoose.models.ActiveList || mongoose.model<IActiveList>('ActiveList', ActiveListSchema);