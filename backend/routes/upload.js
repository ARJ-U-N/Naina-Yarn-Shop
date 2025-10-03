const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/auth');
const router = express.Router();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('🔍 Checking file:', file.originalname, file.mimetype);
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
});

// @desc    Upload product images
// @route   POST /api/upload/images
// @access  Private
router.post('/images', protect, upload.array('images', 5), async (req, res) => {
  try {
    console.log('📸 Upload request received');
    console.log('User:', req.user?.name);
    console.log('Files:', req.files?.length || 0);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

   
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'products',
            public_id: `product-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('✅ Cloudinary upload success:', result.secure_url);
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                alt: path.parse(file.originalname).name,
                filename: result.public_id,
                size: file.size,
                mimetype: file.mimetype,
              });
            }
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    console.log('✅ Images processed:', uploadedImages.length);
    console.log('🔗 Sample URL:', uploadedImages[0]?.url);

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      images: uploadedImages
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading images'
    });
  }
});

// @desc    Delete uploaded image
// @route   DELETE /api/upload/images/:filename
// @access  Private
router.delete('/images/:filename', protect, async (req, res) => {
  try {
    const { filename } = req.params;

    
    const result = await cloudinary.uploader.destroy(filename);
    console.log('🗑️ Image deleted from Cloudinary:', filename, result);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image'
    });
  }
});

// @desc    Test upload endpoint
// @route   GET /api/upload/test
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Upload routes are working',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
