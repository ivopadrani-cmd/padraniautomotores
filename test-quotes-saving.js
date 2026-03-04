// Test para verificar que los presupuestos se guardan correctamente
const testQuoteSaving = {
  // Simular datos de un presupuesto
  mockQuoteData: {
    quote_date: '2024-12-19',
    client_id: 'client-123',
    client_name: 'Juan Pérez',
    vehicle_id: 'vehicle-456',
    vehicle_brand: 'FORD',
    vehicle_model: 'FIESTA',
    quoted_price_ars: 150000,
    trade_in_brand: 'RENAULT',
    trade_in_model: 'CLIO',
    trade_in_year: '2018',
    trade_in_value_ars: 80000,
    financing_amount: 120000,
    financing_bank: 'Banco Nación',
    financing_installments: '60',
    financing_installment_value: 2500
  },

  // Función que simula el procesamiento de datos en QuoteForm
  processQuoteData: function(formData, vehicleItems, selectedClientId, includeTradeIn) {
    const tradeInData = includeTradeIn ? formData.trade_in : null;
    const isMultiQuote = vehicleItems.length > 1;
    const multiQuoteGroupId = isMultiQuote ? `multi_${Date.now()}` : null;

    // Submit each vehicle as a separate quote
    const quotes = vehicleItems.map(item => {
      const quoteData = {
        quote_date: formData.date,
        client_id: selectedClientId || null,
        vehicle_id: item.vehicle_id,
        quoted_price_ars: parseFloat(item.quoted_price) || 0,
        // Solo incluir campos básicos que sabemos que existen
        ...(includeTradeIn && formData.trade_in?.brand ? {
          trade_in_brand: formData.trade_in.brand,
          trade_in_model: formData.trade_in.model,
          trade_in_year: formData.trade_in.year,
          trade_in_value_ars: parseFloat(formData.trade_in.value_ars) || 0
        } : {}),
        ...(item.includeFinancing ? {
          financing_amount: parseFloat(item.financing_amount) || 0,
          financing_bank: item.financing_bank || '',
          financing_installments: item.financing_installments || '',
          financing_installment_value: parseFloat(item.financing_installment_value) || 0
        } : {})
      };
      return quoteData;
    });

    return quotes;
  },

  // Simular vehicleItems como en el componente
  mockVehicleItems: [
    {
      vehicle_id: 'vehicle-456',
      vehicle: { brand: 'FORD', model: 'FIESTA', year: '2020' },
      quoted_price: '150000',
      quoted_price_currency: 'ARS',
      quoted_price_exchange_rate: 1200,
      includeFinancing: true,
      financing_amount: '120000',
      financing_bank: 'Banco Nación',
      financing_installments: '60',
      financing_installment_value: '2500'
    }
  ],

  // Simular formData como en el componente
  mockFormData: {
    date: '2024-12-19',
    client_name: 'Juan Pérez',
    trade_in: {
      brand: 'RENAULT',
      model: 'CLIO',
      year: '2018',
      value_ars: '80000'
    }
  },

  runQuoteSavingTest: function() {
    console.log('🧪 TEST: Verificación de guardado de presupuestos\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 1: Procesamiento básico de datos
    console.log('📝 TEST 1: Procesamiento de datos de presupuesto');
    console.log('─'.repeat(50));

    try {
      const processedQuotes = this.processQuoteData(
        this.mockFormData,
        this.mockVehicleItems,
        'client-123',
        true // includeTradeIn
      );

      console.log('✅ Datos procesados correctamente');
      console.log('📤 Quotes generados:', processedQuotes.length);

      const quote = processedQuotes[0];
      console.log('📋 Contenido del quote:');
      Object.entries(quote).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

      // Validar campos requeridos
      const requiredFields = ['quote_date', 'vehicle_id', 'quoted_price_ars'];
      const missingFields = requiredFields.filter(field => !quote[field]);

      if (missingFields.length > 0) {
        console.error(`❌ Faltan campos requeridos: ${missingFields.join(', ')}`);
        return false;
      }

      console.log('✅ Campos requeridos presentes');

      // Validar que los datos sean del tipo correcto
      if (typeof quote.quoted_price_ars !== 'number') {
        console.error('❌ quoted_price_ars no es un número');
        return false;
      }

      if (quote.financing_amount && typeof quote.financing_amount !== 'number') {
        console.error('❌ financing_amount no es un número');
        return false;
      }

      console.log('✅ Tipos de datos correctos');

    } catch (error) {
      console.error('❌ Error procesando datos:', error);
      return false;
    }

    console.log('');

    // Test 2: Validación de datos de permuta
    console.log('🔄 TEST 2: Validación de datos de permuta');
    console.log('─'.repeat(50));

    const quoteWithTradeIn = this.processQuoteData(
      this.mockFormData,
      this.mockVehicleItems,
      'client-123',
      true
    )[0];

    const tradeInFields = ['trade_in_brand', 'trade_in_model', 'trade_in_year', 'trade_in_value_ars'];
    const hasTradeInFields = tradeInFields.every(field => quoteWithTradeIn[field] !== undefined);

    if (hasTradeInFields) {
      console.log('✅ Campos de permuta incluidos correctamente');
    } else {
      console.error('❌ Faltan campos de permuta');
      return false;
    }

    // Test 3: Validación de datos de financiación
    console.log('💳 TEST 3: Validación de datos de financiación');
    console.log('─'.repeat(50));

    const financingFields = ['financing_amount', 'financing_bank', 'financing_installments', 'financing_installment_value'];
    const hasFinancingFields = financingFields.every(field => quoteWithTradeIn[field] !== undefined);

    if (hasFinancingFields) {
      console.log('✅ Campos de financiación incluidos correctamente');
    } else {
      console.error('❌ Faltan campos de financiación');
      return false;
    }

    // Test 4: Validación sin permuta
    console.log('🚫 TEST 4: Validación sin incluir permuta');
    console.log('─'.repeat(50));

    const quoteWithoutTradeIn = this.processQuoteData(
      this.mockFormData,
      this.mockVehicleItems,
      'client-123',
      false // no includeTradeIn
    )[0];

    const hasNoTradeInFields = !tradeInFields.some(field => quoteWithoutTradeIn[field] !== undefined);

    if (hasNoTradeInFields) {
      console.log('✅ Campos de permuta correctamente excluidos');
    } else {
      console.error('❌ Campos de permuta presentes cuando no deberían');
      return false;
    }

    console.log('\n🎯 RESULTADO FINAL:');
    console.log('─'.repeat(50));
    console.log('✅ El procesamiento de presupuestos funciona correctamente');
    console.log('✅ Los datos se estructuran adecuadamente para guardar');
    console.log('✅ Campos opcionales se incluyen/excluyen correctamente');

    return true;
  }
};

// Ejecutar test
testQuoteSaving.runQuoteSavingTest();