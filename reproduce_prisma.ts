import { config } from 'dotenv';
config();
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './app/generated/prisma';

async function main() {
    try {
        console.log('Attempting to initialize PrismaClient with adapter...');
        const connectionString = `${process.env.DATABASE_URL}`;
        console.log('Connection string found:', !!connectionString);

        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });

        console.log('Success! Prisma Client initialized with adapter.');
        await prisma.$disconnect();
    } catch (e) {
        console.error('Failed with adapter:', e);
        process.exit(1);
    }
}

main();
