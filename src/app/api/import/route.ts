import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rows, angkatanId } = body;

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { message: 'Data CSV wajib diisi' },
        { status: 400 }
      );
    }

    if (!angkatanId) {
      return NextResponse.json(
        { message: 'Angkatan ID wajib diisi' },
        { status: 400 }
      );
    }

    let imported = 0;

    for (const row of rows) {
      const { nama, nisn, kelas, jk, tempat_lahir, tgl_lahir } = row;

      if (!nama || !nisn || !kelas) continue;

      // Auto-create kelas if not exists
      let kelasRecord = await db.kelas.findUnique({
        where: { name: kelas },
      });

      if (!kelasRecord) {
        kelasRecord = await db.kelas.create({
          data: { name: kelas },
        });
      }

      // Check if NISN already exists
      const existing = await db.siswa.findFirst({
        where: { nisn },
      });

      if (existing) continue;

      // Create siswa
      await db.siswa.create({
        data: {
          name: nama,
          nisn,
          kelasId: kelasRecord.id,
          jk: jk || 'L',
          angkatanId: parseInt(angkatanId, 10),
          birthDate: tgl_lahir || '',
          birthPlace: tempat_lahir || '',
          cita: '',
          kataMutiara: '',
          foto: '',
        },
      });

      imported++;
    }

    return NextResponse.json({ imported });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
