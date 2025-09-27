const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Check for --clear flag
const shouldClearCollections = process.argv.includes('--clear');

// Sample data (same as before)
const users = [
  {
    name: 'Admin User',
    email: 'admin@nayher.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Test User',
    email: 'user@test.com',
    password: 'user123',
    role: 'user',
    address: {
      street: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    phone: '+919876543210'
  }
];

const categories = [
  {
    name: 'Baby Blanket',
    description: 'Soft and cozy handcrafted blankets for babies and toddlers'
  },
  {
    name: 'Baby Set',
    description: 'Complete baby clothing and accessory sets'
  },
  {
    name: 'Babywear',
    description: 'Comfortable handmade clothing for babies'
  },
  {
    name: 'Bags',
    description: 'Handcrafted bags and carriers for daily use'
  },
  {
    name: 'Bookmarks',
    description: 'Decorative bookmarks for book lovers'
  },
  {
    name: 'Christmas Special',
    description: 'Festive holiday decorations and gifts'
  },
  {
    name: 'Cushion Covers',
    description: 'Beautiful handmade cushion covers and pillows'
  },
  {
    name: 'Table Runners',
    description: 'Elegant table runners and dining accessories'
  },
  {
    name: 'Wall Hangings',
    description: 'Decorative wall art and hangings'
  },
  {
    name: 'Keychains',
    description: 'Cute handmade keychains and accessories'
  },
  {
    name: 'Coasters',
    description: 'Protective and decorative drink coasters'
  },
  {
    name: 'Photo Frames',
    description: 'Handcrafted frames for precious memories'
  }
];

// ... (keep all the existing helper functions: generateProducts, getRandomProductName, etc.)
const generateProducts = (categories) => {
  const products = [];
  
  categories.forEach((category, index) => {
    const productCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 1; i <= productCount; i++) {
      const product = {
        name: `${category.name}: ${getRandomProductName(category.name)} ${i}`,
        description: `Handcrafted ${category.name.toLowerCase()} made with love and care. Perfect for ${getRandomDescription(category.name)}.`,
        price: Math.floor(Math.random() * 8000) + 500,
        images: [
          {
            url: `https://via.placeholder.com/400x400/f0f0f0/333333?text=${encodeURIComponent(category.name)}`,
            alt: `${category.name} ${i}`
          }
        ],
        category: null,
        stock: Math.floor(Math.random() * 50) + 5,
        tags: getRandomTags(category.name),
        colors: getRandomColors(),
        materials: ['Cotton', 'Yarn', 'Wool'],
        status: Math.random() > 0.1 ? 'available' : 'sold-out',
        isFeatured: Math.random() > 0.7,
        weight: Math.floor(Math.random() * 500) + 100,
        rating: {
          average: +(Math.random() * 2 + 3).toFixed(1),
          count: Math.floor(Math.random() * 50)
        }
      };
      
      products.push(product);
    }
  });
  
  return products;
};

const getRandomProductName = (categoryName) => {
  const names = {
    'Baby Blanket': ['Jungle Safari', 'Teddy Bear', 'Sweet Dreams', 'Rainbow', 'Ocean Friends', 'Safari Adventure'],
    'Baby Set': ['Pink Bunny Collection', 'Blue Ocean Theme', 'Forest Friends', 'Starry Night'],
    'Babywear': ['Knitted Cardigan', 'Cute Animal Sweater', 'Cozy Hoodie', 'Button Up Vest'],
    'Bags': ['Handwoven Tote', 'Crochet Shoulder', 'Market Basket', 'Evening Clutch'],
    'Bookmarks': ['Embroidered Set', 'Wooden Carved', 'Floral Design', 'Geometric Pattern'],
    'Christmas Special': ['Ornament Set', 'Holiday Stockings', 'Santa Collection', 'Festive Garland'],
    'Cushion Covers': ['Floral Embroidered', 'Geometric Pattern', 'Boho Style', 'Vintage Design'],
    'Table Runners': ['Handwoven', 'Embroidered', 'Festive', 'Elegant Lace'],
    'Wall Hangings': ['Macrame', 'Dream Catcher', 'Boho Tapestry', 'Mandala Design'],
    'Keychains': ['Animal Set', 'Personalized Name', 'Charm Collection', 'Mini Amigurumi'],
    'Coasters': ['Wooden Set', 'Crochet Collection', 'Cork Design', 'Marble Pattern'],
    'Photo Frames': ['Handcrafted Wooden', 'Decorative Metal', 'Vintage Style', 'Modern Minimalist']
  };
  
  const categoryNames = names[categoryName] || ['Handcrafted', 'Beautiful', 'Elegant', 'Classic'];
  return categoryNames[Math.floor(Math.random() * categoryNames.length)];
};

