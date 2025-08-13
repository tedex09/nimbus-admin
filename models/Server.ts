import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IServer extends Document {
  codigo: string;
  nome: string;
  dns: string;
  logoUrl: string;
  corPrimaria: string;
  donoId: ObjectId;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServerSchema = new Schema<IServer>({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{4,10}$/, 'Código deve ter entre 4 e 10 caracteres alfanuméricos'],
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
  ativo: {
    type: Boolean,
    default: false, // Servidores começam inativos até aprovação do admin
  },
}, {
  timestamps: true,
});

// Indexes
ServerSchema.index({ codigo: 1 });
ServerSchema.index({ donoId: 1 });
ServerSchema.index({ ativo: 1 });

export default mongoose.models.Server || mongoose.model<IServer>('Server', ServerSchema);