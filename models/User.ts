import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  nome: string;
  email: string;
  senha: string;
  tipo: 'admin' | 'dono';
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  senha: {
    type: String,
    required: true,
    minlength: 6,
  },
  tipo: {
    type: String,
    enum: ['admin', 'dono'],
    default: 'dono',
    index: true,
  },
  ativo: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Índices compostos
UserSchema.index({ tipo: 1, ativo: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.senha);
};

const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
/* 
// Criação automática do admin padrão
(async () => {
  try {
    // só cria se não existir nenhum admin
    const adminExists = await UserModel.findOne({ tipo: 'admin' });
    if (!adminExists) {
      const defaultAdmin = new UserModel({
        nome: 'Administrador',
        email: 'admin@iptv.com',
        senha: 'admin123', // será hasheada pelo pre-save
        tipo: 'admin',
        ativo: true,
      });
      await defaultAdmin.save();
      console.log('✅ Admin padrão criado: admin@iptv.com / admin123');
    }
  } catch (err) {
    console.error('Erro ao criar admin padrão:', err);
  }
})(); */

export default UserModel;