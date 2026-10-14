import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed de démonstration...\n');

  // ============================================================
  // 1. IMPACT STATS
  // ============================================================
  console.log('📊 Seed ImpactStats...');
  await prisma.impactStats.deleteMany();
  const impact = await prisma.impactStats.create({
    data: {
      donors: 8742,
      actionsCompleted: 127,
      peopleHelped: 18429,
      localities: 24,
    },
  });
  console.log(`   ✅ ImpactStats créé (ID: ${impact.id})\n`);

  // ============================================================
  // 2. NEXT ACTION
  // ============================================================
  console.log('📅 Seed NextAction...');
  await prisma.nextAction.deleteMany();
  const nextAction = await prisma.nextAction.create({
    data: {
      title: 'Distribution de fournitures scolaires',
      description:
        'Distribution de kits scolaires complets à 250 enfants dans la région du Centre.',
      image:
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
      date: new Date('2026-10-24T10:00:00Z'),
      time: '10:00',
      country: 'CM',
      city: 'Yaoundé',
      location: 'Essos, Avenue Germaine',
      objective: '250 enfants équipés',
      beneficiaries: 250,
      budget: 7500.0,
      collected: 3200.0,
      currency: 'EUR',
      status: 'PLANIFIEE',
      active: true,
    },
  });
  console.log(`   ✅ NextAction créé (ID: ${nextAction.id})\n`);

  // ============================================================
  // 3. GALLERY
  // ============================================================
  console.log('🖼️  Seed Gallery...');
  await prisma.galleryItem.deleteMany();
  const galleryData = [
    {
      type: 'photo',
      category: 'terrain',
      title: 'Distribution de repas',
      location: 'Yaoundé',
      date: new Date('2026-01-18'),
      url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
      order: 1,
    },
    {
      type: 'photo',
      category: 'ceremonie',
      title: 'Cérémonie de lancement',
      location: 'Yaoundé',
      date: new Date('2026-01-12'),
      url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
      order: 2,
    },
    {
      type: 'photo',
      category: 'terrain',
      title: 'Kits scolaires',
      location: 'Douala',
      date: new Date('2025-12-15'),
      url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
      order: 3,
    },
    {
      type: 'video',
      category: 'temoignage',
      title: "Témoignage d'une bénéficiaire",
      location: 'Abidjan',
      date: new Date('2026-01-10'),
      url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80',
      order: 4,
    },
    {
      type: 'photo',
      category: 'terrain',
      title: 'Soins médicaux',
      location: 'Kribi',
      date: new Date('2025-11-20'),
      url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=800&q=80',
      order: 5,
    },
    {
      type: 'photo',
      category: 'ceremonie',
      title: 'Remise officielle',
      location: 'Yaoundé',
      date: new Date('2025-10-05'),
      url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
      order: 6,
    },
    {
      type: 'photo',
      category: 'terrain',
      title: 'Construction école',
      location: 'Bafoussam',
      date: new Date('2026-01-15'),
      url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
      order: 7,
    },
    {
      type: 'photo',
      category: 'temoignage',
      title: "Sourire d'un enfant",
      location: 'Abidjan',
      date: new Date('2025-12-20'),
      url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80',
      order: 8,
    },
  ];

  for (const item of galleryData) {
    await prisma.galleryItem.create({ data: item });
  }
  console.log(`   ✅ ${galleryData.length} items créés dans la galerie\n`);

  // ============================================================
  // 4. NEWS
  // ============================================================
  console.log('📰 Seed News...');
  await prisma.news.deleteMany();
  const newsData = [
    {
      title: 'Lancement de la campagne scolaire 2026',
      slug: 'lancement-campagne-scolaire-2026',
      excerpt:
        'AIDONS LES prépare la distribution de 250 kits scolaires à Yaoundé.',
      content:
        'Notre équipe se prépare pour la distribution de 250 kits scolaires complets à des enfants de la région du Centre. Chaque kit contient un cartable, des cahiers, des stylos, une règle, et tout le nécessaire pour bien démarrer l\'année scolaire.',
      image:
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
      publishedAt: new Date('2026-01-15'),
    },
    {
      title: 'Retour sur la distribution de repas',
      slug: 'retour-distribution-repas',
      excerpt:
        '45 enfants ont bénéficié de repas quotidiens pendant 6 mois.',
      content:
        'La première phase de notre programme de repas quotidiens s\'est achevée avec succès. 45 enfants orphelins ont bénéficié de 3 repas par jour pendant 6 mois. Découvrez les photos et les témoignages.',
      image:
        'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=600&q=80',
      publishedAt: new Date('2026-01-10'),
    },
    {
      title: 'Nouvelle salle de classe en construction',
      slug: 'salle-classe-construction',
      excerpt:
        'Les travaux ont débuté à Bafoussam pour 40 élèves.',
      content:
        'Grâce à vos dons, la construction d\'une nouvelle salle de classe a débuté à Bafoussam. 40 élèves pourront bientôt étudier dans de bonnes conditions.',
      image:
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
      publishedAt: new Date('2026-01-05'),
    },
  ];

  for (const item of newsData) {
    await prisma.news.create({ data: item });
  }
  console.log(`   ✅ ${newsData.length} actualités créées\n`);

  // ============================================================
  // RÉCAPITULATIF
  // ============================================================
  console.log('═══════════════════════════════════════════════');
  console.log('🎉 Seed terminé avec succès !');
  console.log('═══════════════════════════════════════════════');
  console.log('📊 ImpactStats    : 1 ligne');
  console.log('📅 NextAction     : 1 ligne');
  console.log('🖼️  Gallery        : ' + galleryData.length + ' items');
  console.log('📰 News           : ' + newsData.length + ' articles');
  console.log('═══════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });