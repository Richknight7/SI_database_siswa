import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const kelas = await db.kelas.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { siswa: true },
        },
      },
    });
    return NextResponse.json(kelas);
  } catch (error) {
    console.error('Get kelas error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { message: 'Nama kelas wajib diisi' },
        { status: 400 }
      );
    }

    const existing = await db.kelas.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Kelas dengan nama ini sudah ada' },
        { status: 400 }
      );
    }

    const kelas = await db.kelas.create({
      data: { name },
    });

    return NextResponse.json(kelas, { status: 201 });
  } catch (error) {
    console.error('Create kelas error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'ID kelas wajib diisi' },
        { status: 400 }
      );
    }

    // Check if kelas has siswa
    const siswaCount = await db.siswa.count({
      where: { kelasId: id },
    });

    if (siswaCount > 0) {
      return NextResponse.json(
        { message: 'Kelas tidak dapat dihapus karena masih memiliki siswa' },
        { status: 400 }
      );
    }

    await db.kelas.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete kelas error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
