import { NextRequest, NextResponse } from 'next/server';
import { xtreamService } from '../../../lib/xtream';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverCode = searchParams.get('server_code');
    const username = searchParams.get('username');
    const password = searchParams.get('password');

    if (!serverCode || !username || !password) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: server_code, username, password' },
        { status: 400 }
      );
    }

    const userInfo = await xtreamService.getUserInfo({
      serverCode,
      username,
      password,
    });

    return NextResponse.json(userInfo);
  } catch (error: any) {
    console.error('User info error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao obter informações do usuário' },
      { status: 500 }
    );
  }
}