# Codex OS - IoT & Smart Property Architecture

## Overview

Codex OS IoT architecture enables property monitoring, predictive maintenance, and smart home integration through a unified telemetry platform.

---

## 1. IoT Device Categories

### 1.1 Smart Home Sensors

**Device Types:**
- Temperature sensors
- Humidity sensors
- Motion detectors
- Door/window contact sensors
- Glass break sensors
- Light sensors
- Air quality sensors (CO2, VOC, PM2.5)
- Water leak detectors
- Smoke/CO detectors

**Data Points:**
```json
{
  "device_id": "sensor_001",
  "type": "temperature",
  "location": "living_room",
  "value": 22.5,
  "unit": "celsius",
  "battery_level": 85,
  "signal_strength": -45,
  "timestamp": "2026-05-27T10:30:00Z"
}
```

---

### 1.2 HVAC Monitoring

**Device Types:**
- Smart thermostats
- HVAC controllers
- Zone controllers
- Air flow sensors
- Filter pressure sensors
- Compressor monitors

**Data Points:**
```json
{
  "device_id": "hvac_001",
  "type": "thermostat",
  "location": "main_floor",
  "current_temp": 21.0,
  "target_temp": 22.0,
  "mode": "heating",
  "fan_speed": "medium",
  "filter_status": "good",
  "energy_consumption_kwh": 2.5,
  "runtime_hours": 1250,
  "last_maintenance": "2026-01-15",
  "timestamp": "2026-05-27T10:30:00Z"
}
```

**Alerts:**
- Filter replacement needed
- Unusual energy consumption
- Compressor failure detected
- Zone temperature deviation
- System efficiency degradation

---

### 1.3 Energy Monitoring

**Device Types:**
- Smart meters (electric, water, gas)
- Circuit-level monitors
- Solar panel inverters
- Battery storage monitors
- EV charger monitors
- Smart plugs/outlets

**Data Points:**
```json
{
  "device_id": "meter_001",
  "type": "electric_meter",
  "location": "electrical_room",
  "current_power_w": 3500,
  "voltage_v": 230,
  "current_a": 15.2,
  "power_factor": 0.95,
  "total_consumption_kwh": 12450,
  "solar_production_kwh": 8200,
  "grid_export_kwh": 3100,
  "battery_level_pct": 78,
  "timestamp": "2026-05-27T10:30:00Z"
}
```

**Analytics:**
- Real-time consumption
- Peak demand tracking
- Solar production vs consumption
- Cost optimization recommendations
- Anomaly detection (unusual usage patterns)

---

### 1.4 Leak Detection

**Device Types:**
- Water leak sensors
- Flow meters
- Pressure sensors
- Automatic shut-off valves
- Moisture sensors

**Data Points:**
```json
{
  "device_id": "leak_001",
  "type": "water_leak_sensor",
  "location": "basement",
  "status": "dry",
  "water_detected": false,
  "flow_rate_lpm": 0,
  "pressure_bar": 3.5,
  "valve_position": "open",
  "battery_level": 92,
  "timestamp": "2026-05-27T10:30:00Z"
}
```

**Alert Levels:**
- **Info**: Normal operation
- **Warning**: Unusual flow pattern detected
- **Critical**: Water leak detected - automatic shut-off triggered
- **Emergency**: Major leak - immediate action required

---

### 1.5 Security Systems

**Device Types:**
- Security cameras (IP, PoE)
- Motion sensors
- Door/window sensors
- Smart locks
- Alarm panels
- Access control systems
- Video doorbells

**Data Points:**
```json
{
  "device_id": "cam_001",
  "type": "security_camera",
  "location": "front_entrance",
  "status": "recording",
  "motion_detected": false,
  "last_motion": "2026-05-27T09:15:00Z",
  "storage_used_gb": 45,
  "network_status": "online",
  "firmware_version": "2.1.5",
  "timestamp": "2026-05-27T10:30:00Z"
}
```

**Events:**
- Motion detected
- Door opened/closed
- Lock engaged/disengaged
- Alarm triggered
- Camera offline
- Storage full warning

---

### 1.6 Maintenance Telemetry

**Device Types:**
- Equipment runtime monitors
- Vibration sensors
- Temperature probes
- Pressure sensors
- Flow sensors
- Performance monitors

**Monitored Equipment:**
- Water heaters
- Pumps
- Elevators
- Generators
- Pool equipment
- Irrigation systems

