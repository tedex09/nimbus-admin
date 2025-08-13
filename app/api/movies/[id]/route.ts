import { NextRequest, NextResponse } from 'next/server';
import { xtreamService } from '../../../../lib/xtream';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const movieInfo = await xtreamService.getMovieInfo({
      serverCode,
      username,
      password,
    }, params.id);

    return NextResponse.json(movieInfo);
  } catch (error: any) {
    console.error('Movie info error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao obter informações do filme' },
      { status: 500 }
    );
  }
}