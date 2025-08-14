import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import MonthlyActiveList from '../../../models/MonthlyActiveList';
import Plan from '../../../models/Plan';
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
      codigo: serverCode, 
      status: 'ativo' 
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
        serverCode,
        username,
        password,
      });

      // Se chegou até aqui, as credenciais são válidas
      // Registrar como lista ativa mensal
      const userAgent = req.headers.get('user-agent') || '';
      const ipAddress = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';

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
        monthlyList.userAgent = userAgent;
        monthlyList.ipAddress = ipAddress;
        await monthlyList.save();
      } else {
        // Verificar limite mensal antes de criar novo registro
        const plano = server?.planoId ? await Plan.findById(server.planoId) : null;
        const limiteMensal = plano?.unlimited ? null : plano?.limiteListasAtivas;
        
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
          userAgent,
          ipAddress,
          ativo: true,
        });

        await monthlyList.save();
      }

      return NextResponse.json({ 
  success: true, 
  message: 'Acesso registrado com sucesso',
  userInfo,
  monthlyList
}, {
  status: 200,
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
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

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
