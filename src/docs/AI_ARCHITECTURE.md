# Codex AI — AI Architecture Layer

## Panoramica

Codex OS implementa un'architettura AI modulare e stratificata che separa le preoccupazioni across sei layer principali:

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Application Layer                      │
│  (CodexAI Chat, AI Advisor, Intelligence, Auto-Generation)  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   AI Orchestration Layer                     │
│  (codexAIChat, executeAIAction, ragSearch, ragIndexDocument)│
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI Provider Layer                         │
│  ┌──────┬──────────┬──────────┬──────┬────────┬─────────┐  │
│  │ LLM  │Embeddings│Vector DB │ OCR  │ Vision │  Voice  │  │
│  └──────┴──────────┴──────────┴──────┴────────┴─────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  (Base44 Integrations, External APIs, Entity Storage)       │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1: AI Provider Layer

Ogni provider è configurato in `lib/ai/registry.js` con:
- **status**: `active` | `ready` | `stub` | `planned`
- **models**: lista di modelli supportati
- **secretKey**: variabile d'ambiente richiesta (se applicabile)
- **capabilities**: funzionalità specifiche

### 1.1 LLM (Large Language Models)

**Provider attivi:**
- `base44` — Base44 InvokeLLM integration (managed API, no key required)

**Provider disponibili:**
- `openai` — OpenAI API (GPT-4o, GPT-4o-mini, o1, o3)
- `claude` — Anthropic Claude (Opus, Sonnet, Haiku)
- `ollama` — Self-hosted models (Llama, Mistral, Qwen)

**Utilizzo:**
```javascript
import { llm } from '@/lib/ai';

const response = await llm.generate({
  prompt: 'Analizza i margini dei progetti recenti...',
  model: 'automatic', // o 'gpt_5_mini', 'claude_sonnet_4_6'
  add_context_from_internet: false,
  response_json_schema: { /* opzionale */ }
});
```

### 1.2 Embeddings

**Provider attivi:**
- `base44_rag` — Built-in RAG pipeline via ragIndexDocument/ragSearch

**Provider disponibili:**
- `openai_embeddings` — text-embedding-3-small/large (1536 dims)
- `cohere` — embed-multilingual-v3.0 (1024 dims, multilinguale)

**Utilizzo:**
```javascript
import { embeddings } from '@/lib/ai';

const vector = await embeddings.generate('Testo da convertire in embedding');
// Returns: number[] (dimensione dipende dal provider)
```

### 1.3 Vector Database

**Provider attivi:**
- `base44_internal` — RAGDocument entity store

**Provider disponibili:**
- `pinecone` — Managed vector DB
- `supabase_pgvector` — Postgres-native vector search
- `qdrant` — Self-hostable con filtri

**Utilizzo:**
```javascript
import { vectordb } from '@/lib/ai';

const results = await vectordb.search({
  vector: [0.1, 0.2, ...],
  top_k: 5,
  filters: { company_id: 'abc123', source_type: 'project_notes' }
});
```

### 1.4 OCR (Optical Character Recognition)

**Provider attivi:**
- Nessuno (in sviluppo)

**Provider pianificati:**
- `base44_llm_vision` — GPT-4o vision per estrazione testo
- `google_document_ai` — Document AI per fatture/contratti
- `azure_form_recognizer` — Prebuilt models per business documents
- `tesseract` — Open-source via WASM

**Utilizzo futuro:**
```javascript
import { ocr } from '@/lib/ai';

const text = await ocr.extract({
  file_url: 'https://...',
  language: 'it',
  document_type: 'invoice' // opzionale, per ottimizzare estrazione
});
```

### 1.5 Vision (Image Analysis)

**Provider attivi:**
- Nessuno (in sviluppo)

**Provider pianificati:**
- `base44_llm_vision` — Descrizione immagini tramite InvokeLLM
- `openai_vision` — GPT-4o per analisi foto cantiere
- `google_vision` — Label detection, object detection, safe search

