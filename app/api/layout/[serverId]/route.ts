import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import ServerLayout from '../../../../models/ServerLayout';
import Server from '../../../../models/Server';
import { getRedis, getCacheKey } from '../../../../lib/redis';

const LAYOUT_CACHE_TTL = 300; // 5 minutos

export async function GET(
  req: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    const { serverId } = params;

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID é obrigatório' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar cache primeiro
    const redis = getRedis();
    const cacheKey = getCacheKey('layout', serverId, {});
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const layoutData = JSON.parse(cached);
        return NextResponse.json(layoutData);
      }
    } catch (cacheError) {
      console.warn('Cache read error:', cacheError);
    }

    // Buscar servidor para validar se existe
    const server = await Server.findById(serverId);
    if (!server) {
      return NextResponse.json(
        { error: 'Servidor não encontrado' },
        { status: 404 }
      );
    }

    // Buscar layout do servidor
    let layout = await ServerLayout.findOne({ serverId, isActive: true });

    // Se não existir layout, criar um padrão
    if (!layout) {
      layout = ServerLayout.createDefaultLayout(serverId, server);
      await layout.save();
    }

    // Preparar resposta otimizada para o cliente
    const layoutResponse = {
      serverId: layout.serverId,
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
      version: layout.updatedAt.getTime(), // Para cache do cliente
    };

    // Armazenar no cache
    try {
      await redis.setex(cacheKey, LAYOUT_CACHE_TTL, JSON.stringify(layoutResponse));
    } catch (cacheError) {
      console.warn('Cache write error:', cacheError);
    }

    return NextResponse.json(layoutResponse);
  } catch (error) {
    console.error('Get layout error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serverId } = params;
    const body = await req.json();

    await connectDB();

    // Verificar se o servidor existe e se o usuário tem permissão
    const server = await Server.findById(serverId);
    if (!server) {
      return NextResponse.json(
        { error: 'Servidor não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (session.user.role === 'dono' && server.donoId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validar dados do layout
    const {
      colors,
      logoUrl,
      backgroundImageUrl,
      menuSections,
      customization,
    } = body;

    if (!colors || !logoUrl || !menuSections || !Array.isArray(menuSections)) {
      return NextResponse.json(
        { error: 'Dados de layout inválidos' },
        { status: 400 }
      );
    }

    // Validar cores
    const colorRegex = /^#[0-9A-F]{6}$/i;
    if (!colorRegex.test(colors.primary) || 
        !colorRegex.test(colors.secondary) ||
        !colorRegex.test(colors.background) ||
        !colorRegex.test(colors.text) ||
        !colorRegex.test(colors.accent)) {
      return NextResponse.json(
        { error: 'Cores devem estar no formato hexadecimal (#RRGGBB)' },
        { status: 400 }
      );
    }

    // Validar seções do menu
    if (menuSections.length === 0 || menuSections.length > 10) {
      return NextResponse.json(
        { error: 'Deve ter entre 1 e 10 seções de menu' },
        { status: 400 }
      );
    }

    // Buscar layout existente ou criar novo
    let layout = await ServerLayout.findOne({ serverId });

    if (layout) {
      // Atualizar layout existente
      layout.colors = colors;
      layout.logoUrl = logoUrl;
      layout.backgroundImageUrl = backgroundImageUrl;
      layout.menuSections = menuSections;
      layout.customization = { ...layout.customization, ...customization };
    } else {
      // Criar novo layout
      layout = new ServerLayout({
        serverId,
        colors,
        logoUrl,
        backgroundImageUrl,
        menuSections,
        customization: {
          showCategories: true,
          showSearch: true,
          showFavorites: true,
          gridColumns: 4,
          cardStyle: 'poster',
          ...customization,
        },
        isActive: true,
      });
    }

    await layout.save();

    // Limpar cache
    const redis = getRedis();
    const cacheKey = getCacheKey('layout', serverId, {});
    try {
      await redis.del(cacheKey);
    } catch (cacheError) {
      console.warn('Cache clear error:', cacheError);
    }

    return NextResponse.json({
      success: true,
      layout: {
        serverId: layout.serverId,
        colors: layout.colors,
        logoUrl: layout.logoUrl,
        backgroundImageUrl: layout.backgroundImageUrl,
        menuSections: layout.menuSections,
        customization: layout.customization,
        updatedAt: layout.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update layout error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}