**Data Points:**
```json
{
  "device_id": "pump_001",
  "type": "water_pump",
  "location": "mechanical_room",
  "status": "running",
  "runtime_hours": 2450,
  "vibration_level": "normal",
  "temperature_c": 45,
  "pressure_bar": 4.2,
  "efficiency_pct": 87,
  "next_maintenance": "2026-06-15",
  "timestamp": "2026-05-27T10:30:00Z"
}
```

**Predictive Maintenance:**
- Runtime-based maintenance scheduling
- Vibration anomaly detection
- Efficiency degradation tracking
- Failure prediction (ML-based)

---

## 2. IoT Entity Model

### IoTDevice Entity (Already Exists - Extended)

```json
{
  "id": "device_001",
  "company_id": "comp_456",
  "property_id": "prop_789",
  "brand_id": "brand_123",
  "name": "Living Room Thermostat",
  "device_type": "Smart Thermostat",
  "manufacturer": "Nest",
  "model": "Learning Thermostat 3rd Gen",
  "serial_number": "ABC123456",
  "firmware_version": "5.9.3",
  "connection_type": "WiFi",
  "status": "Online",
  "last_seen": "2026-05-27T10:30:00Z",
  "install_date": "2025-06-15",
  "warranty_expiry": "2027-06-15",
  "location": "Living Room",
  "config": {
    "ip_address": "192.168.1.100",
    "mac_address": "00:1A:2B:3C:4D:5E",
    "sampling_interval_seconds": 60,
    "reporting_interval_seconds": 300
  },
  "metadata": {
    "battery_level": 85,
    "signal_strength": -45,
    "uptime_hours": 2160
  }
}
```

### IoTTelemetry Entity (New)

```json
{
  "id": "telemetry_001",
  "company_id": "comp_456",
  "property_id": "prop_789",
  "device_id": "device_001",
  "metric_type": "temperature",
  "value": 22.5,
  "unit": "celsius",
  "quality": "good",
  "timestamp": "2026-05-27T10:30:00Z",
  "metadata": {
    "battery_level": 85,
    "signal_strength": -45
  }
}
```

### IoTAlert Entity (New)

```json
{
  "id": "alert_001",
  "company_id": "comp_456",
  "property_id": "prop_789",
  "device_id": "device_001",
  "alert_type": "water_leak_detected",
  "severity": "Critical",
  "title": "Water Leak Detected in Basement",
  "description": "Water leak sensor in basement has detected moisture",
  "status": "Active",
  "acknowledged_by": null,
  "acknowledged_at": null,
  "resolved_by": null,
  "resolved_at": null,
  "auto_action_taken": "shut_off_valve",
  "created_date": "2026-05-27T10:30:00Z"
}
```

### IoTAutomationRule Entity (New)

```json
{
  "id": "rule_001",
  "company_id": "comp_456",
  "property_id": "prop_789",
  "name": "Auto Shut-off on Leak Detection",
  "trigger": {
    "device_type": "water_leak_sensor",
    "condition": "water_detected == true"
  },
  "actions": [
    {
      "type": "device_command",
      "device_type": "shut_off_valve",
      "command": "close"
    },
    {
      "type": "notification",
      "channels": ["push", "sms", "email"],
      "message": "Water leak detected! Automatic shut-off activated."
    },
    {
      "type": "create_ticket",
      "priority": "Urgent",
      "assign_to": "emergency_team"
    }
  ],
  "enabled": true,
  "execution_count": 3,
  "last_executed": "2026-05-20T14:22:00Z"
}
```

---

## 3. Integration with Existing Systems

### 3.1 Home Passport Integration

**Property Health Score Enhancement:**

```javascript
// Property health score includes IoT data
const healthScore = {
  overall: 87,
  components: {
    structural: 90,
    electrical: 85,
    plumbing: 88,
    hvac: 82,
    security: 95,
    energy_efficiency: 80
  },
  iot_insights: {
    devices_online: 24,
    devices_total: 25,
    alerts_active: 1,
    energy_consumption_trend: 'decreasing',
    maintenance_due: 2,
    anomalies_detected: 0
  }
};
```

