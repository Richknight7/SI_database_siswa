import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const angkatanId = searchParams.get('angkatanId');
    const semester = searchParams.get('semester');

    if (!angkatanId) {
      return NextResponse.json(
        { message: 'Angkatan ID wajib diisi' },
        { status: 400 }
      );
    }

    // Get all mapel, optionally filtered by semester
    const mapelWhere = semester ? { semester: parseInt(semester, 10) } : {};
    const allMapel = await db.mapel.findMany({
      where: mapelWhere,
      orderBy: [{ semester: 'asc' }, { name: 'asc' }],
    });

    // Group mapel by semester
    const mapelBySem: Record<number, typeof allMapel> = {};
    for (const m of allMapel) {
      if (!mapelBySem[m.semester]) {
        mapelBySem[m.semester] = [];
      }
      mapelBySem[m.semester].push(m);
    }

    // Get all siswa in this angkatan with their nilai
    const siswaList = await db.siswa.findMany({
      where: { angkatanId: parseInt(angkatanId, 10) },
      include: {
        kelas: true,
        angkatan: true,
        nilai: {
          include: {
            mapel: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Map nilai for each siswa
    const siswaWithNilai = siswaList.map((s) => {
      const nilaiMap: Record<number, number> = {};
      for (const n of s.nilai) {
        // If semester filter is active, only include nilai for that semester's mapel
        if (!semester || n.mapel.semester === parseInt(semester, 10)) {
          nilaiMap[n.mapelId] = n.value;
        }
      }
      return {
        ...s,
        nilaiMap,
      };
    });

    return NextResponse.json({
      siswa: siswaWithNilai,
      mapelBySem,
    });
  } catch (error) {
    console.error('Get nilai error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { values } = body;

    if (!values || !Array.isArray(values)) {
      return NextResponse.json(
        { message: 'Data nilai wajib diisi' },
        { status: 400 }
      );
    }

    // Upsert each nilai record
    for (const v of values) {
      const { siswaId, mapelId, value } = v;

      if (siswaId === undefined || mapelId === undefined || value === undefined) {
        continue;
      }

      await db.nilai.upsert({
        where: {
          siswaId_mapelId: {
            siswaId,
            mapelId,
          },
        },
        update: { value },
        create: {
          siswaId,
          mapelId,
          value,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save nilai error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
