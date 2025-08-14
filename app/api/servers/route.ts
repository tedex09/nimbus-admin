import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import Server from '../../../models/Server';
import User from '../../../models/User';
import Plan from '../../../models/Plan';
import { generateUniqueServerCode } from '../../../lib/utils/serverCodeGenerator';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let servers;
    if (session.user.role === 'admin') {
      // Admin pode ver todos os servidores
      servers = await Server.find()
        .populate('donoId', 'nome email')
        .populate('planoId', 'nome limiteListasAtivas tipoCobranca valor durabilidadeMeses')
        .sort({ createdAt: -1 });
    } else if (session.user.role === 'dono') {
      // Dono só pode ver seus próprios servidores
      servers = await Server.find({ donoId: session.user.id })
        .populate('planoId', 'nome limiteListasAtivas tipoCobranca valor durabilidadeMeses')
        .sort({ createdAt: -1 });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verificar e atualizar status de servidores vencidos
    const now = new Date();
    for (const server of servers) {
      if (server.status === 'ativo' && server.dataVencimento < now) {
        server.status = 'vencido';
        await server.save();
      }
    }

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Get servers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { nome, dns, logoUrl, corPrimaria, donoId, planoId } = body;

    await connectDB();

    // Verificar se o usuário tem permissão
    let finalDonoId = donoId;
    if (session.user.role === 'dono') {
      // Dono só pode criar servidor para si mesmo
      finalDonoId = session.user.id;
    } else if (session.user.role === 'admin') {
      // Admin pode especificar o dono ou criar para si mesmo
      finalDonoId = donoId || session.user.id;
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verificar se o dono existe
    const dono = await User.findById(finalDonoId);
    if (!dono) {
      return NextResponse.json({ error: 'Dono não encontrado' }, { status: 400 });
    }

    // Gerar código único automaticamente
    const codigo = await generateUniqueServerCode();

    // Verificar se o plano existe
    if (!planoId) {
      return NextResponse.json({ error: 'Plano é obrigatório' }, { status: 400 });
    }
    
    const plano = await Plan.findById(planoId);
    if (!plano) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 400 });
    }

    // Calcular data de vencimento baseada na durabilidade do plano
    const dataVencimento = new Date();
    dataVencimento.setMonth(dataVencimento.getMonth() + plano.durabilidadeMeses);

    const server = new Server({
      codigo,
      nome,
      dns,
      logoUrl: logoUrl || '',
      corPrimaria: corPrimaria || '#3B82F6',
      donoId: finalDonoId,
      planoId: planoId,
      status: session.user.role === 'admin' ? 'ativo' : 'pendente',
      dataVencimento,
    });

    await server.save();
    await server.populate([
      { path: 'donoId', select: 'nome email' },
      { path: 'planoId', select: 'nome limiteListasAtivas tipoCobranca valor durabilidadeMeses' }
    ]);

    return NextResponse.json({ server }, { status: 201 });
  } catch (error) {
    console.error('Create server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}