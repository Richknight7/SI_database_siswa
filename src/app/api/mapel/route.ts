import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const mapel = await db.mapel.findMany({
      orderBy: [{ semester: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(mapel);
  } catch (error) {
    console.error('Get mapel error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, semester } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { message: 'Nama mapel wajib diisi' },
        { status: 400 }
      );
    }

    if (!semester || typeof semester !== 'number') {
      return NextResponse.json(
        { message: 'Semester wajib diisi' },
        { status: 400 }
      );
    }

    const mapel = await db.mapel.create({
      data: { name, semester },
    });

    return NextResponse.json(mapel, { status: 201 });
  } catch (error) {
    console.error('Create mapel error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, semester } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'ID mapel wajib diisi' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { message: 'Nama mapel wajib diisi' },
        { status: 400 }
      );
    }

    if (!semester || typeof semester !== 'number') {
      return NextResponse.json(
        { message: 'Semester wajib diisi' },
        { status: 400 }
      );
    }

    const mapel = await db.mapel.update({
      where: { id },
      data: { name, semester },
    });

    return NextResponse.json(mapel);
  } catch (error) {
    console.error('Update mapel error:', error);
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
        { message: 'ID mapel wajib diisi' },
        { status: 400 }
      );
    }

    await db.mapel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete mapel error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
