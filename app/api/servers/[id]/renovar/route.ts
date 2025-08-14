import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import connectDB from '../../../../../lib/mongodb';
import Server from '../../../../../models/Server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { meses } = await req.json();

    if (!meses || meses < 1 || meses > 12) {
      return NextResponse.json(
        { error: 'Número de meses deve ser entre 1 e 12' },
        { status: 400 }
      );
    }

    await connectDB();

    const server = await Server.findById(params.id)
      .populate('donoId', 'nome email')
      .populate('planoId', 'nome durabilidadeMeses');

    if (!server) {
      return NextResponse.json({ error: 'Servidor não encontrado' }, { status: 404 });
    }

    // Renovar servidor
    server.renovar(meses);
    await server.save();

    return NextResponse.json({
      success: true,
      message: `Servidor renovado por ${meses} mês(es)`,
      server: {
        _id: server._id,
        codigo: server.codigo,
        nome: server.nome,
        status: server.status,
        dataVencimento: server.dataVencimento,
        dataUltimaRenovacao: server.dataUltimaRenovacao,
      },
    });
  } catch (error) {
    console.error('Renovar servidor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}