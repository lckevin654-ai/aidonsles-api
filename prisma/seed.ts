import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Supprimer les actions existantes
  await prisma.action.deleteMany();

  // Créer les actions de test
  const actions = await Promise.all([
    prisma.action.create({
      data: {
        id: 'act_001',
        title: 'Repas quotidiens pour 45 orphelins',
        slug: 'repas-orphelins',
        description: 'Fournir 3 repas par jour à 45 enfants orphelins pendant 6 mois.',
        type: 'Alimentation',
        status: 'EN_COURS',
        date: new Date('2026-01-12T09:00:00Z'),
        time: '09:00',
        country: 'CM',
        city: 'Yaoundé',
        location: 'Essos',
        objective: '45 enfants nourris',
        beneficiaries: 45,
        budget: 5000.00,
        collected: 3200.00,
        used: 1800.00,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800',
        publishedAt: new Date(),
      },
    }),
    prisma.action.create({
      data: {
        id: 'act_002',
        title: 'Kits scolaires pour 32 enfants',
        slug: 'kits-scolaires',
        description: 'Fournir kits scolaires complets à 32 enfants démunis.',
        type: 'Éducation',
        status: 'PLANIFIEE',
        date: new Date('2026-09-01T08:00:00Z'),
        time: '08:00',
        country: 'CM',
        city: 'Douala',
        location: 'Bonabéri',
        objective: '32 enfants équipés',
        beneficiaries: 32,
        budget: 3000.00,
        collected: 1800.00,
        used: 0.00,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
        publishedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ ${actions.length} actions créées`);
  console.log(actions.map(a => `   - ${a.title}`).join('\n'));
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });