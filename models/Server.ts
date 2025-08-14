import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IServer extends Document {
  codigo: string;
  nome: string;
  dns: string;
  logoUrl: string;
  corPrimaria: string;
  donoId: ObjectId;
  planoId?: ObjectId;
  status: 'ativo' | 'pendente' | 'inativo' | 'vencido';
  dataVencimento: Date;
  dataUltimaRenovacao?: Date;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  renovar(meses: number): void;
}

const ServerSchema = new Schema<IServer>({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\d{2,3}$/, 'Código deve ter 2 ou 3 dígitos numéricos'],
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
    required: true,
  },
  status: {
    type: String,
    enum: ['ativo', 'pendente', 'inativo', 'vencido'],
    default: 'pendente',
  },
  dataVencimento: {
    type: Date,
    required: true,
  },
  dataUltimaRenovacao: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
/* ServerSchema.index({ codigo: 1 });
ServerSchema.index({ donoId: 1 });
ServerSchema.index({ status: 1 });
ServerSchema.index({ planoId: 1 });
ServerSchema.index({ dataVencimento: 1 }); */

// Método para verificar se está vencido
ServerSchema.methods.isExpired = function(): boolean {
  return new Date() > this.dataVencimento;
};

// Método para renovar servidor
ServerSchema.methods.renovar = function(meses: number): void {
  const novaDataVencimento = new Date(this.dataVencimento);
  novaDataVencimento.setMonth(novaDataVencimento.getMonth() + meses);
  
  this.dataVencimento = novaDataVencimento;
  this.dataUltimaRenovacao = new Date();
  this.status = 'ativo';
};

// Middleware para verificar vencimento antes de salvar
ServerSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'ativo') {
    this.status = 'vencido';
  }
  next();
});

export default mongoose.models.Server || mongoose.model<IServer>('Server', ServerSchema);