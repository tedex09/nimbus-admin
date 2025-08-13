import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

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
    const { nome, email, ativo, senha } = body;

    await connectDB();

    const user = await User.findById(params.id);
    if (!user || user.tipo !== 'dono') {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o email já existe (exceto para o próprio usuário)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: params.id }
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        );
      }
    }

    // Atualizar campos
    if (nome) user.nome = nome;
    if (email) user.email = email.toLowerCase();
    if (typeof ativo === 'boolean') user.ativo = ativo;
    if (senha) user.senha = senha; // Será hasheada pelo pre-save hook

    await user.save();

    // Remover senha da resposta
    const userResponse = user.toObject();
    delete userResponse.senha;

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error('Update user error:', error);
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

    const user = await User.findById(params.id);
    if (!user || user.tipo !== 'dono') {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Usuário removido com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}