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
      console.log('Layout padrão criado para servidor:', serverId);
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
        })),
      settings: layout.settings,
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
      settings,
    } = body;

    if (!colors || !logoUrl || !menuSections || !Array.isArray(menuSections) || !settings) {
      return NextResponse.json(
        { error: 'Dados de layout inválidos' },
        { status: 400 }
      );
    }

    // Validar cores
    const colorRegex = /^#[0-9A-F]{6}$/i;
    if (!colorRegex.test(colors.primary) || !colorRegex.test(colors.secondary)) {
      return NextResponse.json(
        { error: 'Cores primária e secundária devem estar no formato hexadecimal (#RRGGBB)' },
        { status: 400 }
      );
    }

    if (colors.background && !colorRegex.test(colors.background)) {
      return NextResponse.json(
        { error: 'Cor de fundo deve estar no formato hexadecimal (#RRGGBB)' },
        { status: 400 }
      );
    }

    // Validar seções do menu (deve ter exatamente 3: TV, Filmes, Séries)
    if (menuSections.length !== 3) {
      return NextResponse.json(
        { error: 'Deve ter exatamente 3 seções de menu (TV, Filmes, Séries)' },
        { status: 400 }
      );
    }

    const requiredTypes = ['tv', 'movies', 'series'];
    const providedTypes = menuSections.map((section: any) => section.type);
    if (!requiredTypes.every(type => providedTypes.includes(type))) {
      return NextResponse.json(
        { error: 'Seções obrigatórias: TV, Filmes e Séries' },
        { status: 400 }
      );
    }

    // Buscar layout existente ou criar novo
    let layout = await ServerLayout.findOne({ serverId });

    if (layout) {
      // Atualizar layout existente
      layout.colors = {
        primary: colors.primary,
        secondary: colors.secondary,
        background: colors.background || '#FFFFFF',
      };
      layout.logoUrl = logoUrl;
      layout.backgroundImageUrl = backgroundImageUrl || '';
      layout.menuSections = menuSections;
      layout.settings = {
        showSearch: settings.showSearch ?? true,
        showExpiration: settings.showExpiration ?? true,
        showTime: settings.showTime ?? true,
        showLogo: settings.showLogo ?? true,
        defaultLanguage: settings.defaultLanguage || 'pt',
        menuPosition: settings.menuPosition || 'top',
      };
    } else {
      // Criar novo layout
      layout = new ServerLayout({
        serverId,
        colors: {
          primary: colors.primary,
          secondary: colors.secondary,
          background: colors.background || '#FFFFFF',
        },
        logoUrl,
        backgroundImageUrl: backgroundImageUrl || '',
        menuSections,
        settings: {
          showSearch: settings.showSearch ?? true,
          showExpiration: settings.showExpiration ?? true,
          showTime: settings.showTime ?? true,
          showLogo: settings.showLogo ?? true,
          defaultLanguage: settings.defaultLanguage || 'pt',
          menuPosition: settings.menuPosition || 'top',
        },
        isActive: true,
      });
    }

    await layout.save();
    console.log('Layout salvo com sucesso para servidor:', serverId);

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
        settings: layout.settings,
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