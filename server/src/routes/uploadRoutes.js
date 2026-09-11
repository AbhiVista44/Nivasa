import express from 'express';
import { storageService } from '../services/storageService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Upload an image (complaint photo, visitor webcam snapshot, or identity badge)
 * Accepts base64 dataUri or JSON payload
 */
router.post('/image', verifyToken, async (req, res) => {
  try {
    const { image, folder = 'attachments', filename } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided. Please provide a base64 Data URI or image payload.',
      });
    }

    const uploadResult = await storageService.uploadImage({
      dataUri: image,
      folder: ['visitors', 'complaints', 'amenities'].includes(folder) ? folder : 'attachments',
      filename,
    });

    res.json({
      success: true,
      message: uploadResult.provider === 'backblaze'
        ? 'Image uploaded to Backblaze B2 storage.'
        : 'Image saved to local storage.',
      url: uploadResult.url,
      key: uploadResult.key,
      provider: uploadResult.provider,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image.',
    });
  }
});

export default router;
