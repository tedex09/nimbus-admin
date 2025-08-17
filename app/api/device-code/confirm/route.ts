import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import DeviceCode from '../../../../models/DeviceCode';
import Server from '../../../../models/Server';
import { xtreamService } from '../../../../lib/xtream';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, serverCode, username, password } = body;

    // Validar parâmetros obrigatórios
    if (!code || !serverCode || !username || !password) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: code, serverCode, username, password' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validar formato do código
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      return NextResponse.json(
        { error: 'Formato de código inválido' },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();

    // Buscar código do dispositivo
    const deviceCode = await DeviceCode.findOne({ code: code.toUpperCase() });

    if (!deviceCode) {
      return NextResponse.json(
        { error: 'Código não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verificar se o código expirou
    if (deviceCode.isExpired()) {
      deviceCode.status = 'expired';
      await deviceCode.save();
      
      return NextResponse.json(
        { error: 'Código expirado' },
        { status: 410, headers: corsHeaders }
      );
    }

    // Verificar se o código já foi usado ou autenticado
    if (deviceCode.status !== 'pending') {
      return NextResponse.json(
        { error: `Código já foi ${deviceCode.status === 'used' ? 'utilizado' : 'autenticado'}` },
        { status: 409, headers: corsHeaders }
      );
    }

    // Verificar se o servidor existe e está ativo
    const server = await Server.findOne({ 
      codigo: serverCode.toUpperCase(), 
      status: 'ativo' 
    });
    
    if (!server) {
      return NextResponse.json(
        { error: 'Servidor não encontrado ou inativo' },
        { status: 404, headers: corsHeaders }
      );
    }

    try {
      // Validar credenciais via XtreamCodes
      const userInfo = await xtreamService.getUserInfo({
        serverCode: serverCode.toUpperCase(),
        username,
        password,
      });

      // Credenciais válidas - atualizar código do dispositivo
      deviceCode.status = 'authenticated';
      deviceCode.serverCode = serverCode.toUpperCase();
      deviceCode.username = username;
      deviceCode.password = password; // Em produção, considere criptografar
      deviceCode.userInfo = userInfo;
      deviceCode.authenticatedAt = new Date();

      await deviceCode.save();

      return NextResponse.json({
        success: true,
        message: 'Código autenticado com sucesso',
        data: {
          code: deviceCode.code,
          tvId: deviceCode.tvId,
          serverCode: deviceCode.serverCode,
          username: deviceCode.username,
          userInfo: deviceCode.userInfo,
          authenticatedAt: deviceCode.authenticatedAt,
        }
      }, { headers: corsHeaders });

    } catch (xtreamError: any) {
      console.error('Xtream validation error:', xtreamError);
      
      // Determinar tipo de erro
      let errorMessage = 'Credenciais inválidas';
      let statusCode = 401;

      if (xtreamError.message?.includes('não encontrado')) {
        errorMessage = 'Servidor não encontrado';
        statusCode = 404;
      } else if (xtreamError.message?.includes('inativo')) {
        errorMessage = 'Servidor inativo';
        statusCode = 403;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Device code confirm error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}