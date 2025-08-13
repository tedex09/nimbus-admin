import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import ActiveList from '../../../models/ActiveList';
import Server from '../../../models/Server';
import { xtreamService } from '../../../lib/xtream';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serverCode, username, password } = body;

    if (!serverCode || !username || !password) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: serverCode, username, password' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar se o servidor existe e está ativo
    const server = await Server.findOne({ 
      codigo: serverCode.toUpperCase(), 
      ativo: true 
    });
    
    if (!server) {
      return NextResponse.json(
        { error: 'Servidor não encontrado ou inativo' },
        { status: 404 }
      );
    }

    try {
      // Validar credenciais com o servidor Xtream
      const userInfo = await xtreamService.getUserInfo({
        serverCode: serverCode.toUpperCase(),
        username,
        password,
      });

      // Se chegou até aqui, as credenciais são válidas
      // Registrar como lista ativa
      const userAgent = req.headers.get('user-agent') || '';
      const ipAddress = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';

      await ActiveList.findOneAndUpdate(
        { 
          serverCode: serverCode.toUpperCase(), 
          username 
        },
        {
          userAgent,
          ipAddress,
          lastAccess: new Date(),
          isActive: true,
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Acesso registrado com sucesso',
        userInfo 
      });

    } catch (xtreamError) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Client access error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}