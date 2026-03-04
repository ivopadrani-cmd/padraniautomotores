// Test para verificar que campos opcionales se guarden correctamente
const testOptionalFields = {
  // Simular datos con campos opcionales
  mockDataWithOptionals: {
    // Campos requeridos
    brand: 'FORD',
    model: 'FIESTA',
    year: '2020',
    status: 'DISPONIBLE',

    // Campos opcionales que deberían guardarse aunque sean null/undefined
    cost_exchange_rate: null, // Cotización opcional
    target_price_exchange_rate: undefined, // Cotización opcional
    public_price_exchange_rate: null, // Cotización opcional
    infoauto_exchange_rate: undefined, // Cotización opcional

    // Campos que deberían guardarse aunque sean 0
    cost_value: 0, // Valor 0 válido
    expenses: [], // Array vacío

    // Campos normales
    plate: 'ABC123',
    color: 'BLANCO'
  },

  // Función de limpieza de datos como en Supabase
  cleanData: function(data) {
    const cleanData = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      // Nueva lógica: solo filtrar cadenas vacías
      if (value !== '') {
        cleanData[key] = value;
      }
    });
    return cleanData;
  },

  runOptionalFieldsTest: function() {
    console.log('🔧 TEST: Campos opcionales en guardado\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 DATOS ORIGINALES:');
    Object.entries(this.mockDataWithOptionals).forEach(([key, value]) => {
      console.log(`   ${key}: ${value} (${typeof value})`);
    });

    console.log('\n🧹 DATOS DESPUÉS DE LIMPIEZA:');
    const cleanedData = this.cleanData(this.mockDataWithOptionals);
    Object.entries(cleanedData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value} (${typeof value})`);
    });

    console.log('\n🔍 ANÁLISIS:');
    console.log('─'.repeat(50));

    // Verificar que campos opcionales se mantengan
    const optionalFields = ['cost_exchange_rate', 'target_price_exchange_rate', 'public_price_exchange_rate', 'infoauto_exchange_rate'];
    const preservedOptionals = optionalFields.filter(field => cleanedData[field] !== undefined);

    console.log(`📋 Campos opcionales preservados: ${preservedOptionals.length}/${optionalFields.length}`);
    optionalFields.forEach(field => {
      const original = this.mockDataWithOptionals[field];
      const cleaned = cleanedData[field];
      const status = (original === cleaned) ? '✅' : '❌';
      console.log(`${status} ${field}: ${original} → ${cleaned}`);
    });

    // Verificar que campos con valor 0 se mantengan
    const zeroFields = ['cost_value'];
    const preservedZeros = zeroFields.filter(field => cleanedData[field] === 0);

    console.log(`\n💰 Campos con valor 0 preservados: ${preservedZeros.length}/${zeroFields.length}`);
    zeroFields.forEach(field => {
      const original = this.mockDataWithOptionals[field];
      const cleaned = cleanedData[field];
      const status = (original === cleaned) ? '✅' : '❌';
      console.log(`${status} ${field}: ${original} → ${cleaned}`);
    });

    // Verificar que campos requeridos se mantengan
    const requiredFields = ['brand', 'model', 'year', 'status'];
    const preservedRequired = requiredFields.filter(field => cleanedData[field] !== undefined);

    console.log(`\n⚠️ Campos requeridos preservados: ${preservedRequired.length}/${requiredFields.length}`);
    requiredFields.forEach(field => {
      const original = this.mockDataWithOptionals[field];
      const cleaned = cleanedData[field];
      const status = (original === cleaned) ? '✅' : '❌';
      console.log(`${status} ${field}: ${original} → ${cleaned}`);
    });

    console.log('\n🎯 CONCLUSIONES:');
    console.log('─'.repeat(50));

    const allOptionalPreserved = preservedOptionals.length === optionalFields.length;
    const allZerosPreserved = preservedZeros.length === zeroFields.length;
    const allRequiredPreserved = preservedRequired.length === requiredFields.length;

    if (allOptionalPreserved && allZerosPreserved && allRequiredPreserved) {
      console.log('✅ Todos los campos se preservan correctamente');
      console.log('✅ Los precios deberían guardarse con sus valores opcionales');
      return true;
    } else {
      console.log('❌ Algunos campos se pierden en el proceso de limpieza');
      console.log('❌ Esto explica por qué algunos precios no se guardan completamente');
      return false;
    }
  }
};

// Ejecutar test
testOptionalFields.runOptionalFieldsTest();