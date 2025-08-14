import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import ServerLayout from '../../../models/ServerLayout';
import Server from '../../../models/Server';

// Endpoint para buscar layouts por código do servidor (para clientes IPTV)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverCode = searchParams.get('server_code');

    if (!serverCode) {
      return NextResponse.json(
        { error: 'Código do servidor é obrigatório' },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar servidor pelo código
    const server = await Server.findOne({ 
      codigo: serverCode.toUpperCase(),
      status: 'ativo' 
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Servidor não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Buscar layout do servidor
    let layout = await ServerLayout.findOne({ 
      serverId: server._id, 
      isActive: true 
    });

    // Se não existir layout, criar um padrão
    if (!layout) {
      layout = ServerLayout.createDefaultLayout(server._id, server);
      await layout.save();
    }

    // Resposta otimizada para clientes
    const layoutResponse = {
      serverCode: server.codigo,
      serverName: server.nome,
      colors: layout.colors,
      logoUrl: layout.logoUrl,
      backgroundImageUrl: layout.backgroundImageUrl,
      menuSections: layout.menuSections
        .filter(section => section.enabled)
        .sort((a, b) => a.order - b.order)
        .map(section => ({
          id: section.id,
          name: section.name,
          icon: section.icon,
          type: section.type,
          categoryId: section.categoryId,
        })),
      customization: layout.customization,
      version: layout.updatedAt.getTime(),
    };

    return NextResponse.json(layoutResponse);
  } catch (error) {
    console.error('Get layout by server code error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}