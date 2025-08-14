import mongoose, { Schema, Document } from 'mongoose';

export interface IMonthlyActiveList extends Document {
  serverCode: string;
  username: string;
  mesReferencia: string; // formato: "YYYY-MM"
  dataPrimeiroUso: Date;
  ultimoAcesso: Date;
  userAgent?: string;
  ipAddress?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyActiveListSchema = new Schema<IMonthlyActiveList>({
  serverCode: {
    type: String,
    required: true,
    uppercase: true,
  },
  username: {
    type: String,
    required: true,
  },
  mesReferencia: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/, // formato YYYY-MM
    index: true,
  },
  dataPrimeiroUso: {
    type: Date,
    required: true,
  },
  ultimoAcesso: {
    type: Date,
    required: true,
    index: true,
  },
  userAgent: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  ativo: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Índice único composto
MonthlyActiveListSchema.index({ 
  serverCode: 1, 
  username: 1, 
  mesReferencia: 1 
}, { unique: true });

// Índices compostos adicionais
MonthlyActiveListSchema.index({ mesReferencia: 1, ativo: 1 });
MonthlyActiveListSchema.index({ serverCode: 1, mesReferencia: 1, ativo: 1 });

export default mongoose.models.MonthlyActiveList || mongoose.model<IMonthlyActiveList>('MonthlyActiveList', MonthlyActiveListSchema);