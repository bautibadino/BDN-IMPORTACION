const { createDefaultCategories } = require('../lib/categories');

async function main() {
  try {
    console.log('🏷️  Creando categorías de ejemplo...');
    const categories = await createDefaultCategories();
    console.log(`✅ ${categories.length} categorías creadas exitosamente:`);
    categories.forEach(cat => {
      console.log(`   • ${cat.name} (${cat.type})`);
    });
  } catch (error) {
    console.error('❌ Error creando categorías:', error.message);
    process.exit(1);
  }
}

main(); 