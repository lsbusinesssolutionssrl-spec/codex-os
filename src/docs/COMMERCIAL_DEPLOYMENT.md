# Codex OS — Commercial Deployment Guide
## Go-to-Market Checklist

---

## 1. Pre-Launch Setup

### Stripe Configuration
- ⚠️ Crea Stripe account
- ⚠️ Configura 3 Products (Starter, Professional, Enterprise)
- ⚠️ Crea Prices per ogni piano (monthly + yearly)
- ⚠️ Popola `stripe_price_id_monthly` e `stripe_price_id_yearly` in SubscriptionPlan
- ⚠️ Configura webhook endpoint: `https://yourdomain.com/api/stripe-webhook`
- ⚠️ Testa checkout flow in modalità test

### Domain & Branding
- [ ] Configura dominio principale (es. app.codexos.io)
- [ ] Setup SSL certificate
- [ ] Configura email transazionali (Resend/SendGrid)
- [ ] Prepara template email:
  - Welcome (nuova company registrata)
  - Trial expiry warning (3 giorni prima)
  - Subscription confirmation
  - Quota exceeded warning

### Database Migration
- ✅ Esegui script per aggiungere `company_id` a entity esistenti
- ✅ Crea company "default" per dati legacy
- ✅ Associa tutti gli utenti esistenti alla company default
- ✅ Verifica RLS filters funzionano correttamente

---

## 2. Testing Checklist

### Multi-Tenant Isolation
- [ ] Crea 2 company diverse (Company A e Company B)
- [ ] Verifica: Company A non vede dati di Company B
- [ ] Verifica: Utenti associati a company corretta
- [ ] Verifica: Settings e brand sono isolati

### Subscription Flow
- [ ] Test signup nuova company
- [ ] Test trial 14 giorni
- [ ] Test upgrade piano (Starter → Professional)
- [ ] Test cambio billing cycle (monthly → yearly)
- [ ] Test cancellazione subscription

### Quota Enforcement
- [ ] Crea utenti oltre il limite → deve bloccare
- [ ] Crea progetti oltre il limite → deve bloccare
- [ ] Upload file oltre storage → deve bloccare
- [ ] Verifica warning a 90% utilizzo

### Brand Customization
- [ ] Upload logo company
- [ ] Cambio colori brand
- [ ] Verifica anteprima colori
- [ ] Verifica logo visibile in app

---

## 3. Pricing Strategy

### Recommended Pricing (Italia/Europa)

| Piano | Monthly | Yearly (save 17%) | Target |
|-------|---------|-------------------|--------|
| Starter | €49 | €490 | Freelance, piccole imprese |
| Professional | €99 | €990 | PMI con team 5-10 persone |
| Enterprise | €249 | €2.490 | Grandi aziende, multi-sede |

### Launch Promotion
- **Early Adopters**: 50% sconto per primi 6 mesi (primi 100 clienti)
- **Referral Program**: 1 mese gratis per ogni referral convertito
- **Annual Prepay**: 2 mesi gratis (già incluso nel prezzo yearly)

---

## 4. Go-to-Market Strategy

### Phase 1: Soft Launch (Week 1-2)
- [ ] Invita 10-20 beta tester (aziende reali)
- [ ] Raccogli feedback su onboarding
- [ ] Monitora bug e problemi di usabilità
- [ ] Affina pricing in base al feedback

### Phase 2: Public Launch (Week 3-4)
- [ ] Landing page con pricing
- [ ] Demo video e tutorial
- [ ] Blog post: "Codex OS Multi-Tenant Launch"
- [ ] Social media campaign (LinkedIn, Instagram)
- [ ] Email a lista esistente (se presente)

### Phase 3: Growth (Month 2-3)
- [ ] Google Ads (keyword: "gestione cantieri", "preventivi edili")
- [ ] Partnership con associazioni di categoria
- [ ] Webinar dimostrativi settimanali
- [ ] Case studies con clienti early adopter

---

## 5. Customer Success

### Onboarding Email Sequence
1. **Day 0**: Welcome + getting started guide
2. **Day 1**: Video tutorial (5 min) su funzionalità base
3. **Day 3**: Suggerimenti su preventivi e progetti
4. **Day 7**: Check-in: "Come sta andando?"
5. **Day 11**: Reminder trial in scadenza (3 giorni)
6. **Day 14**: Ultimo giorno trial — upgrade ora

