import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Create deep mock of Prisma
jest.mock('@prisma/client', () => ({
    __esModule: true,
    PrismaClient: jest.fn(),
}));

const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Before each test, reset mocks and setup PrismaClient to return our mock
beforeEach(() => {
    mockReset(prismaMock);
    (PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => prismaMock as any);
});

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.FOREX_API_KEY = 'test-api-key';
process.env.NEWS_API_KEY = 'test-news-api-key';

// Export the mock for use in tests
export { prismaMock };

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
