import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import Server from '../../../../models/Server';

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

    const server = await Server.findById(params.id).populate('donoId', 'nome email');
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
    const { nome, dns, logoUrl, corPrimaria, ativo } = body;

    await connectDB();

    const server = await Server.findById(params.id);
    if (!server) {
      return NextResponse.json({ error: 'Servidor não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (session.user.role === 'dono' && server.donoId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Atualizar campos permitidos
    if (nome) server.nome = nome;
    if (dns) server.dns = dns;
    if (logoUrl !== undefined) server.logoUrl = logoUrl;
    if (corPrimaria) server.corPrimaria = corPrimaria;
    if (session.user.role === 'admin' && typeof ativo === 'boolean') {
      server.ativo = ativo;
    }

    await server.save();
    await server.populate('donoId', 'nome email');

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