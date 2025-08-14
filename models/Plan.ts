import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  nome: string;
  unlimited: boolean;
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
    index: true,
  },
  unlimited: {
    type: Boolean,
    default: false,
  },
  limiteListasAtivas: {
    type: Number,
    default: 0,
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
    index: true,
  },
}, {
  timestamps: true,
});

// Middleware para validar limiteListasAtivas baseado no campo unlimited
PlanSchema.pre('save', function(next) {
  if (this.unlimited) {
    this.limiteListasAtivas = 0; // Ignorar limite quando unlimited for true
  }
  next();
});

export default mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);