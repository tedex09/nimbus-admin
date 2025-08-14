import Server from '../../models/Server';
import connectDB from '../mongodb';

export async function generateUniqueServerCode(): Promise<string> {
  await connectDB();
  
  let codigo: string;
  let exists = true;
  
  while (exists) {
    // Gerar código com 2 ou 3 dígitos (10 a 999)
    codigo = Math.floor(10 + Math.random() * 990).toString();
    
    // Verificar se já existe
    const existingServer = await Server.findOne({ codigo });
    exists = !!existingServer;
  }
  
  return codigo!;
}