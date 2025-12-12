import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

const feelingSeeds = [
  "Today's breathwork softened the tight knot under my ribs,",
  'When I said the memory out loud, my throat finally stopped bracing,',
  'I walked out of the room feeling taller, like my spine remembered its own length,',
  'Naming the fear out loud made it shrink to something I could cradle,',
  'I noticed warmth pooling in my hands once I stopped over-explaining myself,',
  'Hearing my own voice tremble made me realize how badly it wanted to be heard,',
  'I kept catching myself smiling during the session without meaning to,',
  'Midway through I felt the pressure behind my eyes release like a quiet sigh,',
  'It was a relief to feel my shoulders drop without having to force them,',
  'For the first time in weeks I trusted my lungs to take a full breath,',
];

const pronounOptions = ['she/her', 'they/them'];
const healerCount = 2;
const reflectionsPerHealer = 10;

const buildFeeling = () => {
  const intro = faker.helpers.arrayElement(feelingSeeds);
  const detail = faker.lorem.sentences({ min: 1, max: 2 });
  return `${intro} ${detail}`;
};

async function main() {
  for (let i = 0; i < healerCount; i += 1) {
    const fullName = faker.person.fullName();
    const [firstName] = fullName.split(' ');
    const slug = `${faker.helpers.slugify(fullName).toLowerCase()}-${faker.string.uuid().slice(0, 8)}`;

    await prisma.healer.create({
      data: {
        name: fullName,
        pronouns: faker.helpers.arrayElement(pronounOptions),
        modality: 'Somatic Experiencing',
        focus: 'Trauma integration',
        city: faker.location.city(),
        contact: faker.internet.email({ firstName }),
        bio: faker.lorem.paragraphs({ min: 1, max: 2 }),
        slug,
        reflections: {
          create: Array.from({ length: reflectionsPerHealer }).map(() => ({
            grounded: faker.datatype.boolean(),
            supported: faker.datatype.boolean(),
            connected: faker.datatype.boolean(),
            feeling: buildFeeling(),
          })),
        },
      },
    });
  }

  console.log(`Created ${healerCount} healers with ${reflectionsPerHealer} reflections each.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
