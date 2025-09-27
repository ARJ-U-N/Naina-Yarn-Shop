const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const checkProduct = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const product = await Product.findOne({ name: /Premium Cotton T-Shirt/i });
    
    if (product) {
      console.log('📦 Product found:');
      console.log('Name:', product.name);
      console.log('Images:', JSON.stringify(product.images, null, 2));
      console.log('First image URL:', product.images[0]?.url);
    } else {
      console.log('❌ Product not found');
      
      // Show all products
      const allProducts = await Product.find().limit(5);
      console.log('\n📋 All products:');
      allProducts.forEach(p => {
        console.log(`- ${p.name}`);
        console.log(`  Images: ${p.images?.length || 0}`);
        if (p.images?.[0]) {
          console.log(`  First URL: ${p.images[0].url}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkProduct();