**Utilizzo futuro:**
```javascript
import { vision } from '@/lib/ai';

const analysis = await vision.describe({
  image_url: 'https://...',
  task: 'detect_anomaly', // o 'describe', 'classify', 'measure'
  context: 'construction_site_photo'
});
```

### 1.6 Voice / Audio

**Provider attivi:**
- `base44_tts` — GenerateSpeech integration (5 voices, multilinguale)
- `base44_stt` — TranscribeAudio integration (Whisper-based)

**Provider pianificati:**
- `openai_realtime` — Full duplex voice assistant (WebSocket)
- `elevenlabs` — TTS con voice cloning
- `browser_speech` — Web Speech API (free, zero-latency)

**Utilizzo:**
```javascript
import { voice } from '@/lib/ai';

// Text-to-Speech
const audio = await voice.synthesize({
  text: 'Ciao, sono Codex AI...',
  voice: 'river', // o 'honey', 'sunny', 'storm', 'spark'
  language_code: 'it' // opzionale, auto-detect
});

// Speech-to-Text
const transcript = await voice.transcribe({
  audio_url: 'https://...'
});
```

## Layer 2: AI Orchestration Layer

Backend functions che coordinano i provider per task complessi:

### 2.1 codexAIChat
**File:** `functions/codexAIChat.js`

**Responsabilità:**
- Recupera contesto operativo (progetti, ticket, preventivi, Home Passport)
- Applica RBAC e tenant isolation
- Esegue retrieval RAG su documenti indicizzati
- Calcola confidence level (High/Medium/Low)
- Genera citations per ogni fonte usata
- Suggerisce azioni eseguibili
- Traccia audit log

**Input:**
```json
{
  "message": "Quali progetti sono in ritardo?",
  "session_id": "conv_123",
  "context_hint": {
    "project_id": "proj_456", // opzionale
    "client_id": "client_789", // opzionale
    "property_id": "prop_012", // opzionale
    "estimate_id": "est_345" // opzionale
  },
  "file_urls": ["https://..."] // opzionale
}
```

**Output:**
```json
{
  "response": "Testo risposta AI...",
  "suggested_actions": [{"type": "create_task", "label": "Crea task", "params": {...}}],
  "context_used": ["projects", "tickets", "rag_documents"],
  "latency_ms": 342,
  "confidence_level": "High",
  "confidence_reason": "Risposta basata su 3 documenti RAG e dati operativi specifici",
  "citations": [
    {"type": "project", "title": "Villa Rossi", "id": "proj_456", "confidence": 0.95},
    {"type": "rag_document", "title": "Preventivo #2026-001", "chunk_preview": "...", "score": 0.87}
  ]
}
```

### 2.2 executeAIAction
**File:** `functions/executeAIAction.js`

**Responsabilità:**
- Esegue azioni suggerite dall'AI (create_task, create_ticket, ecc.)
- Verifica permessi utente (RBAC)
- Assicura tenant isolation (company_id matching)
- Previene azioni distruttive senza conferma
- Traccia esecuzione in audit log

**Azioni supportate:**
- `create_task` — Crea task
- `create_ticket` — Crea ticket supporto
- `create_estimate_draft` — Bozza preventivo
- `create_checklist` — Crea checklist
- `assign_technician` — Assegna tecnico
- `generate_report` — Genera report progetto
- `summarize_project` — Riassumi stato progetto
- `suggest_pricing` — Suggerisci pricing
- `generate_handover` — Report consegna
- `generate_meeting_notes` — Verbale riunione
- `update_homepassport` — Aggiorna Home Passport

### 2.3 ragSearch
**File:** `functions/ragSearch.js`

**Responsabilità:**
- Recupera chunk rilevanti da RAGDocument entity
- Applica filtri tenant (company_id)
- Applica filtri contesto (project_id, client_id, property_id)
- Calcola relevance score (keyword matching + boost)
- Supporta LLM re-ranking (opzionale)
- Restituisce debug metadata per admin

**Input:**
```json
{
  "query": "Manutenzione preventiva HVAC",
  "top_k": 5,
  "min_score": 0.12,
  "project_id": "proj_456", // opzionale
  "client_id": "client_789", // opzionale
  "property_id": "prop_012", // opzionale
  "use_llm_rerank": false // opzionale, default false
}
```

