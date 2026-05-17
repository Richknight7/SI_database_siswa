import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const school = await db.schoolSettings.findUnique({
      where: { id: 'school' },
    });

    const admin = await db.adminAccount.findUnique({
      where: { id: 'admin' },
    });

    if (!school || !admin) {
      return NextResponse.json(
        { message: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      school,
      admin: {
        username: admin.username,
        displayName: admin.displayName,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { school, admin } = body;

    // Update school settings
    if (school) {
      await db.schoolSettings.upsert({
        where: { id: 'school' },
        update: {
          ...(school.name !== undefined && { name: school.name }),
          ...(school.npsn !== undefined && { npsn: school.npsn }),
          ...(school.address !== undefined && { address: school.address }),
          ...(school.city !== undefined && { city: school.city }),
          ...(school.phone !== undefined && { phone: school.phone }),
          ...(school.email !== undefined && { email: school.email }),
          ...(school.accreditation !== undefined && { accreditation: school.accreditation }),
          ...(school.logo !== undefined && { logo: school.logo }),
        },
        create: {
          id: 'school',
          name: school.name ?? 'SMA Nusantara',
          npsn: school.npsn ?? '',
          address: school.address ?? '',
          city: school.city ?? '',
          phone: school.phone ?? '',
          email: school.email ?? '',
          accreditation: school.accreditation ?? '',
          logo: school.logo ?? '',
        },
      });
    }

    // Update admin account
    if (admin) {
      const currentAdmin = await db.adminAccount.findUnique({
        where: { id: 'admin' },
      });

      // If changing password, validate confirmPassword
      if (admin.password) {
        if (!admin.confirmPassword) {
          return NextResponse.json(
            { success: false, message: 'Konfirmasi password wajib diisi' },
            { status: 400 }
          );
        }
        if (admin.password !== admin.confirmPassword) {
          return NextResponse.json(
            { success: false, message: 'Password dan konfirmasi password tidak cocok' },
            { status: 400 }
          );
        }
      }

      // Check username uniqueness
      if (admin.username && currentAdmin && admin.username !== currentAdmin.username) {
        // Since it's a singleton, we just update it
      }

      const updateData: Record<string, string> = {};
      if (admin.displayName !== undefined) updateData.displayName = admin.displayName;
      if (admin.username !== undefined) updateData.username = admin.username;
      if (admin.password) updateData.password = admin.password;

      if (Object.keys(updateData).length > 0) {
        await db.adminAccount.upsert({
          where: { id: 'admin' },
          update: updateData,
          create: {
            id: 'admin',
            username: admin.username ?? 'admin',
            password: admin.password ?? 'admin123',
            displayName: admin.displayName ?? 'Admin',
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
