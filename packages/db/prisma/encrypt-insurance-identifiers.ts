import crypto from 'crypto';
import { prisma } from '../src';

const PREFIX = 'v1:';

function encrypt(value: string, secret: string): string {
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${PREFIX}${Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')}`;
}

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
              memberIdHash: crypto.createHash('sha256').update(rawMemberId).digest('hex'),
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
