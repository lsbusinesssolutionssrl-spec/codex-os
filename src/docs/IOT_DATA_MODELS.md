# IoT & Smart Property - Data Models

## Entity Schemas for Future Implementation

---

## 1. IoTDevice (Extended Existing Entity)

```json
{
  "name": "IoTDevice",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "property_id": { "type": "string" },
    "brand_id": { "type": "string" },
    "name": { "type": "string" },
    "device_type": {
      "type": "string",
      "enum": [
        "Smart Thermostat",
        "Leak Sensor",
        "Energy Monitor",
        "Security Camera",
        "Smart Lock",
        "Smoke Detector",
        "HVAC Controller",
        "Water Meter",
        "Electric Meter",
        "Motion Sensor",
        "Door/Window Sensor",
        "Smart Plug",
        "Light Controller",
        "Custom Sensor"
      ]
    },
    "manufacturer": { "type": "string" },
    "model": { "type": "string" },
    "serial_number": { "type": "string" },
    "firmware_version": { "type": "string" },
    "connection_type": {
      "type": "string",
      "enum": ["WiFi", "Zigbee", "Z-Wave", "Bluetooth", "LoRaWAN", "Cellular", "Ethernet"]
    },
    "status": {
      "type": "string",
      "enum": ["Online", "Offline", "Error", "Maintenance", "Disconnected"]
    },
    "last_seen": { "type": "string" },
    "install_date": { "type": "string" },
    "warranty_expiry": { "type": "string" },
    "location": { "type": "string" },
    "config": { "type": "object" },
    "metadata": {
      "type": "object",
      "properties": {
        "ip_address": { "type": "string" },
        "mac_address": { "type": "string" },
        "battery_level": { "type": "number" },
        "signal_strength": { "type": "number" }
      }
    }
  },
  "required": ["name", "device_type", "property_id"]
}
```

---

## 2. IoTTelemetry (New Entity)

```json
{
  "name": "IoTTelemetry",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "property_id": { "type": "string" },
    "device_id": { "type": "string" },
    "metric_type": {
      "type": "string",
      "enum": [
        "temperature",
        "humidity",
        "pressure",
        "motion",
        "contact",
        "energy",
        "power",
        "voltage",
        "current",
        "flow",
        "level",
        "vibration",
        "air_quality",
        "light",
        "sound"
      ]
    },
    "value": { "type": "number" },
    "unit": {
      "type": "string",
      "enum": [
        "celsius",
        "fahrenheit",
        "percent",
        "bar",
        "psi",
        "watt",
        "kilowatt",
        "volt",
        "ampere",
        "liter_per_minute",
        "meter",
        "g",
        "ppm",
        "ppb",
        "lux",
        "db"
      ]
    },
    "quality": {
      "type": "string",
      "enum": ["excellent", "good", "fair", "poor", "invalid"]
    },
    "timestamp": { "type": "string" },
    "metadata": { "type": "object" }
  },
  "required": ["device_id", "metric_type", "value", "timestamp"]
}
```

---

## 3. IoTAlert (New Entity)

```json
{
  "name": "IoTAlert",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "property_id": { "type": "string" },
    "device_id": { "type": "string" },
    "alert_type": { "type": "string" },
    "severity": {
      "type": "string",
      "enum": ["Info", "Warning", "Critical", "Emergency"]
    },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["Active", "Acknowledged", "Resolved", "Escalated"]
    },
    "acknowledged_by": { "type": "string" },
    "acknowledged_at": { "type": "string" },
    "resolved_by": { "type": "string" },
    "resolved_at": { "type": "string" },
    "auto_action_taken": { "type": "string" },
    "ticket_id": { "type": "string" },
    "guardian_subscription_id": { "type": "string" },
    "metadata": { "type": "object" }
  },
  "required": ["device_id", "alert_type", "severity", "title"]
}
```

---

## 4. IoTAutomationRule (New Entity)

```json
{
  "name": "IoTAutomationRule",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "property_id": { "type": "string" },
    "brand_id": { "type": "string" },
    "name": { "type": "string" },
    "description": { "type": "string" },
    "trigger": {
      "type": "object",
      "properties": {
        "device_type": { "type": "string" },
        "device_id": { "type": "string" },
        "condition": { "type": "string" },
        "metric_type": { "type": "string" },
        "operator": { "type": "string" },
        "threshold": { "type": "number" }
      }
    },
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["device_command", "notification", "create_ticket", "send_email", "webhook"]
          },
          "config": { "type": "object" }
        }
      }
    },
    "enabled": { "type": "boolean" },
    "execution_count": { "type": "number" },
    "last_executed": { "type": "string" },
    "failure_count": { "type": "number" },
    "created_by": { "type": "string" }
  },
  "required": ["name", "trigger", "actions"]
}
```

---

## 5. IoTDeviceGroup (New Entity)

```json
{
  "name": "IoTDeviceGroup",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "property_id": { "type": "string" },
    "name": { "type": "string" },
    "description": { "type": "string" },
    "group_type": {
      "type": "string",
      "enum": ["zone", "floor", "function", "custom"]
    },
    "device_ids": {
      "type": "array",
      "items": { "type": "string" }
    },
    "automation_rules": {
      "type": "array",
      "items": { "type": "string" }
    },
    "metadata": { "type": "object" }
  },
  "required": ["name", "property_id"]
}
```

---

## 6. IoTFirmwareUpdate (New Entity)

