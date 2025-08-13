import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import Server from '../../../models/Server';
import User from '../../../models/User';

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
      servers = await Server.find().populate('donoId', 'nome email').sort({ createdAt: -1 });
    } else if (session.user.role === 'dono') {
      // Dono só pode ver seus próprios servidores
      servers = await Server.find({ donoId: session.user.id }).sort({ createdAt: -1 });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    const { codigo, nome, dns, logoUrl, corPrimaria, donoId } = body;

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

    // Verificar se o código já existe
    const existingServer = await Server.findOne({ codigo: codigo.toUpperCase() });
    if (existingServer) {
      return NextResponse.json({ error: 'Código do servidor já existe' }, { status: 400 });
    }

    const server = new Server({
      codigo: codigo.toUpperCase(),
      nome,
      dns,
      logoUrl: logoUrl || '',
      corPrimaria: corPrimaria || '#3B82F6',
      donoId: finalDonoId,
    });

    await server.save();
    await server.populate('donoId', 'nome email');

    return NextResponse.json({ server }, { status: 201 });
  } catch (error) {
    console.error('Create server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}