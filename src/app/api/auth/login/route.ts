import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const admin = await db.adminAccount.findUnique({
      where: { id: 'admin' },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Akun admin tidak ditemukan' },
        { status: 401 }
      );
    }

    if (admin.username !== username || admin.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      displayName: admin.displayName,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
