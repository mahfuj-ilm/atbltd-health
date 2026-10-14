import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from './strategies/jwt.strategy';

describe('AuthController', () => {
  let controller: AuthController;
  let validationPipe: ValidationPipe;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
    getProfile: jest.fn(),
    memberLogin: jest.fn(),
    sendStaffLoginOtp: jest.fn(),
    verifyStaffOtp: jest.fn(),
    updateProfile: jest.fn(),
  };

  const sampleUserPayload: JwtPayload = {
    sub: 'user-uuid-1',
    mobileNumber: '01712345678',
    role: UserRole.MEMBER,
    memberId: 'MEM-001',
  };

  beforeEach(() => {
    controller = new AuthController(mockAuthService as unknown as AuthService);
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    jest.clearAllMocks();
  });

  describe('ValidationPipe with RegisterDto (Zero-Network Validation)', () => {
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: RegisterDto,
      data: '',
    };

    it('rejects malformed registration input with invalid email and non-whitelisted fields', async () => {
      const invalidData = {
        fullName: 'A', // too short (< 2)
        mobileNumber: '01712345678',
        email: 'not-an-email',
        paymentMethod: 'bkash',
        senderAccount: '01712345678',
        unexpectedField: 'reject me',
      };

      await expect(validationPipe.transform(invalidData, metadata)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('successfully validates a well-formed registration payload', async () => {
      const validData: RegisterDto = {
        fullName: 'Rahim Uddin',
        mobileNumber: '01712345678',
        email: 'rahim@example.com',
        paymentMethod: 'bkash',
        senderAccount: '01712345678',
      };

      const transformed = await validationPipe.transform(validData, metadata);
      expect(transformed).toBeInstanceOf(RegisterDto);
      expect(transformed.fullName).toBe('Rahim Uddin');
    });
  });

  describe('Endpoint Handlers', () => {
    it('delegates registration to AuthService.register', async () => {
      const registerDto: RegisterDto = {
        fullName: 'Rahim Uddin',
        mobileNumber: '01712345678',
        paymentMethod: 'bkash',
        senderAccount: '01712345678',
      };
      const expectedResult = { id: 'user-1', status: 'PENDING' };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);
      expect(result).toBe(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('delegates login to AuthService.login', async () => {
      const loginDto: LoginDto = {
        identifier: '01712345678',
        password: 'Password123!',
      };
      const expectedResult = { accessToken: 'jwt-token-abc' };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);
      expect(result).toBe(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('delegates sendOtp to AuthService.sendOtp', async () => {
      mockAuthService.sendOtp.mockResolvedValue({ message: 'OTP sent' });

      const result = await controller.sendOtp('01712345678');
      expect(result).toEqual({ message: 'OTP sent' });
      expect(mockAuthService.sendOtp).toHaveBeenCalledWith('01712345678');
    });

    it('delegates verifyOtp to AuthService.verifyOtp', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        mobileNumber: '01712345678',
        otp: '123456',
      };
      const expectedResult = { accessToken: 'jwt-token-verified' };
      mockAuthService.verifyOtp.mockResolvedValue(expectedResult);

      const result = await controller.verifyOtp(verifyOtpDto);
      expect(result).toBe(expectedResult);
      expect(mockAuthService.verifyOtp).toHaveBeenCalledWith(verifyOtpDto);
    });

    it('delegates getProfile to AuthService.getProfile using authenticated user ID', async () => {
      const expectedProfile = { id: 'user-uuid-1', fullName: 'Rahim' };
      mockAuthService.getProfile.mockResolvedValue(expectedProfile);

      const result = await controller.getProfile(sampleUserPayload);
      expect(result).toBe(expectedProfile);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith('user-uuid-1');
    });

    it('returns current user session summary', async () => {
      const result = await controller.getCurrentUser(sampleUserPayload);
      expect(result).toEqual({
        memberId: 'MEM-001',
        role: UserRole.MEMBER,
        mobileNumber: '01712345678',
      });
    });

    it('delegates memberLogin to AuthService.memberLogin', async () => {
      const expectedResult = { memberId: 'MEM-001', token: 'member-jwt' };
      mockAuthService.memberLogin.mockResolvedValue(expectedResult);

      const result = await controller.memberLogin('MEM-001');
      expect(result).toBe(expectedResult);
      expect(mockAuthService.memberLogin).toHaveBeenCalledWith('MEM-001');
    });

    it('delegates sendStaffLoginOtp to AuthService.sendStaffLoginOtp', async () => {
      mockAuthService.sendStaffLoginOtp.mockResolvedValue({ status: 'SUCCESS' });

      const result = await controller.sendStaffLoginOtp('STAFF-001');
      expect(result).toEqual({ status: 'SUCCESS' });
      expect(mockAuthService.sendStaffLoginOtp).toHaveBeenCalledWith('STAFF-001');
    });

    it('delegates verifyStaffOtp to AuthService.verifyStaffOtp', async () => {
      const expectedResult = { token: 'staff-jwt' };
      mockAuthService.verifyStaffOtp.mockResolvedValue(expectedResult);

      const result = await controller.verifyStaffOtp('STAFF-001', '654321');
      expect(result).toBe(expectedResult);
      expect(mockAuthService.verifyStaffOtp).toHaveBeenCalledWith('STAFF-001', '654321');
    });

    it('delegates updateProfile to AuthService.updateProfile', async () => {
      const updateData = { fullName: 'Updated Name', email: 'updated@example.com' };
      const expectedUpdated = { id: 'user-uuid-1', ...updateData };
      mockAuthService.updateProfile.mockResolvedValue(expectedUpdated);

      const result = await controller.updateProfile(sampleUserPayload, updateData);
      expect(result).toBe(expectedUpdated);
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith('user-uuid-1', updateData);
    });
  });
});
