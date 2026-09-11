import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../public/uploads');

class StorageService {
  constructor() {
    this.keyId = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID || '';
    this.appKey = process.env.B2_APPLICATION_KEY || '';
    this.bucketName = process.env.B2_BUCKET_NAME || 'nivasa-media';
    this.endpoint = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
    this.region = process.env.B2_REGION || 'us-east-005';
    this.cdnUrl = process.env.B2_CDN_URL || '';

    this.s3Client = null;
    this.initClient();
  }

  initClient() {
    if (this.keyId && this.appKey) {
      try {
        this.s3Client = new S3Client({
          endpoint: this.endpoint,
          region: this.region,
          credentials: {
            accessKeyId: this.keyId,
            secretAccessKey: this.appKey,
          },
        });
        console.log(`📦 Backblaze B2 S3 storage initialized for bucket: "${this.bucketName}" (${this.endpoint})`);
      } catch (err) {
        console.warn('⚠️  Failed to initialize Backblaze B2 S3 client:', err.message);
        this.s3Client = null;
      }
    } else {
      console.log('📦 Backblaze B2 credentials not configured in .env. Using resilient local file storage fallback.');
    }
  }

  isB2Enabled() {
    return Boolean(this.s3Client && this.keyId && this.appKey);
  }

  /**
   * Upload an image buffer or base64 Data URI to Backblaze B2 (with local fallback)
   * @param {Object} params
   * @param {string} [params.dataUri] Base64 data URI (e.g. data:image/jpeg;base64,...)
   * @param {Buffer} [params.buffer] Raw file buffer
   * @param {string} [params.folder='attachments'] Folder category ('visitors', 'complaints', etc.)
   * @param {string} [params.filename] Optional custom filename
   * @param {string} [params.mimeType='image/jpeg'] MIME content type
   * @returns {Promise<{ success: boolean, url: string, key: string, provider: 'backblaze' | 'local' }>}
   */
  async uploadImage({ dataUri, buffer, folder = 'attachments', filename, mimeType = 'image/jpeg' }) {
    let fileBuffer = buffer;
    let resolvedMime = mimeType;

    // 1. Parse base64 Data URI if provided
    if (dataUri && typeof dataUri === 'string') {
      const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        resolvedMime = matches[1];
        fileBuffer = Buffer.from(matches[2], 'base64');
      } else {
        fileBuffer = Buffer.from(dataUri, 'base64');
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('No valid image data provided for upload.');
    }

    // Determine file extension from mime type
    const extMap = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/heic': 'heic',
    };
    const ext = extMap[resolvedMime.toLowerCase()] || 'jpg';
    const finalFilename = filename || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storageKey = `${folder}/${finalFilename}`;

    // 2. Upload to Backblaze B2 if configured
    if (this.isB2Enabled()) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: storageKey,
          Body: fileBuffer,
          ContentType: resolvedMime,
        });

        await this.s3Client.send(command);

        // Generate secure presigned URL for private bucket (valid for 7 days)
        let fileUrl;
        try {
          fileUrl = await getSignedUrl(
            this.s3Client,
            new GetObjectCommand({
              Bucket: this.bucketName,
              Key: storageKey,
            }),
            { expiresIn: 3600 * 24 * 7 }
          );
        } catch (signErr) {
          console.warn('Presigned URL generation fallback:', signErr.message);
          const cleanEndpoint = this.endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
          fileUrl = `https://${this.bucketName}.${cleanEndpoint}/${storageKey}`;
        }

        console.log(`✅ File successfully uploaded to Backblaze B2 (Private Bucket): ${storageKey}`);
        return {
          success: true,
          url: fileUrl,
          key: storageKey,
          provider: 'backblaze',
        };
      } catch (err) {
        console.warn(`⚠️  Backblaze B2 upload failed (${err.message}). Falling back to local file storage...`);
      }
    }

    // 3. Resilient Local File Storage Fallback
    try {
      const targetDir = path.join(UPLOADS_DIR, folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, finalFilename);
      fs.writeFileSync(filePath, fileBuffer);

      // Return server-hosted URL
      const localUrl = `/uploads/${folder}/${finalFilename}`;
      return {
        success: true,
        url: localUrl,
        key: storageKey,
        provider: 'local',
      };
    } catch (localErr) {
      console.error('Failed to write local upload file:', localErr);
      // As ultimate fallback, return dataUri
      return {
        success: true,
        url: dataUri || `data:${resolvedMime};base64,${fileBuffer.toString('base64')}`,
        key: storageKey,
        provider: 'inline',
      };
    }
  }
}

export const storageService = new StorageService();
