import { NextRequest, NextResponse } from 'next/server';
import { xtreamService } from '../../../../lib/xtream';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverCode = searchParams.get('server_code');
    const username = searchParams.get('username');
    const password = searchParams.get('password');

    if (!serverCode || !username || !password) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: server_code, username, password' },
        { status: 400, headers: corsHeaders }
      );
    }

    const categories = await xtreamService.getLiveCategories({
      serverCode,
      username,
      password,
    });

    return NextResponse.json(categories, { headers: corsHeaders }); // 🔑
  } catch (error: any) {
    console.error('Channel categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao obter categorias de canais' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
