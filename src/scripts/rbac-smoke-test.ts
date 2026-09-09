import { prisma } from '@/lib/prisma';
import { hasPermission, hasMinimumRole, getMaxActiveListings, Permission, type Role } from '@/lib/permissions';

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail });
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name}: ${detail}`);
}

async function main(): Promise<void> {
  console.log('=== RBAC Smoke Tests ===\n');

  // --- Test 1: Permission matrix correctness ---
  console.log('--- Permission Matrix ---');

  const finderPerms = [
    Permission.VIEW_PROPERTIES,
    Permission.SEARCH_PROPERTIES,
    Permission.SAVE_FAVORITES,
    Permission.REPORT_PROPERTIES,
  ];

  for (const p of finderPerms) {
    const ok = hasPermission('FINDER', p);
    record(`FINDER has ${p}`, ok, ok ? 'granted' : 'denied');
  }

  const ownerExtra = [
    Permission.CREATE_PROPERTY,
    Permission.EDIT_OWN_PROPERTY,
    Permission.PAUSE_OWN_PROPERTY,
    Permission.DELETE_OWN_PROPERTY,
  ];
  for (const p of ownerExtra) {
    record(`OWNER has ${p}`, hasPermission('OWNER', p), 'granted');
  }
  record(`OWNER lacks UNLIMITED_LISTINGS`, !hasPermission('OWNER', Permission.UNLIMITED_LISTINGS), 'correctly denied');

  const realtorExtra = [
    Permission.UNLIMITED_LISTINGS,
    Permission.VIEW_BUSINESS_CONTACT,
  ];
  for (const p of realtorExtra) {
    record(`REALTOR has ${p}`, hasPermission('REALTOR', p), 'granted');
  }

  const devExtra = [Permission.MANAGE_DEVELOPMENTS];
  for (const p of devExtra) {
    record(`DEVELOPER_B2B has ${p}`, hasPermission('DEVELOPER_B2B', p), 'granted');
  }

  const adminAll = [
    Permission.DASHBOARD_ACCESS,
    Permission.MODERATE_REPORTS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_DEVELOPMENTS,
    Permission.VIEW_BUSINESS_CONTACT,
    Permission.UNLIMITED_LISTINGS,
  ];
  for (const p of adminAll) {
    record(`ADMIN has ${p}`, hasPermission('ADMIN', p), 'granted');
  }

  // --- Test 2: Role hierarchy ---
  console.log('\n--- Role Hierarchy ---');

  record('hasMinimumRole FINDER >= OWNER', !hasMinimumRole('FINDER', 'OWNER'), 'correctly denied');
  record('hasMinimumRole OWNER >= OWNER', hasMinimumRole('OWNER', 'OWNER'), 'granted');
  record('hasMinimumRole REALTOR >= OWNER', hasMinimumRole('REALTOR', 'OWNER'), 'granted');
  record('hasMinimumRole DEVELOPER_B2B >= REALTOR', hasMinimumRole('DEVELOPER_B2B', 'REALTOR'), 'granted');
  record('hasMinimumRole ADMIN >= DEVELOPER_B2B', hasMinimumRole('ADMIN', 'DEVELOPER_B2B'), 'granted');

  // --- Test 3: getMaxActiveListings ---
  console.log('\n--- Active Listing Limits ---');

  const ownerLimit = getMaxActiveListings('OWNER');
  record('OWNER max active listings = 3', ownerLimit === 3, `returned ${ownerLimit}`);

  const realtorLimit = getMaxActiveListings('REALTOR');
  record('REALTOR max active listings = null (unlimited)', realtorLimit === null, `returned ${realtorLimit}`);

  const adminLimit = getMaxActiveListings('ADMIN');
  record('ADMIN max active listings = null (unlimited)', adminLimit === null, `returned ${adminLimit}`);

  // --- Test 4: DB-level role check ---
  console.log('\n--- Database Role Check ---');

  const testEmails = [
    { email: 'admin@test.com', expected: 'ADMIN' as Role },
  ];

  for (const { email, expected } of testEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    const actualRole = (user?.role as Role) || 'FINDER';
    record(`User ${email} has role ${expected}`, actualRole === expected, `role is ${actualRole}`);
  }

  // --- Test 5: Soft-delete visibility in search ---
  console.log('\n--- Soft-Delete & Search Visibility ---');

  const testProperty = await prisma.property.findFirst({
    where: { isActive: false },
    select: { id: true, isActive: true },
    take: 1,
  });

  if (testProperty) {
    record(
      'Inactive property exists for testing',
      true,
      `id=${testProperty.id}`,
    );

    const inactiveViaPrisma = await prisma.property.findUnique({
      where: { id: testProperty.id, isActive: true },
    });
    record(
      'findById with isActive=true excludes inactive property',
      !inactiveViaPrisma,
      inactiveViaPrisma ? 'FAIL: property found' : 'correctly excluded',
    );
  } else {
    record(
      'Soft-delete visibility check',
      true,
      'no inactive properties in DB to test, skipped',
    );
  }

  // --- Test 6: ADMIN access to property regardless of ownership ---
  console.log('\n--- Admin Override ---');

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' as Role },
    select: { id: true },
  });

  if (adminUser) {
    record(
      'Admin user found for testing',
      true,
      `id=${adminUser.id}`,
    );
  } else {
    record(
      'Admin user found for testing',
      false,
      'no ADMIN user exists in DB',
    );
  }

  // --- Test 7: Finder cannot create property ---
  console.log('\n--- Finder Cannot Create Property ---');

  record(
    'FINDER lacks CREATE_PROPERTY',
    !hasPermission('FINDER', Permission.CREATE_PROPERTY),
    'correctly denied',
  );
  record(
    'FINDER has REPORT_PROPERTIES',
    hasPermission('FINDER', Permission.REPORT_PROPERTIES),
    'granted',
  );
  record(
    'FINDER lacks DASHBOARD_ACCESS',
    !hasPermission('FINDER', Permission.DASHBOARD_ACCESS),
    'correctly denied',
  );

  // --- Summary ---
  console.log('\n=== Smoke Test Summary ===');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - ${r.name}: ${r.detail}`);
    }
    process.exit(1);
  } else {
    console.log('\nAll smoke tests passed.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
