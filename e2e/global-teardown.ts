import { cleanupTestData, prisma } from "../tests/integration/helpers";

/** Borra lo que crearon los tests y los contadores de login de sus usuarios. */
export default async function globalTeardown() {
  await cleanupTestData();
  await prisma.loginIntento.deleteMany({
    where: { OR: [{ clave: { startsWith: "email:it-" } }, { clave: { startsWith: "ip:" } }] },
  });
  await prisma.$disconnect();
}
