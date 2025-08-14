import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IServer extends Document {
  codigo: string;
  nome: string;
  dns: string;
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
    index: true,
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
  donoId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  planoId: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['ativo', 'pendente', 'inativo', 'vencido'],
    default: 'pendente',
    index: true,
  },
  dataVencimento: {
    type: Date,
    required: true,
    index: true,
  },
  dataUltimaRenovacao: {
    type: Date,
  },
}, {
  timestamps: true,
});

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