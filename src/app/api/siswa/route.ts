import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const angkatanId = searchParams.get('angkatanId');
    const search = searchParams.get('search');
    const kelas = searchParams.get('kelas');
    const jk = searchParams.get('jk');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const rpp = parseInt(searchParams.get('rpp') || '10', 10);

    const where: Prisma.SiswaWhereInput = {};

    if (angkatanId) {
      where.angkatanId = parseInt(angkatanId, 10);
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nisn: { contains: search } },
      ];
    }

    if (kelas) {
      where.kelas = { name: kelas };
    }

    if (jk) {
      where.jk = jk;
    }

    const total = await db.siswa.count({ where });
    const totalPages = Math.ceil(total / rpp);

    const data = await db.siswa.findMany({
      where,
      include: {
        kelas: true,
        angkatan: true,
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * rpp,
      take: rpp,
    });

    return NextResponse.json({
      data,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Get siswa error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nisn, kelasId, jk, angkatanId, birthDate, birthPlace, cita, kataMutiara, foto } = body;

    if (!name || !nisn || !kelasId || !angkatanId) {
      return NextResponse.json(
        { message: 'Nama, NISN, Kelas, dan Angkatan wajib diisi' },
        { status: 400 }
      );
    }

    // Check NISN uniqueness
    const existingNisn = await db.siswa.findFirst({
      where: { nisn },
    });

    if (existingNisn) {
      return NextResponse.json(
        { message: 'NISN sudah terdaftar' },
        { status: 400 }
      );
    }

    const siswa = await db.siswa.create({
      data: {
        name,
        nisn,
        kelasId: parseInt(kelasId, 10),
        jk: jk || 'L',
        angkatanId: parseInt(angkatanId, 10),
        birthDate: birthDate || '',
        birthPlace: birthPlace || '',
        cita: cita || '',
        kataMutiara: kataMutiara || '',
        foto: foto || '',
      },
      include: {
        kelas: true,
        angkatan: true,
      },
    });

    return NextResponse.json(siswa, { status: 201 });
  } catch (error) {
    console.error('Create siswa error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, nisn, kelasId, jk, angkatanId, birthDate, birthPlace, cita, kataMutiara, foto } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'ID siswa wajib diisi' },
        { status: 400 }
      );
    }

    // Check NISN uniqueness (exclude current siswa)
    if (nisn) {
      const existingNisn = await db.siswa.findFirst({
        where: { nisn, NOT: { id } },
      });

      if (existingNisn) {
        return NextResponse.json(
          { message: 'NISN sudah digunakan siswa lain' },
          { status: 400 }
        );
      }
    }

    const updateData: Prisma.SiswaUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (nisn !== undefined) updateData.nisn = nisn;
    if (jk !== undefined) updateData.jk = jk;
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace;
    if (cita !== undefined) updateData.cita = cita;
    if (kataMutiara !== undefined) updateData.kataMutiara = kataMutiara;
    if (foto !== undefined) updateData.foto = foto;
    if (kelasId !== undefined) {
      updateData.kelas = { connect: { id: parseInt(kelasId, 10) } };
    }
    if (angkatanId !== undefined) {
      updateData.angkatan = { connect: { id: parseInt(angkatanId, 10) } };
    }

    const siswa = await db.siswa.update({
      where: { id },
      data: updateData,
      include: {
        kelas: true,
        angkatan: true,
      },
    });

    return NextResponse.json(siswa);
  } catch (error) {
    console.error('Update siswa error:', error);
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
        { message: 'ID siswa wajib diisi' },
        { status: 400 }
      );
    }

    await db.siswa.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete siswa error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
