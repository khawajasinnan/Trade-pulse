import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unbanUser() {
    try {
        const email = process.argv[2];

        if (!email) {
            console.log('❌ Please provide an email address');
            console.log('Usage: tsx prisma/unban-user.ts user@example.com');
            process.exit(1);
        }

        console.log(`🔍 Looking for user: ${email}`);

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        if (!user.banned) {
            console.log('✅ User is not banned');
            return;
        }

        // Unban user and reset failed login count
        await prisma.user.update({
            where: { id: user.id },
            data: {
                banned: false,
                failedLoginCount: 0,
            },
        });

        console.log('✅ User unbanned successfully');
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
    } catch (error) {
        console.error('❌ Error unbanning user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

unbanUser();
