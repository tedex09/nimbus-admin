import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import MonthlyActiveList from '../../../models/MonthlyActiveList';
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

    // Verificar se o servidor existe e está ativo
    const server = await Server.findOne({ 
      codigo: serverCode, 
      status: 'ativo' 
    }).populate('planoId');
    
    if (!server) {
      return NextResponse.json(
        { error: 'Servidor não encontrado ou inativo' },
        { status: 404 }
      );
    }

    const now = new Date();
    const mesReferencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Verificar se já existe registro para este mês
    let monthlyList = await MonthlyActiveList.findOne({
      serverCode,
      username,
      mesReferencia,
    });

    if (monthlyList) {
      // Atualizar apenas o último acesso
      monthlyList.ultimoAcesso = now;
      monthlyList.userAgent = userAgent || monthlyList.userAgent;
      monthlyList.ipAddress = ipAddress || monthlyList.ipAddress;
      await monthlyList.save();
    } else {
      // Verificar limite mensal antes de criar novo registro
      const limiteMensal = server.planoId?.limiteListasAtivas;
      
      if (limiteMensal !== null) {
        const listasAtivasNoMes = await MonthlyActiveList.countDocuments({
          serverCode,
          mesReferencia,
          ativo: true,
        });

        if (listasAtivasNoMes >= limiteMensal) {
          return NextResponse.json(
            { error: 'Limite mensal de listas ativas atingido' },
            { status: 429 }
          );
        }
      }

      // Criar novo registro
      monthlyList = new MonthlyActiveList({
        serverCode,
        username,
        mesReferencia,
        dataPrimeiroUso: now,
        ultimoAcesso: now,
        userAgent: userAgent || '',
        ipAddress: ipAddress || '',
        ativo: true,
      });

      await monthlyList.save();
    }

    return NextResponse.json({ success: true, monthlyList });
  } catch (error) {
    console.error('Monthly active list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mesReferencia = searchParams.get('mes') || 
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    await connectDB();

    let query = { mesReferencia, ativo: true };
    
    if (session.user.role === 'dono') {
      // Buscar apenas listas dos servidores do usuário
      const userServers = await Server.find({ donoId: session.user.id }).select('codigo');
      const serverCodes = userServers.map(server => server.codigo);
      query = { ...query, serverCode: { $in: serverCodes } };
    }

    const monthlyLists = await MonthlyActiveList.find(query).sort({ ultimoAcesso: -1 });

    return NextResponse.json({ monthlyLists });
  } catch (error) {
    console.error('Get monthly active lists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}