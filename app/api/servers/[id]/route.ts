import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import Server from '../../../../models/Server';
import Plan from '../../../../models/Plan';
import User from '../../../../models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const server = await Server.findById(params.id)
      .populate('donoId', 'nome email')
      .populate('planoId', 'nome limiteListasAtivas');
    if (!server) {
      return NextResponse.json({ error: 'Servidor não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (session.user.role === 'dono' && server.donoId._id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Get server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { codigo, nome, dns, logoUrl, corPrimaria, status, donoId, planoId, limiteMensal } = body;

    await connectDB();

    const server = await Server.findById(params.id);
    if (!server) {
      return NextResponse.json({ error: 'Servidor não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (session.user.role === 'dono' && server.donoId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verificar se código já existe (se alterado e for admin)
    if (session.user.role === 'admin' && codigo && codigo !== server.codigo) {
      const existingServer = await Server.findOne({ codigo, _id: { $ne: params.id } });
      if (existingServer) {
        return NextResponse.json({ error: 'Código já existe' }, { status: 400 });
      }
    }

    // Verificar se o novo dono existe (se alterado e for admin)
    if (session.user.role === 'admin' && donoId && donoId !== server.donoId.toString()) {
      const novoDono = await User.findById(donoId);
      if (!novoDono) {
        return NextResponse.json({ error: 'Novo dono não encontrado' }, { status: 400 });
      }
    }

    // Verificar se o plano existe (se fornecido)
    if (planoId && planoId !== server.planoId?.toString()) {
      const plano = await Plan.findById(planoId);
      if (!plano) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 400 });
      }
    }
    // Atualizar campos permitidos
    if (nome) server.nome = nome;
    if (dns) server.dns = dns;
    if (logoUrl !== undefined) server.logoUrl = logoUrl;
    if (corPrimaria) server.corPrimaria = corPrimaria;
    
    // Campos que apenas admin pode alterar
    if (session.user.role === 'admin') {
      if (codigo) server.codigo = codigo;
      if (status) server.status = status;
      if (donoId) server.donoId = donoId;
      if (planoId !== undefined) server.planoId = planoId || null;
    }
    
    // Limite mensal pode ser alterado por admin ou pelo próprio dono
    if (limiteMensal !== undefined) {
      server.limiteMensal = limiteMensal === '' ? null : limiteMensal;
    }

    await server.save();
    await server.populate([
      { path: 'donoId', select: 'nome email' },
      { path: 'planoId', select: 'nome limiteListasAtivas' }
    ]);

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Update server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const server = await Server.findByIdAndDelete(params.id);
    if (!server) {
      return NextResponse.json({ error: 'Servidor não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Servidor removido com sucesso' });
  } catch (error) {
    console.error('Delete server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}