```json
{
  "name": "IoTFirmwareUpdate",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "device_id": { "type": "string" },
    "current_version": { "type": "string" },
    "target_version": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["pending", "downloading", "installing", "completed", "failed"]
    },
    "started_at": { "type": "string" },
    "completed_at": { "type": "string" },
    "error_message": { "type": "string" },
    "auto_update": { "type": "boolean" },
    "scheduled_at": { "type": "string" }
  },
  "required": ["device_id", "current_version", "target_version"]
}
```

---

## 7. IoTEnergyReport (New Entity)

```json
{
  "name": "IoTEnergyReport",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "property_id": { "type": "string" },
    "report_type": {
      "type": "string",
      "enum": ["daily", "weekly", "monthly", "yearly"]
    },
    "period_start": { "type": "string" },
    "period_end": { "type": "string" },
    "total_consumption_kwh": { "type": "number" },
    "total_cost": { "type": "number" },
    "solar_production_kwh": { "type": "number" },
    "grid_export_kwh": { "type": "number" },
    "peak_demand_kw": { "type": "number" },
    "average_daily_kwh": { "type": "number" },
    "comparison_previous_period_pct": { "type": "number" },
    "insights": {
      "type": "array",
      "items": { "type": "string" }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["property_id", "report_type", "period_start", "period_end"]
}
```

---

## 8. IoTSecurityEvent (New Entity)

```json
{
  "name": "IoTSecurityEvent",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "property_id": { "type": "string" },
    "device_id": { "type": "string" },
    "event_type": {
      "type": "string",
      "enum": [
        "motion_detected",
        "door_opened",
        "door_closed",
        "lock_engaged",
        "lock_disengaged",
        "alarm_triggered",
        "camera_recording",
        "person_detected",
        "glass_break",
        "tamper_detected"
      ]
    },
    "severity": {
      "type": "string",
      "enum": ["Info", "Warning", "Critical"]
    },
    "timestamp": { "type": "string" },
    "metadata": {
      "type": "object",
      "properties": {
        "camera_snapshot_url": { "type": "string" },
        "video_clip_url": { "type": "string" },
        "zone": { "type": "string" },
        "confidence_score": { "type": "number" }
      }
    },
    "acknowledged": { "type": "boolean" },
    "false_alarm": { "type": "boolean" }
  },
  "required": ["device_id", "event_type", "timestamp"]
}
```

---

## 9. IoTMaintenanceSchedule (New Entity)

```json
{
  "name": "IoTMaintenanceSchedule",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "property_id": { "type": "string" },
    "device_id": { "type": "string" },
    "maintenance_type": { "type": "string" },
    "description": { "type": "string" },
    "scheduled_date": { "type": "string" },
    "completed_date": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["scheduled", "in_progress", "completed", "overdue", "cancelled"]
    },
    "priority": {
      "type": "string",
      "enum": ["Low", "Medium", "High", "Critical"]
    },
    "assigned_to": { "type": "string" },
    "ticket_id": { "type": "string" },
    "parts_required": {
      "type": "array",
      "items": { "type": "string" }
    },
    "estimated_duration_minutes": { "type": "number" },
    "actual_duration_minutes": { "type": "number" },
    "notes": { "type": "string" },
    "next_scheduled_date": { "type": "string" }
  },
  "required": ["device_id", "maintenance_type", "scheduled_date"]
}
```

---

## 10. IoTIntegration (New Entity)

```json
{
  "name": "IoTIntegration",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "property_id": { "type": "string" },
    "integration_type": {
      "type": "string",
      "enum": [
        "alexa",
        "google_home",
        "homekit",
        "smartthings",
        "home_assistant",
        "ifttt",
        "enel_x",
        "tesla_energy",
        "solaredge",
        "verisure",
        "ajax_systems"
      ]
    },
    "status": {
      "type": "string",
      "enum": ["connected", "disconnected", "error", "configuring"]
    },
    "config": { "type": "object" },
    "enabled_features": {
      "type": "array",
      "items": { "type": "string" }
    },
    "last_sync": { "type": "string" },
    "error_message": { "type": "string" }
  },
  "required": ["property_id", "integration_type"]
}
```

---

## Index Recommendations

```sql
-- IoTTelemetry
CREATE INDEX idx_telemetry_device_timestamp ON IoTTelemetry(device_id, timestamp DESC);
CREATE INDEX idx_telemetry_property_timestamp ON IoTTelemetry(property_id, timestamp DESC);
CREATE INDEX idx_telemetry_metric_type ON IoTTelemetry(metric_type);

-- IoTAlert
CREATE INDEX idx_alerts_property_status ON IoTAlert(property_id, status);
CREATE INDEX idx_alerts_device_timestamp ON IoTAlert(device_id, created_date DESC);
CREATE INDEX idx_alerts_severity ON IoTAlert(severity);

-- IoTAutomationRule
CREATE INDEX idx_automation_property_enabled ON IoTAutomationRule(property_id, enabled);

-- IoTSecurityEvent
CREATE INDEX idx_security_events_property_timestamp ON IoTSecurityEvent(property_id, timestamp DESC);
CREATE INDEX idx_security_events_type ON IoTSecurityEvent(event_type);

-- IoTMaintenanceSchedule
CREATE INDEX idx_maintenance_property_status ON IoTMaintenanceSchedule(property_id, status);
CREATE INDEX idx_maintenance_scheduled_date ON IoTMaintenanceSchedule(scheduled_date);
```

---

**Version:** 1.0.0  
**Status:** Ready for Implementation  
**Last Updated:** 2026-05-27