**Output:**
```json
{
  "results": [
    {
      "chunk_id": "chunk_123",
      "source_type": "knowledge_base",
      "source_title": "Manutenzione HVAC Best Practices",
      "chunk_text": "...",
      "score": 0.87,
      "metadata": {...}
    }
  ],
  "rag_context": "Testo formattato per LLM...",
  "debug": {
    "tenant_isolated": true,
    "company_id_filter": "company_abc",
    "applied_filters": {"company_id": "...", "project_id": "..."},
    "retrieval_method": "keyword+relevance_boost",
    "total_chunks_scanned": 1247
  }
}
```

### 2.4 ragIndexDocument
**File:** `functions/ragIndexDocument.js`

**Responsabilità:**
- Estrae testo da entità o file (PDF, immagini, documenti)
- Suddivide in chunk (500 token, 50 overlap)
- Estrae keyword (Italian stopword filtering)
- Calcola relevance boost basato su source_type
- Memorizza chunk in RAGDocument entity
- Marca chunk come `is_stale: false`

**Input:**
```json
{
  "source_type": "home_passport", // o 'estimate', 'ticket', 'pdf', ecc.
  "source_id": "prop_456",
  "source_title": "Villa Rossi",
  "source_url": "https://...", // opzionale, per file
  "force_reindex": false // opzionale, default false
}
```

## Layer 3: AI Application Layer

Componenti e pagine che utilizzano l'orchestrazione AI:

### 3.1 CodexAI Chat (`/ai`)
**File:** `pages/CodexAI.jsx`

**Features:**
- Chat conversazionale con contesto operativo
- Context Focus Picker (Project/Client/Property/Estimate)
- Safe Mode toggle (azioni in approval queue invece di eseguire)
- Citations inline con score di rilevanza
- Confidence badge (High/Medium/Low)
- Sources panel (destra) con contesto recuperato
- Action confirmation modal per azioni suggerite
- Platform Intelligence Score (welcome screen)

### 3.2 AI Test Console (`/ai-test`)
**File:** `pages/AITestConsole.jsx`

**Test cases:**
- Permissions (margini come Admin vs Technician)
- Isolation (cross-tenant query)
- Actions (crea ticket, crea preventivo)
- Safety (delete document — deve essere bloccato)
- Context (riassumi Home Passport)

**Output per test:**
- Expected result
- Actual result
- Pass/Fail
- Reason

### 3.3 AI Foundation Dashboard (`/ai-foundation`)
**File:** `pages/AIFoundationDashboard.jsx`

**Tab:**
1. **RAG Index** — Chunk stats, reindex controls, stale detection
2. **Action Queue** — Approva/rifiuta/esegui azioni AI
3. **Readiness** — Checklist 10 punti con score 0-100%
4. **Analytics** — Query/user, query/role, latenza media

### 3.4 AI Architecture Review (`/ai-architecture`)
**File:** `pages/AIArchitectureReview.jsx`

**Features:**
- Provider cards per layer (LLM, Embeddings, Vector DB, OCR, Vision, Voice)
- Status badge (Attivo/Pronto/Bozza/Pianificato)
- Security governance notice
- Implementation guide
- Quick links a Test Console, Foundation, Audit Log

### 3.5 AI Audit Log (`/ai-audit`)
**File:** `pages/AIAuditLog.jsx`

**Traccia:**
- User email e role
- Prompt e response summary
- Context usato (entity list)
- Azioni suggerite ed eseguite
- Latency e confidence level
- Security alerts (tentativi bloccati)

### 3.6 AI Memory Manager (`/ai-memory`)
**File:** `pages/AIMemoryManager.jsx`

**Gestisce:**
- AIMemory entity records
- Filtri per tipo (customer_preference, project_history, recurring_issue, ecc.)
- Activation toggle
- Delete memory
- Usage stats (access_count, last_accessed)

## Security & Governance

