import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import DeviceCode from '../../../../models/DeviceCode';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, tvId } = body;

    if (!code || !tvId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: code, tvId' },
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

    const deviceCode = await DeviceCode.findOne({ 
      code: code.toUpperCase(),
      tvId: tvId.trim()
    });

    if (!deviceCode) {
      return NextResponse.json(
        { error: 'Código não encontrado ou não pertence a esta TV' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verificar se expirou
    if (deviceCode.isExpired()) {
      deviceCode.status = 'expired';
      await deviceCode.save();
      
      return NextResponse.json(
        { error: 'Código expirado' },
        { status: 410, headers: corsHeaders }
      );
    }

    // Verificar se está autenticado
    if (deviceCode.status !== 'authenticated') {
      return NextResponse.json(
        { error: `Código não está autenticado (status: ${deviceCode.status})` },
        { status: 409, headers: corsHeaders }
      );
    }

    // Marcar como usado para impedir reuso
    deviceCode.status = 'used';
    await deviceCode.save();

    // Retornar dados de autenticação
    return NextResponse.json({
      success: true,
      data: {
        serverCode: deviceCode.serverCode,
        username: deviceCode.username,
        password: deviceCode.password,
        userInfo: deviceCode.userInfo,
        authenticatedAt: deviceCode.authenticatedAt,
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Device code consume error:', error);
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