**Interventions Timeline:**
```json
{
  "property_id": "prop_789",
  "interventions": [
    {
      "type": "iot_installation",
      "date": "2026-05-27",
      "description": "Installed smart thermostat and leak sensors",
      "devices": ["device_001", "device_002", "device_003"],
      "project_id": "proj_456"
    },
    {
      "type": "iot_alert_response",
      "date": "2026-05-20",
      "description": "Responded to water leak alert",
      "alert_id": "alert_001",
      "ticket_id": "ticket_789",
      "action_taken": "Replaced faulty pipe section"
    }
  ]
}
```

---

### 3.2 Guardian Integration

**Proactive Maintenance:**

```json
{
  "guardian_subscription_id": "guard_001",
  "property_id": "prop_789",
  "iot_monitoring": {
    "enabled": true,
    "devices_monitored": 25,
    "alert_threshold": "warning",
    "auto_response_enabled": true,
    "24_7_monitoring": true
  },
  "automated_actions": [
    {
      "trigger": "hvac_filter_pressure_high",
      "action": "create_maintenance_ticket",
      "priority": "Medium"
    },
    {
      "trigger": "water_leak_detected",
      "action": "emergency_response",
      "priority": "Critical"
    },
    {
      "trigger": "security_breach",
      "action": "alert_owner_and_authorities",
      "priority": "Critical"
    }
  ],
  "monthly_reports": {
    "device_uptime": "99.8%",
    "alerts_resolved": 12,
    "energy_savings": "15%",
    "maintenance_events": 3
  }
}
```

**Guardian Service Tiers:**

| Tier | IoT Features | Price |
|------|--------------|-------|
| **Basic** | Leak detection, smoke/CO monitoring | €29/mo |
| **Smart** | + HVAC, energy monitoring, security | €79/mo |
| **Premium** | + Full automation, predictive maintenance | €149/mo |
| **Enterprise** | + Custom integrations, SLA | Custom |

---

### 3.3 Property Entity Integration

**Property Entity (Extended):**

```json
{
  "id": "prop_789",
  "company_id": "comp_456",
  "property_name": "Villa Rosa",
  "client_id": "client_123",
  "type": "Villa",
  "smart_property_features": {
    "iot_enabled": true,
    "devices_installed": 25,
    "automation_rules": 8,
    "energy_monitoring": true,
    "security_system": true,
    "hvac_smart_control": true,
    "leak_detection": true,
    "solar_panels": true,
    "battery_storage": false,
    "ev_charger": true
  },
  "iot_infrastructure": {
    "hub_model": "Samsung SmartThings Hub v3",
    "protocol": ["Zigbee", "Z-Wave", "WiFi", "Thread"],
    "network_coverage": "excellent",
    "backup_power": true,
    "internet_backup": "4G LTE"
  }
}
```

---

## 4. Data Flow Architecture

### 4.1 Telemetry Pipeline

```
[IoT Devices] 
    ↓ (MQTT/HTTP/WebSocket)
[IoT Gateway]
    ↓ (Validation & Normalization)
[Message Queue (Kafka/RabbitMQ)]
    ↓ (Stream Processing)
[Time-Series Database (InfluxDB/TimescaleDB)]
    ↓ (Real-time Analytics)
[Alert Engine]
    ↓ (Notification)
[Codex OS Platform]
    ↓ (Storage & Visualization)
[Dashboard & Mobile App]
```

### 4.2 Data Retention Policy

| Data Type | Retention | Storage |
|-----------|-----------|---------|
| Real-time telemetry | 30 days | Time-series DB |
| Aggregated hourly | 1 year | Time-series DB |
| Aggregated daily | 5 years | Cold storage |
| Alerts | 2 years | PostgreSQL |
| Device events | 1 year | PostgreSQL |
| Automation logs | 90 days | PostgreSQL |

---

## 5. Communication Protocols

### 5.1 Supported Protocols

**Device-to-Gateway:**
- MQTT (primary)
- HTTP/HTTPS REST API
- WebSocket (real-time)
- CoAP (constrained devices)

**Gateway-to-Cloud:**
- HTTPS REST API
- MQTT over TLS
- gRPC (high-performance)

**Local Network:**
- Zigbee 3.0
- Z-Wave Plus
- Thread
- Bluetooth LE
- WiFi (2.4GHz/5GHz)
- LoRaWAN (long-range)

### 5.2 Message Format

**MQTT Topic Structure:**
```
codex/{company_id}/{property_id}/{device_id}/{metric_type}
```

