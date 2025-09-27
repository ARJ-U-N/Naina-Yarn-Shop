const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const finalImageFix = async () => {
  try {
    console.log('🔧 FINAL IMAGE FIX - Converting all URLs to relative paths...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);
    
    let fixedCount = 0;
    
    for (const product of products) {
      let updated = false;
      
      if (product.images && product.images.length > 0) {
        product.images = product.images.map(image => {
          if (image.url && image.url.includes('http://localhost:5000')) {
            updated = true;
            const newUrl = image.url.replace('http://localhost:5000', '');
            console.log(`   📸 ${product.name}: ${image.url} → ${newUrl}`);
            return {
              ...image.toObject(),
              url: newUrl
            };
          }
          return image;
        });
      }
      
      if (updated) {
        await product.save();
        fixedCount++;
        console.log(`✅ Fixed: ${product.name}`);
      } else {
        console.log(`ℹ️  Already correct: ${product.name} - ${product.images[0]?.url}`);
      }
    }
    
    console.log(`\n🎉 FINAL FIX COMPLETE!`);
    console.log(`📊 Fixed: ${fixedCount} products`);
    console.log(`📊 Already correct: ${products.length - fixedCount} products`);
    console.log(`\n✨ All future uploads will use relative URLs automatically!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

finalImageFix();
