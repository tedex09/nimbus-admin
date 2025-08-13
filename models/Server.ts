import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IServer extends Document {
  codigo: string;
  nome: string;
  dns: string;
  logoUrl: string;
  corPrimaria: string;
  donoId: ObjectId;
  planoId?: ObjectId;
  limiteMensal?: number | null; // null = ilimitado
  status: 'ativo' | 'pendente' | 'inativo';
  createdAt: Date;
  updatedAt: Date;
}

const ServerSchema = new Schema<IServer>({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\d{3,}$/, 'Código deve ter no mínimo 3 dígitos numéricos'],
  },
  nome: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  dns: {
    type: String,
    required: true,
    trim: true,
    match: [/^https?:\/\/.+/, 'DNS deve ser uma URL válida'],
  },
  logoUrl: {
    type: String,
    trim: true,
    default: '',
    match: [/^(https?:\/\/.+|)$/, 'Logo URL deve ser uma URL válida ou vazio'],
  },
  corPrimaria: {
    type: String,
    required: true,
    match: [/^#[0-9A-F]{6}$/i, 'Cor primária deve estar no formato hexadecimal (#RRGGBB)'],
    default: '#3B82F6',
  },
  donoId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planoId: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    default: null,
  },
  limiteMensal: {
    type: Number,
    default: null, // null = ilimitado
    min: 0,
  },
  status: {
    type: String,
    enum: ['ativo', 'pendente', 'inativo'],
    default: 'pendente',
  },
}, {
  timestamps: true,
});

// Indexes
ServerSchema.index({ codigo: 1 });
ServerSchema.index({ donoId: 1 });
ServerSchema.index({ status: 1 });
ServerSchema.index({ planoId: 1 });

export default mongoose.models.Server || mongoose.model<IServer>('Server', ServerSchema);