**Example Messages:**
```json
// Temperature reading
{
  "topic": "codex/comp_456/prop_789/device_001/temperature",
  "payload": {
    "value": 22.5,
    "unit": "celsius",
    "quality": "good",
    "ts": 1716804600000
  }
}

// Alert event
{
  "topic": "codex/comp_456/prop_789/device_002/alert",
  "payload": {
    "alert_type": "water_detected",
    "severity": "critical",
    "message": "Water leak detected in basement",
    "ts": 1716804600000
  }
}
```

---

## 6. Security & Privacy

### 6.1 Device Security

**Requirements:**
- Unique device credentials (X.509 certificates)
- Encrypted communication (TLS 1.3)
- Secure boot and firmware signing
- Regular firmware updates (OTA)
- Hardware security module (HSM) for critical devices

**Authentication:**
```json
{
  "device_id": "device_001",
  "auth_method": "certificate",
  "certificate_issued": "2026-01-01",
  "certificate_expiry": "2027-01-01",
  "last_authenticated": "2026-05-27T10:30:00Z",
  "auth_status": "valid"
}
```

### 6.2 Data Privacy

**GDPR Compliance:**
- Data minimization (collect only necessary data)
- Purpose limitation (use data only for specified purposes)
- Storage limitation (retention policies enforced)
- Security by design (encryption, access control)
- User consent management

**Data Access Control:**
```json
{
  "user_id": "user_001",
  "property_access": ["prop_789"],
  "device_access": ["device_001", "device_002"],
  "data_access_level": "read_only",
  "can_control_devices": false,
  "can_view_history": true,
  "history_range_days": 30
}
```

---

## 7. API Design

### 7.1 Device Management API

```
GET    /api/v1/iot/devices                      - List all devices
POST   /api/v1/iot/devices                      - Register new device
GET    /api/v1/iot/devices/:id                  - Get device details
PUT    /api/v1/iot/devices/:id                  - Update device
DELETE /api/v1/iot/devices/:id                  - Remove device
POST   /api/v1/iot/devices/:id/command          - Send command to device
GET    /api/v1/iot/devices/:id/telemetry        - Get device telemetry
GET    /api/v1/iot/devices/:id/alerts           - Get device alerts
```

### 7.2 Telemetry API

```
GET    /api/v1/iot/telemetry                    - Query telemetry data
POST   /api/v1/iot/telemetry                    - Ingest telemetry (devices)
GET    /api/v1/iot/telemetry/aggregate          - Get aggregated data
GET    /api/v1/iot/telemetry/anomalies          - Detect anomalies
```

### 7.3 Alerts API

```
GET    /api/v1/iot/alerts                       - List alerts
POST   /api/v1/iot/alerts/:id/acknowledge       - Acknowledge alert
POST   /api/v1/iot/alerts/:id/resolve           - Resolve alert
GET    /api/v1/iot/alerts/stats                  - Alert statistics
```

### 7.4 Automation API

```
GET    /api/v1/iot/automations                  - List automation rules
POST   /api/v1/iot/automations                  - Create automation
PUT    /api/v1/iot/automations/:id              - Update automation
DELETE /api/v1/iot/automations/:id              - Delete automation
POST   /api/v1/iot/automations/:id/test         - Test automation
GET    /api/v1/iot/automations/:id/logs         - Execution logs
```

---

## 8. Dashboard & Visualization

### 8.1 Property Dashboard

**Real-time Overview:**
- Device status (online/offline)
- Current readings (temp, humidity, energy)
- Active alerts
- Energy consumption (real-time + trends)
- Security status
- Automation activity

**Historical Analytics:**
- Temperature/humidity trends
- Energy consumption patterns
- Alert history
- Device uptime
- Maintenance timeline

### 8.2 Mobile App Features

**Push Notifications:**
- Critical alerts (immediate)
- Warning alerts (digest)
- Maintenance reminders
- Automation triggers
- Security events

**Remote Control:**
- Thermostat adjustment
- Light control
- Lock/unlock doors
- Camera viewing
- Alarm arming/disarming

---

## 9. Predictive Maintenance

### 9.1 ML Models

**Failure Prediction:**
- HVAC compressor failure (7-day forecast)
- Water pump bearing wear
- Battery degradation
- Filter clogging prediction
- Security camera storage failure

**Anomaly Detection:**
- Unusual energy consumption
- Abnormal vibration patterns
- Temperature deviations
- Water flow anomalies
- Network connectivity issues

### 9.2 Maintenance Scheduling

