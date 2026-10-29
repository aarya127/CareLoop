import { prisma } from '../src';
import { ENCRYPTED_PREFIX as PREFIX, encryptField as encrypt, sha256Hex } from './field-crypto';

async function main() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error('ENCRYPTION_KEY is required');

  const records = await prisma.patientInsurance.findMany({
    select: { id: true, memberIdEnc: true, groupNumberEnc: true },
  });
  let updated = 0;
  for (const record of records) {
    const memberNeedsEncryption = !record.memberIdEnc.startsWith(PREFIX);
    const groupNeedsEncryption = Boolean(
      record.groupNumberEnc && !record.groupNumberEnc.startsWith(PREFIX),
    );
    if (!memberNeedsEncryption && !groupNeedsEncryption) continue;

    const rawMemberId = record.memberIdEnc;
    await prisma.patientInsurance.update({
      where: { id: record.id },
      data: {
        ...(memberNeedsEncryption
          ? {
              memberIdEnc: encrypt(rawMemberId, secret),
              memberIdHash: sha256Hex(rawMemberId),
            }
          : {}),
        ...(groupNeedsEncryption && record.groupNumberEnc
          ? { groupNumberEnc: encrypt(record.groupNumberEnc, secret) }
          : {}),
      },
    });
    updated += 1;
  }
  console.info(`Encrypted ${updated} insurance record(s)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
