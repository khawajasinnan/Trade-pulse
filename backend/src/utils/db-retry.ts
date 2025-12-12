import { PrismaClient } from '@prisma/client';

/**
 * Create Prisma client with retry logic for better connection handling
 */
export function createPrismaClientWithRetry() {
    const prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    // Add connection retry logic
    const originalConnect = prisma.$connect.bind(prisma);

    prisma.$connect = async function () {
        const maxRetries = 3;
        const retryDelay = 2000; // 2 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await originalConnect();
                return;
            } catch (error) {
                if (attempt === maxRetries) {
                    console.error('Failed to connect to database after', maxRetries, 'attempts');
                    throw error;
                }
                console.log(`Database connection attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    };

    return prisma;
}

/**
 * Execute database operation with retry logic
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            const isConnectionError =
                error.code === 'P1001' || // Can't reach database server
                error.code === 'P1002' || // Connection timeout
                error.code === 'P1008' || // Operations timed out
                error.code === 'P1017';   // Server has closed the connection

            if (!isConnectionError || attempt === maxRetries) {
                throw error;
            }

            console.log(`Database operation attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
    }

    throw new Error('Operation failed after all retries');
}
