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
    const { tvId } = body;

    if (!tvId) {
      return NextResponse.json(
        { error: 'tvId é obrigatório' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validar tvId
    if (typeof tvId !== 'string' || tvId.trim().length === 0 || tvId.length > 100) {
      return NextResponse.json(
        { error: 'tvId deve ser uma string válida com até 100 caracteres' },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();

    // Verificar se já existe um código pendente para esta TV (últimos 5 minutos)
    const existingCode = await DeviceCode.findOne({
      tvId: tvId.trim(),
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (existingCode && !existingCode.isExpired()) {
      return NextResponse.json({
        code: existingCode.code,
        tvId: existingCode.tvId,
        expiresIn: 300, // 5 minutos em segundos
        message: 'Código existente ainda válido'
      }, { headers: corsHeaders });
    }

    // Gerar novo código único
    const code = await DeviceCode.generateUniqueCode();

    // Criar novo registro
    const deviceCode = new DeviceCode({
      code,
      tvId: tvId.trim(),
      status: 'pending',
    });

    await deviceCode.save();

    return NextResponse.json({
      code: deviceCode.code,
      tvId: deviceCode.tvId,
      expiresIn: 300, // 5 minutos em segundos
    }, { 
      status: 201,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Device code request error:', error);
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