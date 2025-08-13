import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import ActiveList from '../../../models/ActiveList';
import Server from '../../../models/Server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serverCode, username, userAgent, ipAddress } = body;

    if (!serverCode || !username) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: serverCode, username' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar se o servidor existe
    const server = await Server.findOne({ codigo: serverCode.toUpperCase(), ativo: true });
    if (!server) {
      return NextResponse.json(
        { error: 'Servidor não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Atualizar ou criar lista ativa
    const activeList = await ActiveList.findOneAndUpdate(
      { serverCode: serverCode.toUpperCase(), username },
      {
        userAgent: userAgent || '',
        ipAddress: ipAddress || '',
        lastAccess: new Date(),
        isActive: true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, activeList });
  } catch (error) {
    console.error('Active list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let query = {};
    
    if (session.user.role === 'dono') {
      // Buscar apenas listas dos servidores do usuário
      const userServers = await Server.find({ donoId: session.user.id }).select('codigo');
      const serverCodes = userServers.map(server => server.codigo);
      query = { serverCode: { $in: serverCodes } };
    }

    const activeLists = await ActiveList.find({
      ...query,
      isActive: true,
      lastAccess: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24h
    }).sort({ lastAccess: -1 });

    return NextResponse.json({ activeLists });
  } catch (error) {
    console.error('Get active lists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}