# IoT Smart Property Architecture

## Panoramica

Codex OS è **IoT-ready** per integrazione futura di sensori intelligenti che abilitano monitoraggio in tempo reale e manutenzione predittiva avanzata.

---

## Entity Esistente: IoTDevice

L'entity `IoTDevice` è già implementata e supporta:

**Tipi di Dispositivi:**
- Smart Thermostat
- Leak Sensor
- Energy Monitor
- Security Camera
- Smart Lock
- Smoke Detector
- HVAC Controller
- Water Meter
- Electric Meter
- Motion Sensor
- Door/Window Sensor
- Smart Plug
- Light Controller
- Custom Sensor

**Campi Chiave:**
```typescript
{
  name: string
  device_type: enum (vedi sopra)
  manufacturer: string
  model: string
  serial_number: string
  firmware_version: string
  connection_type: enum [WiFi, Zigbee, Z-Wave, Bluetooth, LoRaWAN, Cellular, Ethernet]
  status: enum [Online, Offline, Error, Maintenance, Disconnected]
  last_seen: datetime
  install_date: date
  warranty_expiry: date
  location: string
  config: object
  metadata: {
    ip_address: string
    mac_address: string
    battery_level: number
    signal_strength: number
  }
}
```

---

## Architettura di Integrazione

### Livello 1: Device Connectivity

```
IoT Sensors → Gateway → Base44 Functions → Entity IoTDevice
```

**Protocolli Supportati:**
- **WiFi**: Direct HTTP/MQTT
- **Zigbee/Z-Wave**: Hub required (e.g., SmartThings, Hubitat)
- **LoRaWAN**: Network server → webhook
- **Bluetooth**: Mobile bridge
- **Cellular**: Direct MQTT/HTTPS

### Livello 2: Data Ingestion

**Backend Function: `ingestIoTTelemetry`**
```javascript
// Riceve telemetry da dispositivi
Deno.serve(async (req) => {
  const { device_id, telemetry } = await req.json();
  
  // 1. Validate device
  const device = await base44.entities.IoTDevice.get(device_id);
  
  // 2. Store reading (new entity: IoTReading)
  await base44.entities.IoTReading.create({
    device_id,
    property_id: device.property_id,
    timestamp: new Date().toISOString(),
    data: telemetry,
  });
  
  // 3. Check thresholds → alerts
  await checkThresholds(device_id, telemetry);
  
  return Response.json({ success: true });
});
```

**Nuova Entity: IoTReading** (da creare)
```json
{
  "device_id": "string",
  "property_id": "string",
  "timestamp": "datetime",
  "data": {
    "temperature": "number",
    "humidity": "number",
    "consumption": "number",
    "battery": "number",
    // dynamic fields based on device type
  },
  "anomaly_detected": "boolean",
  "alert_triggered": "boolean"
}
```

### Livello 3: Real-time Processing

**Threshold Rules Engine:**
```javascript
const THRESHOLDS = {
  'Leak Sensor': { water_detected: true → alert: 'CRITICAL' },
  'Energy Monitor': { consumption > baseline * 1.5 → alert: 'WARNING' },
  'HVAC Controller': { efficiency < 80% → alert: 'MAINTENANCE' },
  'Smoke Detector': { smoke_detected: true → alert: 'EMERGENCY' },
};
```

**Alert Generation:**
```javascript
async function checkThresholds(device_id, telemetry) {
  const device = await base44.entities.IoTDevice.get(device_id);
  const thresholds = THRESHOLDS[device.device_type];
  
  for (const [key, rule] of Object.entries(thresholds)) {
    if (rule.condition(telemetry[key])) {
      await base44.entities.PropertyRisk.create({
        property_id: device.property_id,
        risk_type: mapDeviceTypeToRisk(device.device_type),
        severity: rule.alert,
        confidence_level: 95,
        title: `${device.device_type} Alert`,
        description: `Anomaly detected: ${key}`,
        evidence: [device_id],
        detected_date: new Date().toISOString(),
      });
    }
  }
}
```

---

## Use Cases per Categoria

### 1. Water Leak Detection

**Sensori:** Aqara, Fibaro, Shelly
**Telemetria:** `water_detected: boolean`
**Alert:** Immediato (push notification + ticket automatico)
**Integrazione:**
```javascript
if (telemetry.water_detected) {
  // Create emergency ticket
  await base44.entities.SupportTicket.create({
    property_id,
    issue_type: 'Water Leak',
    priority: 'Urgent',
    title: 'Perdita Rilevata - IoT Sensor',
    status: 'Open',
  });
  
  // Send SMS/Email
  await base44.integrations.Core.SendEmail({
    to: propertyOwner,
    subject: 'ALLARME PERDITA',
    body: 'Perdita rilevata in [location]',
  });
}
```

