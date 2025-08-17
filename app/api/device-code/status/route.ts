import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import DeviceCode from '../../../../models/DeviceCode';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Código é obrigatório' },
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

    const deviceCode = await DeviceCode.findOne({ code: code.toUpperCase() });

    if (!deviceCode) {
      return NextResponse.json(
        { error: 'Código não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verificar se expirou
    if (deviceCode.isExpired() && deviceCode.status === 'pending') {
      deviceCode.status = 'expired';
      await deviceCode.save();
    }

    // Preparar resposta baseada no status
    const response: any = {
      status: deviceCode.status,
      tvId: deviceCode.tvId,
    };

    if (deviceCode.status === 'authenticated') {
      response.serverCode = deviceCode.serverCode;
      response.username = deviceCode.username;
      response.userInfo = deviceCode.userInfo;
      response.authenticatedAt = deviceCode.authenticatedAt;
    }

    if (deviceCode.status === 'expired') {
      return NextResponse.json(response, { 
        status: 410, // Gone
        headers: corsHeaders 
      });
    }

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('Device code status error:', error);
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