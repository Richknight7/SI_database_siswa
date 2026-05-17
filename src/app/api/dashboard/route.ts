import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Total counts
    const totalSiswa = await db.siswa.count();
    const totalL = await db.siswa.count({ where: { jk: 'L' } });
    const totalP = await db.siswa.count({ where: { jk: 'P' } });

    // Angkatan stats
    const angkatanList = await db.angkatan.findMany({
      orderBy: { year: 'asc' },
      include: {
        siswa: {
          include: {
            kelas: true,
          },
        },
      },
    });

    const totalAngkatan = angkatanList.length;

    const angkatanStats = angkatanList.map((a) => {
      const l = a.siswa.filter((s) => s.jk === 'L').length;
      const p = a.siswa.filter((s) => s.jk === 'P').length;
      const kelasSet = new Set(a.siswa.map((s) => s.kelasId));
      return {
        angkatan: a,
        total: a.siswa.length,
        l,
        p,
        kelasCount: kelasSet.size,
      };
    });

    // Top 3 students by average per angkatan
    const top3ByAngkatan = [];

    for (const a of angkatanList) {
      if (a.siswa.length === 0) continue;

      const siswaWithAvg = [];

      for (const s of a.siswa) {
        const nilaiList = await db.nilai.findMany({
          where: { siswaId: s.id },
        });

        if (nilaiList.length === 0) {
          siswaWithAvg.push({
            name: s.name,
            kelas: s.kelas?.name || '',
            avg: 0,
            foto: s.foto,
            jk: s.jk,
          });
        } else {
          const avg = nilaiList.reduce((sum, n) => sum + n.value, 0) / nilaiList.length;
          siswaWithAvg.push({
            name: s.name,
            kelas: s.kelas?.name || '',
            avg: Math.round(avg * 100) / 100,
            foto: s.foto,
            jk: s.jk,
          });
        }
      }

      // Sort by average descending and take top 3
      siswaWithAvg.sort((a, b) => b.avg - a.avg);
      top3ByAngkatan.push({
        angkatan: a,
        students: siswaWithAvg.slice(0, 3),
      });
    }

    return NextResponse.json({
      totalSiswa,
      totalL,
      totalP,
      totalAngkatan,
      angkatanStats,
      top3ByAngkatan,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
