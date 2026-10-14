import { Logger } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Agent } from '../../entities/agent.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment, PaymentStatus, PaymentType } from '../../entities/payment.entity';

export async function seedUsers(queryRunner: QueryRunner, logger: Logger) {
  // 1. Super Admin
  const superAdminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD!, 12);
  const superAdmin = queryRunner.manager.create(User, {
    memberId: 'ATB-26-SA-1',
    fullName: 'System Administrator',
    mobileNumber: '01700000000',
    email: 'admin@atbltd.health',
    password: superAdminPassword,
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    isKycVerified: true,
    permanentAddress: 'ATB Headquarters, Uttara, Dhaka',
  });
  const savedSuperAdmin = await queryRunner.manager.save(superAdmin);
  logger.log(`✅ Super Admin created: ${savedSuperAdmin.memberId}`);

  // 2. Second Admin
  const secondAdminPassword = await bcrypt.hash(process.env.SEED_ADMIN2_PASSWORD!, 12);
  const secondAdmin = queryRunner.manager.create(User, {
    memberId: 'ATB-26-AD-1',
    fullName: 'Finance Director',
    mobileNumber: '01700000001',
    email: 'finance@atbltd.health',
    password: secondAdminPassword,
    role: UserRole.ADMIN,
    isActive: true,
    isKycVerified: true,
    permanentAddress: 'ATB Headquarters, Uttara, Dhaka',
  });
  const savedSecondAdmin = await queryRunner.manager.save(secondAdmin);
  logger.log(`✅ Second Admin created: ${savedSecondAdmin.memberId}`);

  // 3. Owner
  const ownerPassword = await bcrypt.hash(process.env.SEED_OWNER_PASSWORD!, 12);
  const owner = queryRunner.manager.create(User, {
    memberId: 'ATB-26-OW-1',
    fullName: 'Seed Owner',
    mobileNumber: '01700000002',
    email: 'seed.owner@atbltd.health',
    password: ownerPassword,
    role: UserRole.OWNER,
    isActive: true,
    isKycVerified: true,
    permanentAddress: 'Test Address, Dhaka, Bangladesh',
  });
  const savedOwner = await queryRunner.manager.save(owner);
  logger.log(`✅ Owner created: ${savedOwner.memberId}`);

  // Create Agent record for the Owner
  const ownerAgent = queryRunner.manager.create(Agent, {
    userId: savedOwner.id,
    agentCode: 'ATB-26-OW-1',
    commissionRate: 15.0,
    isActive: true,
    createdBy: savedSuperAdmin.memberId,
    createdByName: savedSuperAdmin.fullName,
    createdByRole: 'super_admin',
  });
  await queryRunner.manager.save(ownerAgent);
  logger.log(`✅ Owner agent record created: ${ownerAgent.agentCode}`);

  // 4. Sample Agent
  const agentPassword = await bcrypt.hash(process.env.SEED_AGENT_PASSWORD!, 12);
  const agentUser = queryRunner.manager.create(User, {
    memberId: 'ATB-26-AG-1',
    fullName: 'Sample Agent',
    mobileNumber: '01710000001',
    email: 'agent@atbltd.health',
    password: agentPassword,
    role: UserRole.AGENT,
    isActive: true,
    isKycVerified: true,
    permanentAddress: 'Dhaka, Bangladesh',
  });
  const savedAgentUser = await queryRunner.manager.save(agentUser);

  const agent = queryRunner.manager.create(Agent, {
    userId: savedAgentUser.id,
    agentCode: 'ATB-26-AG-1',
    commissionRate: 10.0,
    parentAgentId: null,
    isActive: true,
    createdBy: savedSuperAdmin.memberId,
    createdByName: savedSuperAdmin.fullName,
    createdByRole: 'super_admin',
  });
  await queryRunner.manager.save(agent);
  logger.log(`✅ Agent created: ${agent.agentCode}`);

  // 5. Sample Member (fully activated)
  const memberPassword = await bcrypt.hash(process.env.TEST_MEMBER_PASSWORD!, 12);
  const member = queryRunner.manager.create(User, {
    memberId: 'ATB-26-ME-01',
    fullName: 'Sample Member',
    fatherName: 'Sample Father',
    motherName: 'Sample Mother',
    dateOfBirth: new Date('1990-01-15'),
    nid: '1234567890',
    mobileNumber: '01710000002',
    email: 'member@example.com',
    password: memberPassword,
    role: UserRole.MEMBER,
    isActive: true,
    isKycVerified: true,
    permanentAddress: '123 Sample Street, Dhaka',
    currentAddress: '123 Sample Street, Dhaka',
    emergencyContact: '01710000003',
    referralId: 'ATB-26-AG-1',
  });
  const savedMember = await queryRunner.manager.save(member);
  logger.log(`✅ Member created: ${savedMember.memberId}`);

  // Membership record
  const membership = queryRunner.manager.create(Membership, {
    userId: savedMember.id,
    membershipFee: 1000.0,
    isPaymentVerified: true,
    paymentMethod: 'bkash',
    transactionId: 'TXNSAMPLE001',
    paymentVerifiedBy: savedSuperAdmin.id,
    paymentVerifiedAt: new Date(),
    membershipStartDate: new Date('2026-06-01'),
    membershipEndDate: new Date('2027-06-01'),
    isActive: true,
    remainingBenefit: 12000.0,
    renewalFee: 850.0,
  });
  await queryRunner.manager.save(membership);
  logger.log(`✅ Membership activated for ${savedMember.memberId}`);

  // Payment record
  const payment = queryRunner.manager.create(Payment, {
    userId: savedMember.id,
    paymentType: PaymentType.MEMBERSHIP_FEE,
    amount: 1000.0,
    method: 'bkash',
    transactionId: 'TXNSAMPLE001',
    senderAccount: '01710000002',
    recipientAccount: '01721719611',
    status: PaymentStatus.VERIFIED,
    verifiedBy: savedSuperAdmin.id,
    verifiedAt: new Date(),
  });
  await queryRunner.manager.save(payment);
  logger.log(`✅ Payment recorded for ${savedMember.memberId}`);

  // Increment agent stats
  agent.totalMembersRegistered += 1;
  agent.activeMembers += 1;
  await queryRunner.manager.save(agent);
}