### Tenant Isolation
Tutte le query AI includono `company_id` filtering:
```javascript
// In codexAIChat
const user = await base44.auth.me();
const companyFilter = { company_id: user.company_id };

// In ragSearch
const chunks = await base44.entities.RAGDocument.filter({
  company_id: user.company_id,
  // + filtri contesto opzionali
});
```

### Role-Based Access Control (RBAC)
Ogni ruolo vede dati diversi:

| Ruolo | Può vedere | Non può vedere |
|-------|-----------|----------------|
| **Admin** | Tutto | — |
| **Project Manager** | Progetti, team, checklists | Margini aziendali, billing |
| **Technician** | SOP, checklists, ticket assegnati | Margini, costi, fornitori, preventivi |
| **Sales** | Preventivi, clienti, margini preventivo | Timesheet, alert finanziari, dati Super Admin |
| **Client** | Solo propri progetti, documenti, ticket | Costi, margini, fornitori, altri clienti |

### Safe Mode
Quando attivo (`localStorage: codex_ai_safe_mode = true`):
- AI non esegue azioni direttamente
- Tutte le azioni vanno in `AIActionQueue` entity
- Richiedono approvazione Admin/PM
- Tracciate in audit log

### Audit Logging
Ogni query AI crea un record in `AIAuditLog`:
```json
{
  "user_email": "mario@codex.it",
  "user_role": "admin",
  "prompt": "Quali progetti sono in ritardo?",
  "response_summary": "3 progetti in ritardo: Villa Rossi, Appartamento Nardi...",
  "context_used": ["projects", "tickets", "rag_documents"],
  "actions_suggested": [{"type": "create_task", ...}],
  "actions_executed": [],
  "latency_ms": 342,
  "confidence_level": "High"
}
```

## Provider Switching

Per cambiare provider (es. da Base44 a OpenAI):

1. **Aggiungi secret key** (se richiesta):
   ```
   Dashboard → Settings → Environment Variables
   OPENAI_API_KEY = sk-...
   ```

2. **Modifica registry** (`lib/ai/registry.js`):
   ```javascript
   llm: {
     active: 'openai', // prima: 'base44'
     providers: {
       base44: { status: 'ready', ... }, // deattivato
       openai: { status: 'active', secretKey: 'OPENAI_API_KEY', ... }
     }
   }
   ```

3. **Testa** con AI Test Console (`/ai-test`)

4. **Monitora** con AI Audit Log (`/ai-audit`)

## Roadmap

### Q2 2026
- [ ] OCR con Google Document AI (fatture, contratti)
- [ ] Vision per analisi foto cantiere (rilevamento anomalie)
- [ ] Voice assistant per update hands-free (tecnici in cantiere)

### Q3 2026
- [ ] Vector DB esterno (Pinecone o pgvector) per scala
- [ ] Embeddings multilinguali (Cohere) per miglior retrieval italiano
- [ ] Fine-tuning LLM su dati Codex (preventivi, SOP, checklists)

### Q4 2026
- [ ] Realtime voice assistant (OpenAI Realtime API)
- [ ] AI agent autonomi per task ripetitivi (es. sollecito fatture)
- [ ] Predictive analytics per ritardi e costi (ML su timesheet + project history)

## Best Practices

1. **Sempre citare fonti** — Le risposte AI devono mostrare citations
2. **Confidence trasparente** — Mai nascondere confidence Low
3. **Safe Mode di default** — Azioni ad alto rischio richiedono approvazione
4. **Audit everything** — Ogni query deve essere tracciata
5. **Tenant first** — Mai query dati senza company_id filtering
6. **RBAC enforcement** — AI eredita permessi utente
7. **Test before deploy** — Usa AI Test Console per validare cambiamenti
8. **Monitor latency** — Oltre 1000ms = ottimizza retrieval o riduci contesto

## Supporto

Per issue o domande:
- **Documentazione:** `/ai-architecture` (in-app)
- **Test:** `/ai-test` (admin only)
- **Audit:** `/ai-audit` (admin only)
- **Foundation:** `/ai-foundation` (RAG health, action queue)