const getRandomDescription = (categoryName) => {
  const descriptions = {
    'Baby Blanket': 'keeping your little one warm and cozy',
    'Baby Set': 'complete baby care and comfort',
    'Babywear': 'everyday comfort and style',
    'Bags': 'daily use and special occasions',
    'Bookmarks': 'book lovers and reading enthusiasts',
    'Christmas Special': 'festive celebrations and holiday joy',
    'Cushion Covers': 'home decoration and comfort',
    'Table Runners': 'dining elegance and special occasions',
    'Wall Hangings': 'home decoration and artistic expression',
    'Keychains': 'personal use and gifting',
    'Coasters': 'protecting surfaces with style',
    'Photo Frames': 'displaying precious memories'
  };
  
  return descriptions[categoryName] || 'everyday use and gifting';
};

const getRandomTags = (categoryName) => {
  const baseTags = ['handmade', 'craft', 'gift', 'unique'];
  const categoryTags = {
    'Baby Blanket': ['baby', 'blanket', 'soft', 'cozy', 'newborn'],
    'Baby Set': ['baby', 'set', 'complete', 'outfit'],
    'Babywear': ['baby', 'clothes', 'wear', 'comfort'],
    'Bags': ['bag', 'tote', 'carry', 'stylish'],
    'Bookmarks': ['bookmark', 'reading', 'book', 'page-marker'],
    'Christmas Special': ['christmas', 'holiday', 'festive', 'seasonal'],
    'Cushion Covers': ['cushion', 'cover', 'pillow', 'home-decor'],
    'Table Runners': ['table', 'runner', 'dining', 'decor'],
    'Wall Hangings': ['wall', 'hanging', 'decor', 'art'],
    'Keychains': ['keychain', 'key', 'charm', 'accessory'],
    'Coasters': ['coaster', 'drink', 'table', 'protection'],
    'Photo Frames': ['frame', 'photo', 'picture', 'memory']
  };
  
  return [...baseTags, ...(categoryTags[categoryName] || [])];
};

const getRandomColors = () => {
  const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'White', 'Black', 'Brown'];
  const numColors = Math.floor(Math.random() * 4) + 1;
  const selectedColors = [];
  
  for (let i = 0; i < numColors; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    if (!selectedColors.includes(color)) {
      selectedColors.push(color);
    }
  }
  
  return selectedColors;
};

const seedData = async () => {
  try {
    await connectDB();
    
    if (shouldClearCollections) {
      console.log('🗑️  Dropping collections to clear indexes...');
      
      try {
        await User.collection.drop();
        console.log('✅ Dropped users collection');
      } catch (err) {
        console.log('ℹ️  Users collection did not exist');
      }
      
      try {
        await Category.collection.drop();
        console.log('✅ Dropped categories collection');
      } catch (err) {
        console.log('ℹ️  Categories collection did not exist');
      }
      
      try {
        await Product.collection.drop();
        console.log('✅ Dropped products collection');
      } catch (err) {
        console.log('ℹ️  Products collection did not exist');
      }
    } else {
      console.log('🗑️  Clearing existing data...');
      await User.deleteMany();
      await Category.deleteMany();
      await Product.deleteMany();
    }
    
    console.log('👥 Seeding users...');
    const createdUsers = await User.create(users);
    console.log(`✅ ${createdUsers.length} users created`);
    
    console.log('📁 Seeding categories...');
    const createdCategories = await Category.create(categories);
    console.log(`✅ ${createdCategories.length} categories created`);
    
    console.log('📦 Seeding products...');
    const productData = generateProducts(createdCategories);
    
    productData.forEach((product, index) => {
      const categoryIndex = Math.floor(index / Math.ceil(productData.length / createdCategories.length));
      product.category = createdCategories[categoryIndex]._id;
    });
    
    const createdProducts = await Product.create(productData);
    console.log(`✅ ${createdProducts.length} products created`);
    
    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Admin: admin@nayher.com / admin123');
    console.log('User: user@test.com / user123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
