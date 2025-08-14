import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import Plan from '../../../models/Plan';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const plans = await Plan.find().sort({ createdAt: -1 });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { nome, unlimited, limiteListasAtivas, tipoCobranca, valor, durabilidadeMeses } = body;

    if (!nome || !tipoCobranca || valor === undefined || !durabilidadeMeses) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, tipoCobranca, valor, durabilidadeMeses' },
        { status: 400 }
      );
    }

    await connectDB();

    const plan = new Plan({
      nome,
      unlimited: unlimited || false,
      limiteListasAtivas: unlimited ? 0 : (limiteListasAtivas || 0),
      tipoCobranca,
      valor,
      durabilidadeMeses,
      ativo: true,
    });

    await plan.save();

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Create plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}