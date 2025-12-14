import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@tradepulse.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        console.log(`🔍 Checking for existing admin account: ${adminEmail}`);

        const existing = await prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (existing) {
            console.log('✅ Admin account already exists');

            // Ensure user has Admin role
            if (existing.role !== 'Admin') {
                await prisma.user.update({
                    where: { id: existing.id },
                    data: { role: 'Admin' },
                });
                console.log('✅ Updated existing user to Admin role');
            }
        } else {
            const hashedPassword = await bcrypt.hash(adminPassword, 12);

            await prisma.user.create({
                data: {
                    name: 'System Administrator',
                    email: adminEmail,
                    passwordHash: hashedPassword,
                    role: 'Admin',
                },
            });

            console.log('✅ Admin account created successfully');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log('⚠️  Please change the password after first login');
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
