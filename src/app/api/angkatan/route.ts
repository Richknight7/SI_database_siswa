import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const angkatan = await db.angkatan.findMany({
      orderBy: { year: 'asc' },
      include: {
        _count: {
          select: { siswa: true },
        },
      },
    });
    return NextResponse.json(angkatan);
  } catch (error) {
    console.error('Get angkatan error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year } = body;

    if (!year || typeof year !== 'number') {
      return NextResponse.json(
        { message: 'Tahun angkatan wajib diisi' },
        { status: 400 }
      );
    }

    const existing = await db.angkatan.findUnique({
      where: { year },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Angkatan tahun ini sudah ada' },
        { status: 400 }
      );
    }

    const angkatan = await db.angkatan.create({
      data: { year },
    });

    return NextResponse.json(angkatan, { status: 201 });
  } catch (error) {
    console.error('Create angkatan error:', error);
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
        { message: 'ID angkatan wajib diisi' },
        { status: 400 }
      );
    }

    // Check if angkatan has siswa
    const siswaCount = await db.siswa.count({
      where: { angkatanId: id },
    });

    if (siswaCount > 0) {
      return NextResponse.json(
        { message: 'Angkatan tidak dapat dihapus karena masih memiliki siswa' },
        { status: 400 }
      );
    }

    await db.angkatan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete angkatan error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
