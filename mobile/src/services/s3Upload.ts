import type { ImagePickerAsset } from 'expo-image-picker';
import CryptoJS from 'crypto-js';

const AWS_ACCESS_KEY_ID =
  process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim();
const AWS_SECRET_ACCESS_KEY =
  process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY?.trim() ||
  process.env.AWS_SECRET_ACCESS_KEY?.trim();
const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION?.trim() || process.env.AWS_REGION?.trim();
const AWS_S3_BUCKET_NAME =
  process.env.EXPO_PUBLIC_AWS_S3_BUCKET_NAME?.trim() || process.env.AWS_S3_BUCKET_NAME?.trim();
const AWS_S3_PUBLIC_BASE_URL = process.env.EXPO_PUBLIC_AWS_S3_PUBLIC_BASE_URL?.trim();

function requireS3Config() {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_S3_BUCKET_NAME) {
    throw new Error(
      'Missing AWS S3 upload configuration. Please set EXPO_PUBLIC_AWS_ACCESS_KEY_ID, EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY, EXPO_PUBLIC_AWS_REGION, and EXPO_PUBLIC_AWS_S3_BUCKET_NAME.',
    );
  }

  return {
    accessKeyId: AWS_ACCESS_KEY_ID,
    bucketName: AWS_S3_BUCKET_NAME,
    region: AWS_REGION,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
}

function amzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function dateStamp(date: Date) {
  return amzDate(date).slice(0, 8);
}

function encodeS3Key(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function extensionForAsset(asset: ImagePickerAsset) {
  const fileNameExtension = asset.fileName?.split('.').pop()?.toLowerCase();
  if (fileNameExtension && /^[a-z0-9]+$/.test(fileNameExtension)) return fileNameExtension;

  if (asset.mimeType === 'image/png') return 'png';
  if (asset.mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function contentTypeForAsset(asset: ImagePickerAsset) {
  return asset.mimeType || 'image/jpeg';
}

function buildAvatarKey(asset: ImagePickerAsset) {
  const extension = extensionForAsset(asset);
  const random = Math.random().toString(36).slice(2, 10);
  return `mangaka/avatars/avatar-${Date.now()}-${random}.${extension}`;
}

function signingKey(secretAccessKey: string, stamp: string, region: string) {
  const dateKey = CryptoJS.HmacSHA256(stamp, `AWS4${secretAccessKey}`);
  const regionKey = CryptoJS.HmacSHA256(region, dateKey);
  const serviceKey = CryptoJS.HmacSHA256('s3', regionKey);
  return CryptoJS.HmacSHA256('aws4_request', serviceKey);
}

function authorizationHeader(params: {
  accessKeyId: string;
  amzDateValue: string;
  canonicalUri: string;
  contentType: string;
  host: string;
  region: string;
  secretAccessKey: string;
  stamp: string;
}) {
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = [
    `content-type:${params.contentType}`,
    `host:${params.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${params.amzDateValue}`,
    '',
  ].join('\n');
  const canonicalRequest = [
    'PUT',
    params.canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const credentialScope = `${params.stamp}/${params.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    params.amzDateValue,
    credentialScope,
    CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex),
  ].join('\n');
  const signature = CryptoJS.HmacSHA256(
    stringToSign,
    signingKey(params.secretAccessKey, params.stamp, params.region),
  ).toString(CryptoJS.enc.Hex);

  return `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function assetBlob(asset: ImagePickerAsset) {
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('Unable to read the selected image.');
  return response.blob();
}

export async function uploadAvatarToS3(asset: ImagePickerAsset) {
  const config = requireS3Config();
  const key = buildAvatarKey(asset);
  const canonicalUri = `/${encodeS3Key(key)}`;
  const contentType = contentTypeForAsset(asset);
  const host = `${config.bucketName}.s3.${config.region}.amazonaws.com`;
  const now = new Date();
  const amzDateValue = amzDate(now);
  const stamp = dateStamp(now);
  const publicBaseUrl = AWS_S3_PUBLIC_BASE_URL || `https://${host}`;
  const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${encodeS3Key(key)}`;

  const body = await assetBlob(asset);
  const response = await fetch(`https://${host}${canonicalUri}`, {
    body,
    headers: {
      Authorization: authorizationHeader({
        accessKeyId: config.accessKeyId,
        amzDateValue,
        canonicalUri,
        contentType,
        host,
        region: config.region,
        secretAccessKey: config.secretAccessKey,
        stamp,
      }),
      'Content-Type': contentType,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      'x-amz-date': amzDateValue,
    },
    method: 'PUT',
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Unable to upload the image to S3.');
  }

  return publicUrl;
}
