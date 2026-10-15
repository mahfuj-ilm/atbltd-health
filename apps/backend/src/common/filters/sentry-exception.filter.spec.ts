import { HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { SentryExceptionFilter } from './sentry-exception.filter';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

describe('SentryExceptionFilter', () => {
  let filter: SentryExceptionFilter;
  let mockHost: any;
  let mockSuperCatch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new SentryExceptionFilter();
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        }),
        getRequest: jest.fn().mockReturnValue({ url: '/test' }),
      }),
    };
    // BaseExceptionFilter delegates to httpAdapterHost; spy on super.catch so the
    // filter's capture logic runs without requiring a full Nest HTTP adapter.
    mockSuperCatch = jest
      .spyOn(Object.getPrototypeOf(SentryExceptionFilter.prototype), 'catch')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    mockSuperCatch.mockRestore();
  });

  it('captures unhandled 5xx HttpExceptions with Sentry', () => {
    const error = new InternalServerErrorException('Database failure');

    filter.catch(error, mockHost);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(mockSuperCatch).toHaveBeenCalledWith(error, mockHost);
  });

  it('does NOT capture 4xx client errors (e.g. 400 BadRequest)', () => {
    const error = new HttpException('Bad input', HttpStatus.BAD_REQUEST);

    filter.catch(error, mockHost);

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(mockSuperCatch).toHaveBeenCalledWith(error, mockHost);
  });

  it('does NOT capture 404 NotFound errors', () => {
    const error = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(error, mockHost);

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(mockSuperCatch).toHaveBeenCalledWith(error, mockHost);
  });

  it('captures non-HttpException errors (unhandled runtime errors)', () => {
    const error = new TypeError('Cannot read property of undefined');

    filter.catch(error, mockHost);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(mockSuperCatch).toHaveBeenCalledWith(error, mockHost);
  });
});
