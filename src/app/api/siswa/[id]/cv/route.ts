import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const siswaId = parseInt(id, 10);

    if (isNaN(siswaId)) {
      return NextResponse.json(
        { message: 'ID siswa tidak valid' },
        { status: 400 }
      );
    }

    const siswa = await db.siswa.findUnique({
      where: { id: siswaId },
      include: {
        kelas: true,
        angkatan: true,
        nilai: {
          include: {
            mapel: true,
          },
        },
      },
    });

    if (!siswa) {
      return NextResponse.json(
        { message: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Group nilai by semester
    const nilaiBySemester: Record<number, { mapel: string; value: number }[]> = {};
    let totalValue = 0;
    let totalCount = 0;

    for (const n of siswa.nilai) {
      const sem = n.mapel.semester;
      if (!nilaiBySemester[sem]) {
        nilaiBySemester[sem] = [];
      }
      nilaiBySemester[sem].push({
        mapel: n.mapel.name,
        value: n.value,
      });
      totalValue += n.value;
      totalCount++;
    }

    // Calculate semester averages
    const semesterAverages: Record<number, number> = {};
    for (const [sem, items] of Object.entries(nilaiBySemester)) {
      const semTotal = items.reduce((sum, item) => sum + item.value, 0);
      semesterAverages[parseInt(sem, 10)] = Math.round((semTotal / items.length) * 100) / 100;
    }

    // Overall average
    const overallAverage = totalCount > 0
      ? Math.round((totalValue / totalCount) * 100) / 100
      : 0;

    return NextResponse.json({
      siswa: {
        id: siswa.id,
        name: siswa.name,
        nisn: siswa.nisn,
        jk: siswa.jk,
        birthDate: siswa.birthDate,
        birthPlace: siswa.birthPlace,
        cita: siswa.cita,
        kataMutiara: siswa.kataMutiara,
        foto: siswa.foto,
        kelas: siswa.kelas,
        angkatan: siswa.angkatan,
      },
      nilaiBySemester,
      semesterAverages,
      overallAverage,
    });
  } catch (error) {
    console.error('Get CV error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
