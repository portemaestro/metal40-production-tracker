import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import logger from './logger';

const R2_CONFIGURED = !!(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);

const r2 = R2_CONFIGURED
  ? new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    })
  : null;

const BUCKET = process.env.R2_BUCKET_NAME || 'metal40-files';

/**
 * Carica un file su Cloudflare R2.
 * Se R2 non e' configurato, restituisce un URL placeholder.
 * @returns URL pubblico del file caricato
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  if (!r2 || !R2_CONFIGURED) {
    logger.warn('R2 non configurato, upload saltato', { key, contentType, size: body.length });
    return `local://${key}`;
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  logger.info('File caricato su R2', { key, contentType, size: body.length });
  return publicUrl;
}

/**
 * Elimina un file da Cloudflare R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!r2 || !R2_CONFIGURED) {
    logger.warn('R2 non configurato, eliminazione saltata', { key });
    return;
  }

  await r2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
  logger.info('File eliminato da R2', { key });
}

export default r2;