### 2. Energy Monitoring

**Sensori:** Shelly EM, Tasmota, Modbus
**Telemetria:** `consumption_kwh, voltage, current, power_factor`
**Analisi:**
- Baseline calculation (storico 30 giorni)
- Anomaly detection (>2σ dalla baseline)
- Cost forecasting

**Insight AI:**
```
"Consumo energetico anomalo rilevato:
- Consumo attuale: 5.2 kWh
- Baseline storica: 2.1 kWh (+147%)
- Possibile causa: HVAC malfunzionante
- Costo stimato extra: €45/mese
- Azione: Ispezione HVAC raccomandata"
```

### 3. HVAC Telemetry

**Sensori:** Nest, Ecobee, Tado
**Telemetria:** `temperature, humidity, setpoint, efficiency, runtime_hours`
**Manutenzione Predittiva:**
```javascript
// Calculate efficiency degradation
const efficiency = telemetry.efficiency;
const baseline = device.metadata.install_efficiency;
const degradation = (baseline - efficiency) / baseline;

if (degradation > 0.2) {
  // 20% degradation → maintenance needed
  await base44.entities.PropertyMaintenance.create({
    property_id: device.property_id,
    maintenance_type: 'Predictive',
    title: 'HVAC Efficiency Degradation',
    description: `Efficiency dropped from ${baseline}% to ${efficiency}%`,
    scheduled_date: addDays(30),
    ai_generated: true,
    ai_reasoning: `HVAC efficiency degraded by ${(degradation * 100).toFixed(0)}% since installation. Maintenance recommended to restore performance.`,
  });
}
```

### 4. Environmental Sensors

**Sensori:** Temperature, humidity, CO2, PM2.5
**Telemetria:** `temp, humidity, co2_ppm, pm25`
**Health Impact:**
```javascript
// Indoor air quality scoring
const aqi = calculateAQI(telemetry);
if (aqi < 50) {
  // Good air quality
} else if (aqi < 100) {
  // Moderate → suggest ventilation
} else {
  // Poor → alert + HVAC recommendation
  await createInsight({
    type: 'Efficiency Improvement',
    title: 'Qualità Aria Scadente',
    ai_reasoning: `CO2: ${telemetry.co2_ppm}ppm (soglia: 1000ppm). 
                   PM2.5: ${telemetry.pm25}μg/m³ (soglia: 25μg/m³).
                   Ventilazione o purificatore raccomandati.`,
  });
}
```

### 5. Smart Meters

**Sensori:** Water meter, electric meter
**Telemetria:** `total_consumption, flow_rate, leak_probability`
**Leak Detection Algorithm:**
```javascript
// Continuous flow detection (2am-5am baseline)
if (hour >= 2 && hour <= 5) {
  const baseline_flow = 0; // No usage expected
  const actual_flow = telemetry.flow_rate;
  
  if (actual_flow > baseline_flow + threshold) {
    // Probable leak
    await createRisk({
      type: 'Water Leak',
      severity: 'High',
      confidence: 85,
      ai_reasoning: `Flusso notturno anomalo: ${actual_flow}L/h 
                     (baseline: ${baseline_flow}L/h).
                     Possibile perdita occulta.`,
    });
  }
}
```

---

## Integration Patterns

### Pattern 1: Webhook-Based (Cloud Devices)

```
Device Cloud → Webhook → Base44 Function → Entity Storage
```

**Esempio:** Shelly, Tuya, SmartThings
```javascript
functions/handleIoTWebhook.js:
Deno.serve(async (req) => {
  const payload = await req.json();
  
  // Map webhook to device
  const device = await findDeviceByWebhookId(payload.device_id);
  
  // Process telemetry
  await ingestTelemetry(device, payload.data);
  
  return Response.json({ ok: true });
});
```

### Pattern 2: MQTT Broker (Direct Devices)

```
Device → MQTT Broker → MQTT Subscriber → Base44 Function
```

**Setup:**
1. MQTT Broker (AWS IoT, HiveMQ, Mosquitto)
2. Subscriber function (Deno Deploy con MQTT client)
3. Forward to Base44 via HTTP

### Pattern 3: Edge Gateway (Local Protocol)

```
Zigbee/Z-Wave Devices → Gateway → Cloud API → Base44
```

**Gateway:** Hubitat, Home Assistant, OpenHAB
**Integration:** Gateway webhook o polling API

---

## Data Model Extensions

### Entity: IoTReading (Nuova)

