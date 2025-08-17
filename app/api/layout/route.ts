import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import ServerLayout from "../../../models/ServerLayout";
import Server from "../../../models/Server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serverCode = searchParams.get("server_code");

    if (!serverCode) {
      return NextResponse.json({ error: "Código do servidor é obrigatório" }, { status: 400, headers: corsHeaders });
    }

    await connectDB();

    const server = await Server.findOne({
      codigo: serverCode.toUpperCase(),
      status: "ativo",
    });

    if (!server) {
      return NextResponse.json({ error: "Servidor não encontrado ou inativo" }, { status: 404, headers: corsHeaders });
    }

    let layout = await ServerLayout.findOne({
      serverId: server._id,
      isActive: true,
    });

    if (!layout) {
      layout = ServerLayout.createDefaultLayout(server._id, server);
      await layout.save();
    }

    const layoutResponse = {
      serverCode: server.codigo,
      serverName: server.nome,
      colors: layout.colors,
      logoUrl: layout.logoUrl,
      backgroundImageUrl: layout.backgroundImageUrl,
      menuSections: layout.menuSections
        .filter((section) => section.enabled)
        .sort((a, b) => a.order - b.order)
        .map((section) => ({
          id: section.id,
          name: section.name,
          icon: section.icon,
          type: section.type,
          categoryId: section.categoryId,
        })),
      customization: layout.customization,
      version: layout.updatedAt.getTime(),
    };

    return NextResponse.json(layoutResponse, { headers: corsHeaders });
  } catch (error) {
    console.error("Get layout by server code error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500, headers: corsHeaders });
  }
}

// Preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
