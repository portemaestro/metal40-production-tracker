import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPin = await bcrypt.hash('1234', 10);

  await prisma.user.upsert({
    where: { email: 'giuseppe@metal40.it' },
    update: {},
    create: {
      nome: 'Giuseppe',
      cognome: 'Rossi',
      email: 'giuseppe@metal40.it',
      pin: hashedPin,
      ruolo: 'ufficio',
      attivo: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'mario@metal40.it' },
    update: {},
    create: {
      nome: 'Mario',
      cognome: 'Rossi',
      email: 'mario@metal40.it',
      pin: hashedPin,
      ruolo: 'operatore',
      reparti: JSON.stringify(['punzonatura_euromac']),
      attivo: true,
    },
  });

  console.log('Seed completato! PIN: 1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
