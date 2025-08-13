import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import Server from '../../../models/Server';
import User from '../../../models/User';
import ActiveList from '../../../models/ActiveList';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const isAdmin = session.user.role === 'admin';
    const userId = session.user.id;

    let serverQuery = {};
    if (!isAdmin) {
      serverQuery = { donoId: userId };
    }

    // Estatísticas de servidores
    const totalServers = await Server.countDocuments(serverQuery);
    const activeServers = await Server.countDocuments({ ...serverQuery, ativo: true });
    const inactiveServers = totalServers - activeServers;

    // Estatísticas de usuários (apenas para admin)
    let totalUsers = 0;
    let activeUsers = 0;
    if (isAdmin) {
      totalUsers = await User.countDocuments({ tipo: 'dono' });
      activeUsers = await User.countDocuments({ tipo: 'dono', ativo: true });
    }

    // Listas ativas (últimas 24h)
    let activeListsQuery = { 
      isActive: true,
      lastAccess: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    };

    if (!isAdmin) {
      const userServers = await Server.find({ donoId: userId }).select('codigo');
      const serverCodes = userServers.map(server => server.codigo);
      activeListsQuery = { 
        ...activeListsQuery,
        serverCode: { $in: serverCodes }
      };
    }

    const activeLists = await ActiveList.countDocuments(activeListsQuery);

    // Crescimento mensal (servidores criados no último mês)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const newServersThisMonth = await Server.countDocuments({
      ...serverQuery,
      createdAt: { $gte: lastMonth }
    });

    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 2);
    
    const newServersPreviousMonth = await Server.countDocuments({
      ...serverQuery,
      createdAt: { $gte: previousMonth, $lt: lastMonth }
    });

    const monthlyGrowth = newServersPreviousMonth > 0 
      ? ((newServersThisMonth - newServersPreviousMonth) / newServersPreviousMonth) * 100
      : newServersThisMonth > 0 ? 100 : 0;

    const stats = {
      totalServers,
      activeServers,
      inactiveServers,
      totalUsers: isAdmin ? totalUsers : null,
      activeUsers: isAdmin ? activeUsers : null,
      activeLists,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      newServersThisMonth,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}