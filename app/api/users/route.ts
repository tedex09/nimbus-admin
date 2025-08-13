import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const users = await User.find({ tipo: 'dono' })
      .select('-senha')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
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
    const { nome, email, senha } = body;

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, senha' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar se o email já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    const user = new User({
      nome,
      email: email.toLowerCase(),
      senha,
      tipo: 'dono',
      ativo: true,
    });

    await user.save();

    // Remover senha da resposta
    const userResponse = user.toObject();
    delete userResponse.senha;

    return NextResponse.json({ user: userResponse }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}