```json
{
  "name": "IoTReading",
  "type": "object",
  "properties": {
    "company_id": "string",
    "device_id": "string",
    "property_id": "string",
    "timestamp": "datetime",
    "data": "object",
    "anomaly_score": "number (0-1)",
    "alert_triggered": "boolean",
    "processed": "boolean",
    "metadata": "object"
  },
  "required": ["device_id", "timestamp", "data"]
}
```

### Entity: IoTAlertRule (Nuova)

```json
{
  "name": "IoTAlertRule",
  "type": "object",
  "properties": {
    "company_id": "string",
    "property_id": "string",
    "device_type": "string",
    "metric": "string",
    "operator": "enum [>, <, =, >=, <=]",
    "threshold": "number",
    "severity": "enum [Low, Medium, High, Critical]",
    "action": "enum [Create Ticket, Send Email, SMS, Push]",
    "enabled": "boolean"
  }
}
```

---

## Security Considerations

### Device Authentication
- API keys per device
- Token rotation ogni 90 giorni
- Rate limiting per device ID

### Data Encryption
- TLS 1.3 per telemetria in transito
- AES-256 per dati sensibili a riposo

### Access Control
- Tenant isolation (company_id)
- Property-scoped access
- Admin-only device configuration

---

## Scalability

### Volume Estimates
- 100 properties × 10 devices = 1,000 devices
- 1 reading/min/device = 1,440,000 readings/day
- Storage: ~100MB/day (compressed)

### Optimization Strategies
- Aggregazione hourly/daily per long-term storage
- Downsampling: raw data (7 giorni) → hourly (30 giorni) → daily (1 anno)
- Time-series DB (InfluxDB, TimescaleDB) per alta frequenza

---

## Implementation Roadmap

### Phase 1: Foundation (Completed)
✅ Entity IoTDevice esistente
✅ Architecture design
✅ Integration patterns definiti

### Phase 2: Core Integration (Next)
- [ ] Entity IoTReading
- [ ] Entity IoTAlertRule
- [ ] Function: ingestIoTTelemetry
- [ ] Function: handleIoTWebhook
- [ ] Function: processIoTAlerts

### Phase 3: Intelligence
- [ ] Anomaly detection ML
- [ ] Baseline calculation
- [ ] Predictive maintenance da telemetry
- [ ] Energy optimization AI

### Phase 4: Ecosystem
- [ ] Mobile app per technician
- [ ] Real-time dashboard
- [ ] Alert notification system
- [ ] Integration con smart home platforms

---

## Business Value

**Per Property Manager:**
- Rilevamento immediato guasti
- Riduzione danni da perdite (€€€)
- Ottimizzazione energetica (15-25% savings)
- Manutenzione basata su condizioni reali

**Per Clienti:**
- Sicurezza 24/7
- Minor downtime
- Risparmio energetico
- Comfort ambientale

**Per Codex OS:**
- Revenue ricorrente (IoT monitoring service)
- Differenziazione competitiva
- Data moat (più dati → AI migliore)
- Upsell su servizi professionali

---

## Vendor Recommendations

**Leak Sensors:**
- Aqara Water Leak Sensor (Zigbee, economico)
- Fibaro Flood Sensor (Z-Wave, premium)
- Shelly Water Leak (WiFi, direct)

**Energy Monitors:**
- Shelly EM (WiFi, dual channel)
- Tasmota + CT (open source)
- Modbus energy meters (industrial)

**HVAC Controllers:**
- Nest Learning Thermostat
- Ecobee SmartThermostat
- Tado Smart Radiator Thermostats

**Environmental:**
- Aqara Temperature/Humidity
- Netatmo Weather Station
- PurpleAir (PM2.5)

**Gateways:**
- Hubitat Elevation (Zigbee + Z-Wave)
- Home Assistant Green (open source)
- SmartThings Hub (Samsung)

---

## Cost Estimates

**Hardware (per property):**
- Leak sensors (3×): €90
- Energy monitor (1×): €60
- HVAC controller (1×): €150
- Environmental (2×): €60
- **Totale: €360/property**

**Cloud/Infrastructure:**
- MQTT Broker: €50/month (1000 devices)
- Data storage: €100/month
- Processing: €200/month
- **Totale: €350/month**

**Revenue Model:**
- IoT Monitoring Service: €9.99/property/month
- 100 properties = €999/month
- Break-even: ~4 mesi

---

## Next Steps

1. **Pilot Program**: 3 properties, 10 devices each
2. **Data Collection**: 3 mesi di telemetria
3. **ML Training**: Baseline e anomaly detection
4. **Scale**: Rollout a tutto il portafoglio

**Timeline:** 8-12 settimane per MVP
**Budget:** €5,000 (hardware + development)