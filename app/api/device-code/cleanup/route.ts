import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import DeviceCode from '../../../../models/DeviceCode';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Marcar códigos pendentes expirados
    const expiredResult = await DeviceCode.updateMany(
      {
        status: 'pending',
        createdAt: { $lt: fiveMinutesAgo }
      },
      {
        $set: { status: 'expired' }
      }
    );

    // Remover códigos antigos (mais de 1 hora)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const deleteResult = await DeviceCode.deleteMany({
      createdAt: { $lt: oneHourAgo }
    });

    return NextResponse.json({
      success: true,
      expired: expiredResult.modifiedCount,
      deleted: deleteResult.deletedCount,
      message: `${expiredResult.modifiedCount} códigos marcados como expirados, ${deleteResult.deletedCount} códigos antigos removidos`
    });

  } catch (error) {
    console.error('Device code cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}