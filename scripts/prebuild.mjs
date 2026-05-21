import { execSync } from 'child_process';

const dbUrl = process.env.DATABASE_URL || '';
const directUrl = process.env.DIRECT_URL || '';

// Detect placeholder values (contain square brackets like [project-ref], [password], [region])
const hasPlaceholder = (url) =>
  !url || url.includes('[') || url.includes(']');

if (hasPlaceholder(dbUrl) || hasPlaceholder(directUrl)) {
  console.warn('⚠️  DATABASE_URL or DIRECT_URL contains placeholder values or is not set.');
  console.warn('   Skipping database push and seeding.');
  console.warn('   To enable database setup, set valid Supabase connection strings');
  console.warn('   in your Netlify environment variables (DATABASE_URL and DIRECT_URL).');
  process.exit(0);
}

console.log('✅ Database URL detected. Running prisma db push...');
try {
  execSync('prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Schema pushed successfully.');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully.');
} catch (err) {
  console.error('❌ Database setup failed:', err.message);
  process.exit(1);
}
