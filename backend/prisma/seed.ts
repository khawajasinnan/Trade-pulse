import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tradepulse.com';
    const adminPassword = await bcrypt.hash('Admin@123', 12);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Admin User',
            passwordHash: adminPassword,
            role: 'Admin',
        },
    });

    console.log(`✅ Admin user created: ${admin.email}`);

    // Seed currencies
    const currencies = [
        { symbol: 'USD', name: 'US Dollar', description: 'United States Dollar' },
        { symbol: 'EUR', name: 'Euro', description: 'European Union Euro' },
        { symbol: 'GBP', name: 'British Pound', description: 'British Pound Sterling' },
        { symbol: 'JPY', name: 'Japanese Yen', description: 'Japanese Yen' },
        { symbol: 'CHF', name: 'Swiss Franc', description: 'Swiss Franc' },
        { symbol: 'CAD', name: 'Canadian Dollar', description: 'Canadian Dollar' },
        { symbol: 'AUD', name: 'Australian Dollar', description: 'Australian Dollar' },
        { symbol: 'NZD', name: 'New Zealand Dollar', description: 'New Zealand Dollar' },
        { symbol: 'PKR', name: 'Pakistani Rupee', description: 'Pakistani Rupee' },
        { symbol: 'INR', name: 'Indian Rupee', description: 'Indian Rupee' },
        { symbol: 'CNY', name: 'Chinese Yuan', description: 'Chinese Yuan Renminbi' },
        { symbol: 'SGD', name: 'Singapore Dollar', description: 'Singapore Dollar' },
        { symbol: 'HKD', name: 'Hong Kong Dollar', description: 'Hong Kong Dollar' },
        { symbol: 'SEK', name: 'Swedish Krona', description: 'Swedish Krona' },
        { symbol: 'NOK', name: 'Norwegian Krone', description: 'Norwegian Krone' },
    ];

    for (const currency of currencies) {
        await prisma.currency.upsert({
            where: { symbol: currency.symbol },
            update: {},
            create: currency,
        });
    }

    console.log(`✅ Seeded ${currencies.length} currencies`);

    // Create sample test users
    const testUsers = [
        {
            email: 'user@test.com',
            name: 'Basic User',
            role: 'BasicUser' as const,
            password: 'User@123',
        },
        {
            email: 'trader@test.com',
            name: 'Trader User',
            role: 'Trader' as const,
            password: 'Trader@123',
        },
    ];

    for (const testUser of testUsers) {
        const hashedPassword = await bcrypt.hash(testUser.password, 12);
        await prisma.user.upsert({
            where: { email: testUser.email },
            update: {},
            create: {
                email: testUser.email,
                name: testUser.name,
                passwordHash: hashedPassword,
                role: testUser.role,
            },
        });
    }

    console.log(`✅ Seeded ${testUsers.length} test users`);
    console.log('\n📝 Test Credentials:');
    console.log(`   Admin: ${adminEmail} / Admin@123`);
    console.log('   Basic User: user@test.com / User@123');
    console.log('   Trader: trader@test.com / Trader@123');

    console.log('\n🎉 Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