### Support Channels
- **Email**: support@codexos.io (risposta < 24h)
- **Chat in-app**: Per piani Professional+
- **Knowledge Base**: Guide e FAQ
- **Video Tutorial**: Libreria YouTube

### Churn Prevention
- Alert automatici a 90% quota utilizzo
- Offerta downgrade (non solo cancellation)
- Exit survey per capire motivo cancellazione
- Follow-up call per Enterprise in churn

---

## 6. Metrics & KPIs

### Financial Metrics
- **MRR (Monthly Recurring Revenue)**: Ricavo mensile ricorrente
- **ARR (Annual Recurring Revenue)**: MRR × 12
- **ARPU (Average Revenue Per User)**: MRR / totale aziende
- **Churn Rate**: % aziende cancellate / mese
- **LTV (Lifetime Value)**: ARPU × mesi medi di retention

### Product Metrics
- **Activation Rate**: % signup che completano onboarding
- **DAU/MAU**: Utenti attivi giornalieri / mensili
- **Feature Adoption**: % aziende che usano funzionalità chiave
- **Quota Utilization**: % media di quota utilizzata

### Targets (Primi 6 Mesi)
| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Aziende attive | 20 | 100 | 300 |
| MRR | €2.000 | €10.000 | €30.000 |
| Churn Rate | <5% | <3% | <2% |
| Activation Rate | 60% | 70% | 75% |

---

## 7. Legal & Compliance

### GDPR (Europa)
- [ ] Privacy policy aggiornata per multi-tenant
- [ ] Data processing agreement (DPA) per aziende
- [ ] Right to erasure: cancellazione dati su richiesta
- [ ] Data export: download dati in formato CSV/JSON
- [ ] Cookie banner (se applicabile)

### Termini di Servizio
- [ ] Termini e condizioni d'uso
- [ ] SLA per piani Enterprise (uptime 99.9%)
- [ ] Policy per abuso/quota exceeded
- [ ] Refund policy (14 giorni money-back)

### Security
- [ ] Penetration test (consigliato)
- [ ] Backup automatici giornalieri
- [ ] Disaster recovery plan
- [ ] Incident response procedure

---

## 8. Technical Infrastructure

### Scaling Considerations
- **Database**: Monitora performance con crescita dati
- **File Storage**: CDN per file statici (logo, foto)
- **API Rate Limiting**: 1000 req/hour per company (base)
- **Caching**: Redis per query frequenti

### Monitoring
- **Error Tracking**: Sentry o simile
- **Uptime Monitoring**: UptimeRobot o Pingdom
- **Analytics**: Mixpanel/Amplitude per user behavior
- **Logs**: Centralizzati (Datadog, LogRocket)

### Backup Strategy
- **Database**: Backup giornaliero + retention 30 giorni
- **File Storage**: Versioning S3 (conserva 7 versioni)
- **Disaster Recovery**: RTO < 4h, RPO < 1h

---

## 9. Post-Launch Roadmap

### Month 1-2: Stabilization
- Fix bug critici segnalati dagli utenti
- Ottimizza performance query lente
- Migliora onboarding in base al feedback

### Month 3-4: Feature Expansion
- AI Advisor avanzato (consigli su preventivi)
- Mobile app (iOS/Android) per tecnici
- Integrazione con software contabilità (Xero, QuickBooks)

### Month 5-6: Enterprise Features
- White-label completo (custom domain per azienda)
- SSO (SAML/OAuth) per grandi clienti
- API pubbliche per integrazioni custom
- Multi-language support (EN, ES, DE)

---

## 10. Launch Checklist

### Week Before Launch
- [ ] Tutti i test completati
- [ ] Stripe configurato in live mode
- [ ] Email template caricate
- [ ] Landing page pubblicata
- [ ] Support team pronto

### Launch Day
- [ ] Deploy production
- [ ] Verifica tutti i flussi funzionano
- [ ] Monitora error log
- [ ] Rispondi tempestivamente a segnalazioni
- [ ] Annuncia launch su social/email

### Week After Launch
- [ ] Raccogli feedback utenti
- [ ] Analizza metriche di attivazione
- [ ] Identifica colli di bottiglia
- [ ] Pianifica iterazioni rapide

---

**Codex OS è pronto per il mercato. Buon lancio! 🚀**