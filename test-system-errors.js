// Script de pruebas exhaustivas del sistema Padrani Automotores
// Simula operaciones completas como usuario tester para detectar errores

const systemTests = {
    // Test 1: Verificar que los datos de ejemplo se cargaron correctamente
    async testDataLoading() {
        console.log('🧪 TEST 1: Verificación de carga de datos\n');
        console.log('─'.repeat(60));

        const entities = ['clients', 'vehicles', 'sales', 'reservations', 'quotes', 'leads'];
        let totalRecords = 0;

        for (const entity of entities) {
            const data = localStorage.getItem(`local_db_${entity}`);
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`✅ ${entity}: ${parsed.length} registros`);
                totalRecords += parsed.length;
            } else {
                console.log(`❌ ${entity}: No encontrado`);
            }
        }

        console.log(`\n📊 Total registros cargados: ${totalRecords}`);

        if (totalRecords === 0) {
            console.log('⚠️ No hay datos cargados. Ejecuta load-sample-data.html primero');
            return false;
        }

        return true;
    },

    // Test 2: Verificar integridad de datos de vehículos
    async testVehicleDataIntegrity() {
        console.log('\n🧪 TEST 2: Integridad de datos de vehículos\n');
        console.log('─'.repeat(60));

        const vehicles = JSON.parse(localStorage.getItem('local_db_vehicles') || '[]');
        const clients = JSON.parse(localStorage.getItem('local_db_clients') || '[]');

        let errors = 0;

        vehicles.forEach(vehicle => {
            // Verificar campos requeridos
            const requiredFields = ['id', 'brand', 'model', 'year', 'status'];
            requiredFields.forEach(field => {
                if (!vehicle[field]) {
                    console.log(`❌ Vehículo ${vehicle.id}: Falta campo requerido '${field}'`);
                    errors++;
                }
            });

            // Verificar que vehículos en consignación tengan proveedor
            if (vehicle.ownership === 'CONSIGNACIÓN' && !vehicle.supplier_client_id) {
                console.log(`❌ Vehículo ${vehicle.id}: Consignación sin proveedor`);
                errors++;
            }

            // Verificar que el proveedor exista si está especificado
            if (vehicle.supplier_client_id) {
                const supplier = clients.find(c => c.id === vehicle.supplier_client_id);
                if (!supplier) {
                    console.log(`❌ Vehículo ${vehicle.id}: Proveedor ${vehicle.supplier_client_id} no existe`);
                    errors++;
                }
            }

            // Verificar precios
            if (vehicle.cost_value && !vehicle.cost_currency) {
                console.log(`❌ Vehículo ${vehicle.id}: Costo sin moneda`);
                errors++;
            }

            // Verificar estados válidos
            const validStates = ['A PERITAR', 'A INGRESAR', 'EN REPARACION', 'DISPONIBLE', 'PAUSADO', 'RESERVADO', 'VENDIDO', 'ENTREGADO'];
            if (!validStates.includes(vehicle.status)) {
                console.log(`❌ Vehículo ${vehicle.id}: Estado inválido '${vehicle.status}'`);
                errors++;
            }
        });

        console.log(`\n📊 Vehículos analizados: ${vehicles.length}`);
        console.log(`❌ Errores encontrados: ${errors}`);

        return errors === 0;
    },

    // Test 3: Verificar integridad de ventas
    async testSalesIntegrity() {
        console.log('\n🧪 TEST 3: Integridad de datos de ventas\n');
        console.log('─'.repeat(60));

        const sales = JSON.parse(localStorage.getItem('local_db_sales') || '[]');
        const vehicles = JSON.parse(localStorage.getItem('local_db_vehicles') || '[]');
        const clients = JSON.parse(localStorage.getItem('local_db_clients') || '[]');

        let errors = 0;

        sales.forEach(sale => {
            // Verificar que el vehículo existe
            const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
            if (!vehicle) {
                console.log(`❌ Venta ${sale.id}: Vehículo ${sale.vehicle_id} no existe`);
                errors++;
            }

            // Verificar que el cliente existe
            const client = clients.find(c => c.id === sale.client_id);
            if (!client) {
                console.log(`❌ Venta ${sale.id}: Cliente ${sale.client_id} no existe`);
                errors++;
            }

            // Verificar que el vehículo esté vendido
            if (vehicle && vehicle.status !== 'VENDIDO') {
                console.log(`❌ Venta ${sale.id}: Vehículo ${vehicle.id} no está marcado como vendido`);
                errors++;
            }

            // Verificar datos de pago
            if (!sale.sale_price || sale.sale_price <= 0) {
                console.log(`❌ Venta ${sale.id}: Precio de venta inválido`);
                errors++;
            }
        });

        console.log(`\n📊 Ventas analizadas: ${sales.length}`);
        console.log(`❌ Errores encontrados: ${errors}`);

        return errors === 0;
    },

    // Test 4: Verificar contratos de venta
    async testContractGeneration() {
        console.log('\n🧪 TEST 4: Generación de contratos de venta\n');
        console.log('─'.repeat(60));

        const sales = JSON.parse(localStorage.getItem('local_db_sales') || '[]');
        const vehicles = JSON.parse(localStorage.getItem('local_db_vehicles') || '[]');
        const clients = JSON.parse(localStorage.getItem('local_db_clients') || '[]');

        let contractsGenerated = 0;
        let errors = 0;

        sales.forEach(sale => {
            const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
            const client = clients.find(c => c.id === sale.client_id);

            if (!vehicle || !client) {
                console.log(`❌ Venta ${sale.id}: Datos insuficientes para contrato`);
                errors++;
                return;
            }

            // Verificar datos requeridos para contrato
            const hasClientData = client.dni && client.cuit_cuil && client.address && client.city && client.province;
            const hasVehicleData = vehicle.brand && vehicle.model && vehicle.year && vehicle.plate &&
                                 vehicle.engine_number && vehicle.chassis_number &&
                                 vehicle.chassis_brand && vehicle.engine_brand &&
                                 vehicle.registration_city && vehicle.registration_province;

            if (!hasClientData) {
                console.log(`❌ Venta ${sale.id}: Datos del cliente insuficientes para contrato`);
                errors++;
            }

            if (!hasVehicleData) {
                console.log(`❌ Venta ${sale.id}: Datos del vehículo insuficientes para contrato`);
                errors++;
            }

            if (hasClientData && hasVehicleData) {
                console.log(`✅ Venta ${sale.id}: Contrato puede generarse correctamente`);
                contractsGenerated++;
            }
        });

        console.log(`\n📊 Contratos que pueden generarse: ${contractsGenerated}/${sales.length}`);
        console.log(`❌ Errores encontrados: ${errors}`);

        return errors === 0;
    },

    // Test 5: Verificar reservas
    async testReservationsIntegrity() {
        console.log('\n🧪 TEST 5: Integridad de reservas\n');
        console.log('─'.repeat(60));

        const reservations = JSON.parse(localStorage.getItem('local_db_reservations') || '[]');
        const vehicles = JSON.parse(localStorage.getItem('local_db_vehicles') || '[]');
        const clients = JSON.parse(localStorage.getItem('local_db_clients') || '[]');

        let errors = 0;

        reservations.forEach(reservation => {
            // Verificar que el vehículo existe
            const vehicle = vehicles.find(v => v.id === reservation.vehicle_id);
            if (!vehicle) {
                console.log(`❌ Reserva ${reservation.id}: Vehículo ${reservation.vehicle_id} no existe`);
                errors++;
            }

            // Verificar que el cliente existe
            const client = clients.find(c => c.id === reservation.client_id);
            if (!client) {
                console.log(`❌ Reserva ${reservation.id}: Cliente ${reservation.client_id} no existe`);
                errors++;
            }

            // Verificar que el vehículo esté reservado
            if (vehicle && vehicle.status !== 'RESERVADO') {
                console.log(`❌ Reserva ${reservation.id}: Vehículo ${vehicle.id} no está marcado como reservado`);
                errors++;
            }

            // Verificar datos financieros
            if (!reservation.agreed_price || reservation.agreed_price <= 0) {
                console.log(`❌ Reserva ${reservation.id}: Precio acordado inválido`);
                errors++;
            }

            if (!reservation.deposit_amount || reservation.deposit_amount <= 0) {
                console.log(`❌ Reserva ${reservation.id}: Monto de seña inválido`);
                errors++;
            }
        });

        console.log(`\n📊 Reservas analizadas: ${reservations.length}`);
        console.log(`❌ Errores encontrados: ${errors}`);

        return errors === 0;
    },

    // Test 6: Verificar presupuestos
    async testQuotesIntegrity() {
        console.log('\n🧪 TEST 6: Integridad de presupuestos\n');
        console.log('─'.repeat(60));

        const quotes = JSON.parse(localStorage.getItem('local_db_quotes') || '[]');
        const vehicles = JSON.parse(localStorage.getItem('local_db_vehicles') || '[]');
        const clients = JSON.parse(localStorage.getItem('local_db_clients') || '[]');

        let errors = 0;

        quotes.forEach(quote => {
            // Verificar que el vehículo existe
            const vehicle = vehicles.find(v => v.id === quote.vehicle_id);
            if (!vehicle) {
                console.log(`❌ Presupuesto ${quote.id}: Vehículo ${quote.vehicle_id} no existe`);
                errors++;
            }

            // Verificar que el cliente existe
            const client = clients.find(c => c.id === quote.client_id);
            if (!client) {
                console.log(`❌ Presupuesto ${quote.id}: Cliente ${quote.client_id} no existe`);
                errors++;
            }

            // Verificar precio cotizado
            if (!quote.quoted_price_ars || quote.quoted_price_ars <= 0) {
                console.log(`❌ Presupuesto ${quote.id}: Precio cotizado inválido`);
                errors++;
            }
        });

        console.log(`\n📊 Presupuestos analizados: ${quotes.length}`);
        console.log(`❌ Errores encontrados: ${errors}`);

        return errors === 0;
    },

    // Test 7: Verificar consultas del CRM
    async testCRMIntegrity() {
        console.log('\n🧪 TEST 7: Integridad del CRM\n');
        console.log('─'.repeat(60));

        const leads = JSON.parse(localStorage.getItem('local_db_leads') || '[]');
        const vehicles = JSON.parse(localStorage.getItem('local_db_vehicles') || '[]');
        const clients = JSON.parse(localStorage.getItem('local_db_clients') || '[]');

        let errors = 0;

        leads.forEach(lead => {
            // Verificar que el cliente existe
            const client = clients.find(c => c.id === lead.client_id);
            if (!client) {
                console.log(`❌ Consulta ${lead.id}: Cliente ${lead.client_id} no existe`);
                errors++;
            }

            // Verificar vehículos de interés
            if (lead.interested_vehicles && lead.interested_vehicles.length > 0) {
                lead.interested_vehicles.forEach(iv => {
                    const vehicle = vehicles.find(v => v.id === iv.vehicle_id);
                    if (!vehicle) {
                        console.log(`❌ Consulta ${lead.id}: Vehículo de interés ${iv.vehicle_id} no existe`);
                        errors++;
                    }
                });
            }

            // Verificar estados válidos
            const validStatuses = ['Nuevo', 'Contactado', 'En negociación', 'Concretado', 'Perdido'];
            if (!validStatuses.includes(lead.status)) {
                console.log(`❌ Consulta ${lead.id}: Estado inválido '${lead.status}'`);
                errors++;
            }

            // Verificar niveles de interés válidos
            const validInterests = ['Bajo', 'Medio', 'Alto', 'Muy alto'];
            if (lead.interest_level && !validInterests.includes(lead.interest_level)) {
                console.log(`❌ Consulta ${lead.id}: Nivel de interés inválido '${lead.interest_level}'`);
                errors++;
            }
        });

        console.log(`\n📊 Consultas analizadas: ${leads.length}`);
        console.log(`❌ Errores encontrados: ${errors}`);

        return errors === 0;
    },

    // Test 8: Verificar cálculos de precios
    async testPriceCalculations() {
        console.log('\n🧪 TEST 8: Cálculos de precios\n');
        console.log('─'.repeat(60));

        const vehicles = JSON.parse(localStorage.getItem('local_db_vehicles') || '[]');
        const currentBlueRate = 1200; // Cotización actual simulada

        let calculationErrors = 0;

        vehicles.forEach(vehicle => {
            if (vehicle.cost_value && vehicle.cost_currency) {
                // Calcular costo total
                const costArs = vehicle.cost_currency === 'USD' ?
                    vehicle.cost_value * (vehicle.cost_exchange_rate || currentBlueRate) :
                    vehicle.cost_value;

                const expensesArs = (vehicle.expenses || []).reduce((sum, expense) => {
                    const expenseArs = expense.currency === 'USD' ?
                        expense.value * (expense.exchange_rate || vehicle.cost_exchange_rate || currentBlueRate) :
                        expense.value;
                    return sum + expenseArs;
                }, 0);

                const totalCost = costArs + expensesArs;

                if (totalCost <= 0) {
                    console.log(`❌ Vehículo ${vehicle.id}: Cálculo de costo total inválido`);
                    calculationErrors++;
                }

                // Verificar precios de venta
                if (vehicle.public_price_value && vehicle.public_price_currency) {
                    const publicArs = vehicle.public_price_currency === 'USD' ?
                        vehicle.public_price_value * (vehicle.public_price_exchange_rate || currentBlueRate) :
                        vehicle.public_price_value;

                    if (publicArs <= totalCost) {
                        console.log(`⚠️ Vehículo ${vehicle.id}: Precio público (${publicArs.toLocaleString('es-AR')}) por debajo del costo (${totalCost.toLocaleString('es-AR')})`);
                    }
                }
            }
        });

        console.log(`\n📊 Vehículos con cálculos verificados: ${vehicles.filter(v => v.cost_value).length}`);
        console.log(`❌ Errores de cálculo encontrados: ${calculationErrors}`);

        return calculationErrors === 0;
    },

    // Ejecutar todos los tests
    async runAllTests() {
        console.log('🚀 INICIANDO SUITE COMPLETA DE TESTING DEL SISTEMA\n');
        console.log('='.repeat(80));
        console.log('🎯 OBJETIVO: Detectar errores actuales y verificar integridad de datos');
        console.log('='.repeat(80));

        const tests = [
            { name: 'Carga de Datos', func: this.testDataLoading },
            { name: 'Integridad de Vehículos', func: this.testVehicleDataIntegrity },
            { name: 'Integridad de Ventas', func: this.testSalesIntegrity },
            { name: 'Generación de Contratos', func: this.testContractGeneration },
            { name: 'Integridad de Reservas', func: this.testReservationsIntegrity },
            { name: 'Integridad de Presupuestos', func: this.testQuotesIntegrity },
            { name: 'Integridad del CRM', func: this.testCRMIntegrity },
            { name: 'Cálculos de Precios', func: this.testPriceCalculations }
        ];

        const results = [];

        for (const test of tests) {
            console.log(`\n${'▌'.repeat(5)} EJECUTANDO: ${test.name.toUpperCase()} ${'▌'.repeat(5)}`);
            try {
                const result = await test.func.call(this);
                results.push({ test: test.name, passed: result });
                console.log(`\n📊 RESULTADO ${test.name}: ${result ? '✅ PASÓ' : '❌ FALLÓ'}\n`);
            } catch (error) {
                console.error(`💥 ERROR en ${test.name}:`, error);
                results.push({ test: test.name, passed: false, error: error.message });
            }
        }

        // Resumen final
        console.log('\n' + '='.repeat(80));
        console.log('📊 REPORTE FINAL DE TESTING DEL SISTEMA');
        console.log('='.repeat(80));

        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const failed = total - passed;

        console.log(`✅ Tests superados: ${passed}/${total}`);
        console.log(`❌ Tests fallidos: ${failed}/${total}`);

        if (failed > 0) {
            console.log('\n🔍 DETALLE DE TESTS FALLIDOS:');
            results.filter(r => !r.passed).forEach(result => {
                console.log(`❌ ${result.test}`);
                if (result.error) console.log(`   Error: ${result.error}`);
            });
        }

        console.log('\n🎯 CONCLUSIONES:');
        console.log('─'.repeat(60));

        if (passed === total) {
            console.log('🎉 ¡TODOS LOS TESTS PASARON!');
            console.log('✅ El sistema está funcionando correctamente');
            console.log('✅ Los datos están íntegros');
            console.log('✅ No se detectaron errores críticos');
        } else {
            console.log('⚠️ Se encontraron algunos errores que requieren atención');
            console.log('🔧 Los errores detectados deben ser corregidos');
        }

        console.log('\n💡 RECOMENDACIONES:');
        console.log('• Verifica que todos los datos de ejemplo se cargaron correctamente');
        console.log('• Prueba las funcionalidades en la aplicación web');
        console.log('• Revisa los contratos generados para verificar que muestren datos correctos');
        console.log('• Confirma que los cálculos de precios sean precisos');

        console.log('\n='.repeat(80));

        return passed === total;
    }
};

// Ejecutar todos los tests
systemTests.runAllTests().catch(console.error);