import Server from '../../models/Server';
import connectDB from '../mongodb';

export async function generateUniqueServerCode(): Promise<string> {
  await connectDB();
  
  let codigo: string;
  let exists = true;
  
  while (exists) {
    // Gerar código com 6 dígitos
    codigo = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Verificar se já existe
    const existingServer = await Server.findOne({ codigo });
    exists = !!existingServer;
  }
  
  return codigo!;
}