// Datos de prueba de un vehículo
const mockVehicle = {
  id: 'test-123',
  brand: 'FORD',
  model: 'FIESTA',
  year: '2020',
  cost_value: 80000,
  cost_currency: 'USD',
  cost_exchange_rate: 1100, // Cotización histórica
  target_price_value: 120000,
  target_price_currency: 'ARS',
  target_price_exchange_rate: null,
  public_price_value: 150000,
  public_price_currency: 'ARS',
  public_price_exchange_rate: null,
  infoauto_value: 130000,
  infoauto_currency: 'ARS',
  infoauto_exchange_rate: 1050, // Cotización histórica
  expenses: [
    { value: 5000, currency: 'ARS', exchange_rate: 1100, type: 'GESTORIA' },
    { value: 2000, currency: 'USD', exchange_rate: 1100, type: 'FLETE' }
  ]
};

const currentBlueRate = 1200;

// Función convertValue (igual que en el código)
function convertValue(value, currency, exchangeRate, targetCurrency) {
  if (!value) return 0;
  if (currency === targetCurrency) return value;
  if (currency === 'ARS' && targetCurrency === 'USD') return value / exchangeRate;
  if (currency === 'USD' && targetCurrency === 'ARS') return value * exchangeRate;
  return value;
}

// Función getPriceDisplay de Vehicles.jsx (lista)
function getPriceDisplay(v, type) {
  let valueArs = 0;
  let rateForUsd = currentBlueRate;
  let historicalInfo = null;

  if (type === 'cost') {
    const historicalRate = v.cost_exchange_rate || currentBlueRate;
    const tomaArs = convertValue(v.cost_value, v.cost_currency, historicalRate, 'ARS');
    const gastosArs = (v.expenses || []).reduce((sum, e) => {
      const expenseRate = e.exchange_rate || historicalRate;
      return sum + convertValue(e.value, e.currency, expenseRate, 'ARS');
    }, 0);
    valueArs = tomaArs + gastosArs;
    rateForUsd = historicalRate;
  } else {
    const keyMap = {
      'target': { value: 'target_price_value', currency: 'target_price_currency', rate: 'target_price_exchange_rate' },
      'public': { value: 'public_price_value', currency: 'public_price_currency', rate: 'public_price_exchange_rate' },
      'infoauto': { value: 'infoauto_value', currency: 'infoauto_currency', rate: 'infoauto_exchange_rate' }
    };
    const keys = keyMap[type];
    const value = v[keys.value];
    const currency = v[keys.currency] || 'ARS';
    const rate = v[keys.rate] || currentBlueRate;
    valueArs = convertValue(value, currency, rate, 'ARS');
    rateForUsd = currentBlueRate;
  }

  if (!valueArs) return { ars: '-', usd: '' };

  const valueUsd = valueArs / rateForUsd;
  return {
    ars: `$${valueArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
    usd: `U$D ${valueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  };
}

// Función formatValDual de VehicleView.jsx (vista detallada)
function formatValDual(ars, usdOverride) {
  if (!ars && usdOverride === undefined) return { ars: '-', usd: '' };
  if (!ars && !usdOverride) return { ars: '-', usd: '' };
  return {
    ars: ars ? `$${ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : '-',
    usd: usdOverride !== undefined ? `U$D ${usdOverride.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : (ars ? `U$D ${(ars / currentBlueRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '')
  };
}

// Calcular precios como en VehicleView
function calculateVehicleViewPrices(v) {
  // Costo total (igual que en VehicleView)
  const valorTomaArs = convertValue(v.cost_value, v.cost_currency, v.cost_exchange_rate, 'ARS');
  const gastosArs = (v.expenses || []).reduce((sum, e) => {
    const expenseRate = e.exchange_rate || v.cost_exchange_rate || currentBlueRate;
    return sum + convertValue(e.value, e.currency, expenseRate, 'ARS');
  }, 0);
  const totalCostArs = valorTomaArs + gastosArs;
  const totalCostUsd = totalCostArs / (v.cost_exchange_rate || currentBlueRate);

  // Otros precios
  const targetArs = convertValue(v.target_price_value, v.target_price_currency, v.target_price_exchange_rate, 'ARS');
  const publicArs = convertValue(v.public_price_value, v.public_price_currency, v.public_price_exchange_rate, 'ARS');
  const infoautoArs = convertValue(v.infoauto_value, v.infoauto_currency, v.infoauto_exchange_rate, 'ARS');

  return {
    cost: formatValDual(totalCostArs),
    costUsd: totalCostUsd,
    target: formatValDual(targetArs),
    public: formatValDual(publicArs),
    infoauto: formatValDual(infoautoArs)
  };
}

// Función principal de comparación
function runComparison() {
  console.log('🔍 COMPARACIÓN DE PRECIOS: Lista vs Vista Detallada\n');
  console.log('📊 Vehículo de prueba:', mockVehicle.brand, mockVehicle.model, mockVehicle.year);
  console.log('💱 Cotización actual BLUE: $' + currentBlueRate);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const types = ['cost', 'infoauto', 'target', 'public'];

  types.forEach(type => {
    console.log(`💰 PRECIO: ${type.toUpperCase()}`);
    console.log('─'.repeat(60));

    // Lista (Vehicles.jsx)
    const listPrice = getPriceDisplay(mockVehicle, type);
    console.log(`📋 Lista:     ${listPrice.ars} | ${listPrice.usd}`);

    // Vista detallada (VehicleView.jsx)
    const viewPrices = calculateVehicleViewPrices(mockVehicle);

    if (type === 'cost') {
      console.log(`👁️  Vista:     ${viewPrices.cost.ars} | U$D ${viewPrices.costUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
    } else {
      console.log(`👁️  Vista:     ${viewPrices[type].ars} | ${viewPrices[type].usd}`);
    }

    // Comparar
    const listArs = listPrice.ars.replace(/[$,]/g, '').replace('U$D ', '');
    const viewArs = type === 'cost' ? viewPrices.cost.ars.replace(/[$,]/g, '') : viewPrices[type].ars.replace(/[$,]/g, '');

    if (listArs !== viewArs.replace(/[$,]/g, '')) {
      console.log('❌ ⚠️  DIFERENCIA DETECTADA!');
    } else {
      console.log('✅ Coinciden');
    }

    console.log('');
  });

  console.log('🔍 DETALLES DE CÁLCULO:');
  console.log('─'.repeat(60));

  const v = mockVehicle;
  console.log(`💵 Valor de toma: $${v.cost_value} ${v.cost_currency} (cotización histórica: $${v.cost_exchange_rate})`);
  console.log(`💵 Gastos: $${v.expenses[0].value} ARS + $${v.expenses[1].value} USD`);
  console.log(`📈 InfoAuto: $${v.infoauto_value} ARS (cotización histórica: $${v.infoauto_exchange_rate})`);
  console.log(`🎯 Objetivo: $${v.target_price_value} ARS (sin cotización específica)`);
  console.log(`🌐 Público: $${v.public_price_value} ARS (sin cotización específica)`);

  console.log('\n🎯 CONCLUSIÓN:');
  console.log('─'.repeat(60));
  console.log('Si hay diferencias, el problema está en la lógica de cálculo entre lista y vista detallada.');
  console.log('El sistema de precios debe ser consistente en todas las vistas.');
}

// Ejecutar comparación
runComparison();