import { NextRequest, NextResponse } from 'next/server';
import { xtreamService } from '../../../lib/xtream';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverCode = searchParams.get('server_code');
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const category = searchParams.get('category');

    if (!serverCode || !username || !password) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: server_code, username, password' },
        { status: 400 }
      );
    }

    const movies = await xtreamService.getMovies({
      serverCode,
      username,
      password,
    }, category || undefined);

    return NextResponse.json(movies);
  } catch (error: any) {
    console.error('Movies error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao obter filmes' },
      { status: 500 }
    );
  }
}