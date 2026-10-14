import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Surgery } from '../entities/surgery.entity';
import { Hospital } from '../entities/hospital.entity';
import { seedUsers } from './seed/users.seed';
import { SURGERIES_DATA } from './seed/surgeries.data';
import { HOSPITALS_DATA } from './seed/hospitals.data';

const logger = new Logger('SeedScript');

const requiredSeedPasswords = [
  'SEED_ADMIN_PASSWORD',
  'SEED_ADMIN2_PASSWORD',
  'SEED_OWNER_PASSWORD',
  'SEED_AGENT_PASSWORD',
  'TEST_MEMBER_PASSWORD',
] as const;

function requireSeedPasswords() {
  const missing = requiredSeedPasswords.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required seed environment variables: ${missing.join(', ')}`);
  }
}

async function bootstrap() {
  requireSeedPasswords();
  logger.log('🌱 Starting database seed...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  // Check if admin already exists
  const existingAdmin = await dataSource.manager.findOne(User, {
    where: { role: UserRole.ADMIN },
  });

  if (existingAdmin) {
    logger.log('⚠️  Admin user already exists. Skipping seed.');
    await app.close();
    return;
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Seed Users (SuperAdmin, Admin, Owner, Agent, Member, Payment, Membership)
    await seedUsers(queryRunner, logger);

    // 2. Seed Surgeries (Covered Diseases List)
    for (let i = 0; i < SURGERIES_DATA.length; i++) {
      const s = SURGERIES_DATA[i];
      const surgery = queryRunner.manager.create(Surgery, {
        nameEn: s.nameEn,
        nameBn: s.nameBn,
        category: s.category,
        isCovered: true,
        waitingPeriodDays: 30,
        maxAssistance: 12000,
        sortOrder: i + 1,
        isActive: true,
      });
      await queryRunner.manager.save(surgery);
    }
    logger.log(`✅ ${SURGERIES_DATA.length} surgeries seeded`);

    // 3. Seed Hospitals
    for (const h of HOSPITALS_DATA) {
      const hospital = queryRunner.manager.create(Hospital, {
        name: h.name,
        address: h.address,
        contactNumber: h.contact,
        isPartner: h.isPartner,
        isActive: true,
      });
      await queryRunner.manager.save(hospital);
    }
    logger.log(`✅ ${HOSPITALS_DATA.length} hospitals seeded`);

    await queryRunner.commitTransaction();

    logger.log('\n========================================');
    logger.log('🌱 SEED COMPLETE');
    logger.log('========================================');
    logger.log('\n📋 Login Credentials:\n');
    logger.log(
      'Seeded staff and member accounts. Passwords were supplied through environment variables.',
    );
    logger.log(
      'Use the configured seed credentials for local access and rotate them before production use.',
    );
    logger.log('========================================\n');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ Seed failed:', errorMessage);
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(errorMessage);
    process.exit(1);
  });
