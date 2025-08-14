import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  nome: string;
  limiteListasAtivas: number;
  tipoCobranca: 'fixo' | 'por_lista';
  valor: number;
  durabilidadeMeses: number; // 1, 2, 3, etc.
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>({
  nome: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  limiteListasAtivas: {
    type: Number,
    default: 0, // 0 = ilimitado
    min: 0,
  },
  tipoCobranca: {
    type: String,
    enum: ['fixo', 'por_lista'],
    required: true,
  },
  valor: {
    type: Number,
    required: true,
    min: 0,
  },
  durabilidadeMeses: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    default: 1,
  },
  ativo: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
PlanSchema.index({ nome: 1 });
PlanSchema.index({ ativo: 1 });

export default mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);