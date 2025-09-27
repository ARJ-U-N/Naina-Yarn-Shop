const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Configure multer
const uploadDir = 'uploads/products';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log('📁 Created uploads directory');
}
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created products directory');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

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

    // ✅ PERMANENT FIX: Generate relative URLs (no domain)
    const uploadedImages = req.files.map(file => ({
      url: `/uploads/products/${file.filename}`, // ✅ Changed this line!
      alt: path.parse(file.originalname).name,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }));

    console.log('✅ Images processed:', uploadedImages.length);
    console.log('🔗 Sample URL:', uploadedImages[0]?.url); // Will now show: /uploads/products/...

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
    const filePath = path.join(__dirname, '../uploads/products', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Image deleted:', filename);
    }

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
