import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.nilai.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.mapel.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.angkatan.deleteMany();
  await prisma.schoolSettings.deleteMany();
  await prisma.adminAccount.deleteMany();

  // Create school settings
  await prisma.schoolSettings.create({
    data: {
      id: 'school',
      name: 'SMA Nusantara',
      npsn: '50101234',
      address: 'Jl. Pendidikan No. 1',
      city: 'Samarinda',
      phone: '0541-123456',
      email: 'info@smanusantara.sch.id',
      accreditation: 'A',
      logo: '',
    },
  });
  console.log('✅ School settings created');

  // Create admin account
  await prisma.adminAccount.create({
    data: {
      id: 'admin',
      username: 'admin',
      password: 'admin123',
      displayName: 'Administrator',
    },
  });
  console.log('✅ Admin account created');

  // Create Angkatan
  const angkatan2022 = await prisma.angkatan.create({ data: { year: 2022 } });
  const angkatan2023 = await prisma.angkatan.create({ data: { year: 2023 } });
  const angkatan2024 = await prisma.angkatan.create({ data: { year: 2024 } });
  console.log('✅ Angkatan created');

  // Create Kelas
  const kelasData = [
    'X IPA 1', 'X IPA 2', 'X IPS 1',
    'XI IPA 1', 'XI IPA 2', 'XI IPS 1',
    'XII IPA 1', 'XII IPA 2', 'XII IPS 1',
  ];

  const kelasRecords: Record<string, { id: number; name: string }> = {};
  for (const name of kelasData) {
    const kelas = await prisma.kelas.create({ data: { name } });
    kelasRecords[name] = kelas;
  }
  console.log('✅ Kelas created');

  // Create Mapel
  const mapelData = [
    { name: 'Matematika', semester: 1 },
    { name: 'Bhs. Indonesia', semester: 1 },
    { name: 'Bhs. Inggris', semester: 1 },
    { name: 'Fisika', semester: 2 },
    { name: 'Kimia', semester: 2 },
    { name: 'Biologi', semester: 2 },
    { name: 'Sejarah', semester: 3 },
    { name: 'PKn', semester: 3 },
    { name: 'PJOK', semester: 3 },
    { name: 'Seni Budaya', semester: 4 },
    { name: 'Prakarya', semester: 4 },
    { name: 'Fisika Lanjut', semester: 5 },
    { name: 'Kimia Lanjut', semester: 5 },
    { name: 'Geografi', semester: 6 },
    { name: 'Ekonomi', semester: 6 },
  ];

  const mapelRecords: { id: number }[] = [];
  for (const m of mapelData) {
    const mapel = await prisma.mapel.create({ data: m });
    mapelRecords.push(mapel);
  }
  console.log('✅ Mapel created');

  // Create Siswa
  const siswaData = [
    {
      name: 'Andi Prasetyo', nisn: '0012345678', kelasName: 'XII IPA 1', jk: 'L',
      angkatanId: angkatan2022.id, birthDate: '2006-05-10', birthPlace: 'Samarinda',
      cita: 'Insinyur Pertambangan', kataMutiara: 'Ilmu adalah cahaya yang menerangi jalan menuju masa depan.',
      nilaiMap: { 1: 88, 2: 92, 3: 90, 4: 82, 5: 85, 6: 78, 7: 84, 8: 90, 9: 94, 10: 75, 11: 88, 12: 80, 13: 84, 14: 90, 15: 93 },
    },
    {
      name: 'Budi Santoso', nisn: '0012345679', kelasName: 'XII IPA 2', jk: 'L',
      angkatanId: angkatan2022.id, birthDate: '2006-03-22', birthPlace: 'Balikpapan',
      cita: 'Dokter', kataMutiara: 'Kesehatan adalah investasi terbaik dalam hidup.',
      nilaiMap: { 1: 75, 2: 82, 3: 78, 4: 70, 5: 65, 6: 76, 7: 72, 8: 80, 9: 86, 10: 62, 11: 75, 12: 68, 13: 70, 14: 78, 15: 83 },
    },
    {
      name: 'Citra Dewi', nisn: '0012345680', kelasName: 'XII IPS 1', jk: 'P',
      angkatanId: angkatan2022.id, birthDate: '2006-07-15', birthPlace: 'Bontang',
      cita: 'Arsitek', kataMutiara: 'Kreativitas adalah kecerdasan yang sedang bersenang-senang.',
      nilaiMap: { 1: 95, 2: 97, 3: 93, 4: 90, 5: 92, 6: 88, 7: 91, 8: 95, 9: 98, 10: 83, 11: 94, 12: 87, 13: 91, 14: 93, 15: 97 },
    },
    {
      name: 'Dian Puspita', nisn: '0012345681', kelasName: 'XI IPA 1', jk: 'P',
      angkatanId: angkatan2023.id, birthDate: '2007-01-09', birthPlace: 'Tenggarong',
      cita: 'Psikolog', kataMutiara: 'Setiap hari adalah kesempatan baru untuk belajar dan bertumbuh.',
      nilaiMap: { 1: 80, 2: 88, 3: 85, 4: 76, 5: 79, 6: 72, 7: 78, 8: 86, 9: 90, 10: 69, 11: 81, 12: 74, 13: 77, 14: 83, 15: 88 },
    },
    {
      name: 'Eka Saputra', nisn: '0012345682', kelasName: 'XI IPA 2', jk: 'L',
      angkatanId: angkatan2023.id, birthDate: '2007-04-17', birthPlace: 'Samarinda',
      cita: 'Pilot', kataMutiara: 'Impian tanpa usaha hanyalah harapan kosong.',
      nilaiMap: { 1: 72, 2: 78, 3: 74, 4: 68, 5: 64, 6: 70, 7: 67, 8: 76, 9: 82, 10: 60, 11: 71, 12: 65, 13: 68, 14: 74, 15: 79 },
    },
    {
      name: 'Fajar Ramadhan', nisn: '0012345683', kelasName: 'XI IPS 1', jk: 'L',
      angkatanId: angkatan2023.id, birthDate: '2007-08-30', birthPlace: 'Jakarta',
      cita: 'Pengusaha', kataMutiara: 'Kesuksesan adalah buah dari kerja keras dan ketekunan.',
      nilaiMap: { 1: 68, 2: 75, 3: 71, 4: 65, 5: 62, 6: 68, 7: 64, 8: 72, 9: 78, 10: 58, 11: 68, 12: 62, 13: 65, 14: 70, 15: 75 },
    },
    {
      name: 'Gita Nuraini', nisn: '0012345684', kelasName: 'X IPA 1', jk: 'P',
      angkatanId: angkatan2024.id, birthDate: '2008-02-14', birthPlace: 'Surabaya',
      cita: 'Peneliti', kataMutiara: 'Rasa ingin tahu adalah mesin ilmu pengetahuan.',
      nilaiMap: { 1: 91, 2: 94, 3: 89, 4: 87, 5: 90, 6: 85, 7: 88, 8: 93, 9: 96, 10: 80, 11: 91, 12: 85, 13: 89, 14: 92, 15: 95 },
    },
    {
      name: 'Hendra Wijaya', nisn: '0012345685', kelasName: 'X IPA 2', jk: 'L',
      angkatanId: angkatan2024.id, birthDate: '2008-06-05', birthPlace: 'Balikpapan',
      cita: 'Software Engineer', kataMutiara: 'Kode yang baik adalah puisi yang bisa dijalankan mesin.',
      nilaiMap: { 1: 78, 2: 85, 3: 81, 4: 74, 5: 77, 6: 71, 7: 76, 8: 83, 9: 88, 10: 68, 11: 79, 12: 72, 13: 76, 14: 81, 15: 86 },
    },
    {
      name: 'Indah Sari', nisn: '0012345686', kelasName: 'X IPS 1', jk: 'P',
      angkatanId: angkatan2024.id, birthDate: '2008-11-22', birthPlace: 'Samarinda',
      cita: 'Diplomat', kataMutiara: 'Perdamaian dimulai dari satu langkah kecil penuh pengertian.',
      nilaiMap: { 1: 65, 2: 72, 3: 68, 4: 62, 5: 60, 6: 66, 7: 63, 8: 70, 9: 76, 10: 56, 11: 65, 12: 60, 13: 63, 14: 68, 15: 73 },
    },
    {
      name: 'Joko Susilo', nisn: '0012345687', kelasName: 'XII IPA 1', jk: 'L',
      angkatanId: angkatan2022.id, birthDate: '2006-09-01', birthPlace: 'Penajam',
      cita: 'Guru', kataMutiara: 'Mendidik satu anak berarti menyiapkan masa depan bangsa.',
      nilaiMap: { 1: 83, 2: 90, 3: 86, 4: 79, 5: 82, 6: 76, 7: 80, 8: 88, 9: 92, 10: 71, 11: 83, 12: 76, 13: 80, 14: 86, 15: 90 },
    },
  ];

  for (const s of siswaData) {
    const kelasId = kelasRecords[s.kelasName]?.id;
    if (!kelasId) {
      console.error(`Kelas not found: ${s.kelasName}`);
      continue;
    }

    const siswa = await prisma.siswa.create({
      data: {
        name: s.name,
        nisn: s.nisn,
        kelasId,
        jk: s.jk,
        angkatanId: s.angkatanId,
        birthDate: s.birthDate,
        birthPlace: s.birthPlace,
        cita: s.cita,
        kataMutiara: s.kataMutiara,
        foto: '',
      },
    });

    // Create nilai
    for (const [mapelIndexStr, value] of Object.entries(s.nilaiMap)) {
      const mapelIndex = parseInt(mapelIndexStr, 10) - 1; // Convert 1-based to 0-based
      const mapel = mapelRecords[mapelIndex];
      if (mapel) {
        await prisma.nilai.create({
          data: {
            siswaId: siswa.id,
            mapelId: mapel.id,
            value: value as number,
          },
        });
      }
    }
  }
  console.log('✅ Siswa and Nilai created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