**Automated Scheduling:**
```json
{
  "device_id": "hvac_001",
  "maintenance_type": "filter_replacement",
  "scheduled_date": "2026-06-15",
  "priority": "Medium",
  "estimated_duration_minutes": 30,
  "parts_required": ["filter_type_a"],
  "technician_skills": ["hvac_basic"],
  "auto_created_ticket": true,
  "ticket_id": "ticket_456"
}
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Q3 2026)
- [ ] IoTDevice entity extensions
- [ ] IoTTelemetry entity
- [ ] IoTAlert entity
- [ ] Basic device registration API
- [ ] Telemetry ingestion (MQTT)
- [ ] Simple alert system

### Phase 2: Integration (Q4 2026)
- [ ] Home Passport IoT dashboard
- [ ] Guardian IoT monitoring tier
- [ ] Property IoT features
- [ ] Mobile app notifications
- [ ] Basic automation rules

### Phase 3: Advanced (Q1 2027)
- [ ] Predictive maintenance ML
- [ ] Energy analytics
- [ ] Advanced automation
- [ ] Third-party integrations
- [ ] Voice assistant integration

### Phase 4: Scale (Q2 2027)
- [ ] Multi-property management
- [ ] Enterprise features
- [ ] White-label IoT dashboards
- [ ] Partner integrations
- [ ] Advanced security features

---

## 11. Third-Party Integrations

### 11.1 Smart Home Platforms

**Supported Platforms:**
- Amazon Alexa
- Google Home
- Apple HomeKit
- Samsung SmartThings
- Home Assistant
- IFTTT

### 11.2 Energy Providers

**Integrations:**
- Enel X (Italy)
- Tesla Energy
- Sonnen
- LG Energy Solution
- SolarEdge

### 11.3 Security Services

**Integrations:**
- Verisure
- Securitas Direct
- Ajax Systems
- Ring Alarm
- Arlo Security

---

## 12. Cost Model

### 12.1 Infrastructure Costs

| Component | Cost/Month | Notes |
|-----------|------------|-------|
| IoT Gateway | €50-200 | Per property |
| Message Queue | €100-500 | Based on volume |
| Time-series DB | €200-1000 | Based on retention |
| Compute (processing) | €100-300 | Auto-scaling |
| Storage | €50-200 | Cold + hot storage |

### 12.2 Device Costs (Customer)

| Device Type | Cost Range | Installation |
|-------------|------------|--------------|
| Smart Thermostat | €150-300 | Included |
| Leak Sensor (pack of 3) | €100-200 | Included |
| Energy Monitor | €200-400 | Included |
| Security Camera | €100-300 | Optional |
| Smart Lock | €200-400 | Optional |
| Hub/Gateway | €100-200 | Included |

### 12.3 Service Pricing

**Guardian IoT Tiers:**
- Basic: €29/mo (leak + smoke/CO)
- Smart: €79/mo (+ HVAC + energy)
- Premium: €149/mo (full automation)
- Enterprise: Custom (SLA + custom)

**Installation Package:**
- Basic Setup: €499 (up to 10 devices)
- Standard: €999 (up to 25 devices)
- Premium: €1999 (up to 50 devices)
- Custom: Quote (50+ devices)

---

## 13. Success Metrics

### 13.1 Technical KPIs

- Device uptime: >99.5%
- Alert delivery latency: <5 seconds
- Telemetry ingestion rate: >10,000 msg/sec
- False positive rate: <1%
- System availability: 99.9%

### 13.2 Business KPIs

- IoT-enabled properties: Target 500 in Year 1
- Guardian IoT adoption: 30% of existing customers
- Average devices per property: 15-25
- Customer satisfaction: >4.5/5
- Reduction in emergency calls: 40%
- Energy savings for customers: 15-25%

---

## 14. Risk Mitigation

### 14.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Device incompatibility | High | Strict certification process |
| Network outages | Medium | Local processing + 4G backup |
| Data breaches | Critical | End-to-end encryption, regular audits |
| False alerts | Medium | ML-based validation, human review |
| Scale limitations | Medium | Cloud-native architecture, auto-scaling |

### 14.2 Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low adoption | High | Competitive pricing, education |
| High support costs | Medium | Self-service, AI support |
| Regulatory changes | Medium | Compliance monitoring, legal review |
| Competition | Medium | Differentiation via integration |

---

**Version:** 1.0.0  
**Status:** Architecture Ready - Pre-Implementation  
**Last Updated:** 2026-05-27  
**Next Review:** Q3 2026