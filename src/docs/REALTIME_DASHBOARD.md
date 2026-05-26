# Real-Time Executive Dashboard - Documentazione

## Panoramica
Sistema di polling ottimizzato per aggiornare in tempo reale i widget KPI e i grafici della Executive Dashboard, con notifiche push per margini critici.

## Funzionalità Implementate

### 1. **Live KPI Widgets** (`components/LiveKpiWidgets.jsx`)
- **Aggiornamento**: Ogni 15 secondi
- **KPI Monitorati**:
  - Ricavi Totali
  - Margine Medio (%)
  - Progetti Critici (margine < 25%)
  - Progetti Attivi
- **Indicatori Visivi**:
  - Badge "Live" con animazione pulse
  - Timestamp ultimo aggiornamento
  - Trend indicators (↑ ↓ →)

### 2. **Notifiche Push per Margini Critici**
- **Soglia Default**: 25% (configurabile)
- **Trigger**: Quando un progetto scende sotto la soglia
- **Notifiche**:
  - Toast in-app (sonner) con azione "Vedi Progetto"
  - Badge rosso con counter nel header
  - Pannello alert in tempo reale con lista progetti critici

### 3. **Alert Email Automatizzati**
- **Funzione Backend**: `functions/sendMarginAlerts.js`
- **Automazione**: Giornaliera alle 8:00 AM
- **Contenuto**:
  - Lista progetti con margine < 25%
  - Dettagli: margine %, valore contratto, costi
  - Raccomandazioni operative

### 4. **Configurazione Alert** (`components/AlertSettings.jsx`)
- **Soglie Configurabili**:
  - Margine Critico (default: 25%)
  - Margine Attenzione (default: 30%)
- **Toggle**:
  - Email Alert (report giornaliero)
  - Push Notification (real-time)
- **Frequenza**:
  - Immediato
  - Ogni ora
  - Giornaliero

### 5. **Executive Insights Real-Time** (`pages/ExecutiveInsights.jsx`)
- **Polling Interval**: 30 secondi
- **Feature**:
  - Rilevamento automatico nuovi alert
  - Comparazione con dati precedenti
  - Notifiche solo per nuovi margini critici (evita spam)
  - Storico alert nella sessione

## Architettura Tecnica

### Polling Ottimizzato
```javascript
// LiveKpiWidgets: 15 secondi (KPI critici)
setInterval(() => loadKpiData(true), 15000);

// ExecutiveInsights: 30 secondi (dati completi)
setInterval(() => loadExecutiveData(true), 30000);
```

### Rilevamento Cambiamenti
```javascript
// Salva stato precedente
previousDataRef.current = execData;

// Confronta e notifica solo cambiamenti
if (marginNow < 25 && (marginBefore === null || marginBefore >= 25)) {
  // Notifica nuovo alert
}
```

### Notifiche Toast
```javascript
toast.error('⚠️ Margine Critico: Progetto X', {
  description: 'Margine sceso al 22.5% - Sotto soglia 25%',
  duration: 8000,
  action: {
    label: 'Vedi Progetto',
    onClick: () => navigate(`/projects/${id}`),
  },
});
```

## Automazioni Configurate

| Nome | Tipo | Frequenza | Funzione |
|------|------|-----------|----------|
| Alert Giornaliero Margini Critici | Scheduled | Daily 8:00 AM | sendMarginAlerts |
| Genera Lessons Learned | Entity | Project → Delivered | generateProjectLearning |
| Alert Scadenza Documenti | Scheduled | Daily 6:00 AM | checkDocumentExpiry |

## Configurazione Soglie

Le soglie sono salvate in `localStorage` con chiave `executiveAlertSettings`:

```json
{
  "criticalMarginThreshold": 25,
  "warningMarginThreshold": 30,
  "emailAlertsEnabled": true,
  "pushAlertsEnabled": true,
  "alertFrequency": "immediate"
}
```

## Performance

- **Network**: Richieste parallele con `Promise.all()`
- **Render**: Componenti ottimizzati con React.memo (opzionale)
- **Battery**: Polling disattivato su unmount
- **Debounce**: Notifiche filtrate per evitare duplicati

## Estensioni Future

1. **WebSocket**: Per real-time vero (invece di polling)
2. **Service Worker**: Per push notification browser
3. **Entità AlertLog**: Per storico alert persistenti
4. **Soglie per Progetto**: Configurazione individuale per progetto
5. **Machine Learning**: Predizione margini basata su storico

## Utilizzo

1. **Naviga su** `/executive-insights`
2. **Monitora** i widget KPI in tempo reale
3. **Ricevi** notifiche per margini critici
4. **Configura** le soglie cliccando sull'icona ⚙️
5. **Consulta** lo storico alert nel pannello "Alert Margini Critici"

## Supporto

Per personalizzazioni o integrazioni con sistemi esterni (es. Slack, Teams), contattare lo sviluppo.