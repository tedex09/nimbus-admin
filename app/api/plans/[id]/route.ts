import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import Plan from '../../../../models/Plan';
import Server from '../../../../models/Server';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { nome, unlimited, limiteListasAtivas, tipoCobranca, valor, durabilidadeMeses, ativo } = body;

    await connectDB();

    const plan = await Plan.findById(params.id);
    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    if (nome) plan.nome = nome;
    if (tipoCobranca) plan.tipoCobranca = tipoCobranca;
    if (valor !== undefined) plan.valor = valor;
    if (durabilidadeMeses !== undefined) plan.durabilidadeMeses = durabilidadeMeses;
    if (typeof unlimited === 'boolean') plan.unlimited = unlimited;
    if (typeof ativo === 'boolean') plan.ativo = ativo;
    
    // Atualizar limite baseado no campo unlimited
    if (unlimited) {
      plan.limiteListasAtivas = 0;
    } else if (limiteListasAtivas !== undefined) {
      plan.limiteListasAtivas = limiteListasAtivas || 0;
    }

    await plan.save();

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Update plan error:', error);
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

    // Verificar se existem servidores usando este plano
    const serversUsingPlan = await Server.countDocuments({ planoId: params.id });
    if (serversUsingPlan > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir este plano pois ${serversUsingPlan} servidor(es) ainda o utilizam` },
        { status: 400 }
      );
    }

    const plan = await Plan.findByIdAndDelete(params.id);
    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Plano removido com sucesso' });
  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}