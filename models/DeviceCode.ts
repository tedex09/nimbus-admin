import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceCode extends Document {
  code: string;
  status: 'pending' | 'authenticated' | 'expired' | 'used';
  tvId: string;
  serverCode: string | null;
  username: string | null;
  password: string | null;
  userInfo: any | null;
  createdAt: Date;
  authenticatedAt: Date | null;
  isExpired(): boolean;
}

const DeviceCodeSchema = new Schema<IDeviceCode>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^[A-Z0-9]{8}$/, 'Código deve ter 8 caracteres alfanuméricos'],
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'authenticated', 'expired', 'used'],
    default: 'pending',
    index: true,
  },
  tvId: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true,
  },
  serverCode: {
    type: String,
    default: null,
    uppercase: true,
  },
  username: {
    type: String,
    default: null,
    trim: true,
  },
  password: {
    type: String,
    default: null,
  },
  userInfo: {
    type: Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  authenticatedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: false, // Usando createdAt customizado
});

// Método para verificar se o código está expirado (5 minutos)
DeviceCodeSchema.methods.isExpired = function(): boolean {
  const now = new Date();
  const expirationTime = new Date(this.createdAt.getTime() + 5 * 60 * 1000); // 5 minutos
  return now > expirationTime;
};

// Middleware para marcar códigos expirados automaticamente
DeviceCodeSchema.pre('save', function(next) {
  if (this.status === 'pending' && this.isExpired()) {
    this.status = 'expired';
  }
  next();
});

// Índice TTL para limpeza automática após 1 hora
DeviceCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Método estático para gerar código único
DeviceCodeSchema.statics.generateUniqueCode = async function(): Promise<string> {
  let code: string;
  let exists = true;
  
  while (exists) {
    // Gerar código de 8 caracteres (letras e números)
    code = Math.random().toString(36).substring(2, 10).toUpperCase();
    // Garantir que tenha exatamente 8 caracteres
    while (code.length < 8) {
      code += Math.random().toString(36).substring(2, 3).toUpperCase();
    }
    code = code.substring(0, 8);
    
    // Verificar se já existe
    const existingCode = await this.findOne({ code });
    exists = !!existingCode;
  }
  
  return code!;
};

export default mongoose.models.DeviceCode || mongoose.model<IDeviceCode>('DeviceCode', DeviceCodeSchema);