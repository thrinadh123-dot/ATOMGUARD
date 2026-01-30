# AtomGuard Backend API

**Production-Ready Flask Backend for ML-Based Phishing URL Detection**

## 🎯 Project Overview

AtomGuard is a machine learning-powered phishing URL detection system designed for educational and research purposes. The backend implements a strict ML-first architecture where machine learning models are the final decision authority.

## 🏗️ Architecture Principles

### Core Design Philosophy

1. **ML is the FINAL Decision Authority**
   - Machine learning model verdicts always override rule-based suggestions
   - Rule engine is used ONLY for explanations, evidence, and UI indicators
   - ML and Rule systems are strictly separated

2. **Feature Extraction Separation**
   - **ML Features**: Extracted as LIST (for model prediction)
   - **Rule Features**: Extracted as DICT (for explanations)
   - Feature order for ML must match training data exactly

3. **Loose URL Validation**
   - Validation intentionally allows suspicious patterns
   - ML and rules analyze URLs, not validation
   - Only blocks empty/malformed inputs

## 📁 Directory Structure

```
backend/
├── app.py                        # Flask app entry point
├── ml_feature_extractor.py       # ML feature extractor (LIST output)
│
├── model/
│   └── phishing_model.pkl        # Trained ML model (Random Forest)
│
├── features/
│   ├── __init__.py
│   └── feature_extractor.py      # Rule/UI feature extractor (DICT output)
│
├── rules/
│   ├── __init__.py
│   └── rule_engine.py            # Rule-based explanation engine
│
├── utils/
│   ├── __init__.py
│   └── helpers.py                # URL validation & helpers
│
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

## 🔌 API Endpoints

### POST `/api/analyze`

Analyzes a URL for phishing indicators using ML model.

**Request Body:**
```json
{
  "url": "http://example.com"
}
```

**Response Body:**
```json
{
  "verdict": "PHISHING | SUSPICIOUS | SAFE",
  "riskLevel": "High | Medium | Low",
  "confidence": 92.34,
  "explanation": "ML-based explanation",
  "evidence": [
    {
      "label": "Protocol Security",
      "status": "safe",
      "icon": "check"
    }
  ],
  "checkedItems": [
    "HTTPS protocol is enabled (encryption present)"
  ],
  "identificationTips": [
    "Check for misspelled or altered brand names"
  ],
  "actionSteps": [
    "Do not click the link"
  ]
}
```

### GET `/api/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "service": "AtomGuard API",
  "ml_model_loaded": true
}
```

## 🤖 Machine Learning

### Model Requirements

- **Type**: Random Forest Classifier (or compatible)
- **Location**: `backend/model/phishing_model.pkl`
- **Method**: Uses `predict_proba()` for confidence scores

### ML Decision Thresholds

- **>= 0.7 (70%)** → `PHISHING` (High Risk)
- **0.4 - 0.69 (40-69%)** → `SUSPICIOUS` (Medium Risk)
- **< 0.4 (< 40%)** → `SAFE` (Low Risk)

### Feature Engineering

The ML feature extractor (`ml_feature_extractor.py`) extracts **20 features** as a LIST:

1. URL length
2. Hostname length
3. Path length
4. HTTPS usage (binary)
5. Suspicious TLD (binary)
6. IP address usage (binary)
7. Dot count in hostname
8. Hyphen count in hostname
9. @ symbol presence (binary)
10. Suspicious keyword count
11. Subdomain count
12. Path depth
13. Query parameter presence (binary)
14. Fragment presence (binary)
15. Character diversity ratio
16. Brand mention count
17. Special character count
18. Digit count in hostname
19. Letter count in hostname
20. Digit-to-letter ratio in hostname

**⚠️ CRITICAL**: Feature order MUST match training data exactly.

## 🧠 Rule Engine

The rule engine (`rules/rule_engine.py`) provides:

- **Evidence indicators** (safe/warning/danger)
- **Checked items** (what was analyzed)
- **Identification tips** (educational content)
- **Action steps** (recommended actions)

**Important**: Rule verdicts are used ONLY when ML model is unavailable (fallback mode).

## 🛡️ URL Validation

URL validation (`utils/helpers.py`) is intentionally **LOOSE**:

- ✅ Allows URLs with `@` symbols
- ✅ Allows long URLs
- ✅ Allows suspicious patterns
- ❌ Blocks only: empty input, non-string values, missing domain

This ensures ML and rules can analyze suspicious URLs rather than rejecting them early.

## 🚀 Running the Backend

### Prerequisites

```bash
pip install -r requirements.txt
```

### Start Server

```bash
python app.py
```

The server will start on `http://0.0.0.0:5000` by default.

### Environment Variables

- `PORT`: Server port (default: 5000)
- `HOST`: Server host (default: 0.0.0.0)

## 📦 Dependencies

See `requirements.txt` for complete list. Key dependencies:

- Flask 3.0.0
- flask-cors 4.0.0
- scikit-learn 1.3.2
- numpy 1.24.3

## 🔍 Module Responsibilities

### `app.py`
- Flask application setup
- API endpoint handlers
- ML model loading
- Orchestrates ML and rule systems
- **ML verdict always overrides rule verdict**

### `ml_feature_extractor.py`
- Extracts features as LIST (for ML model)
- Must match training feature order exactly
- Returns 20 numeric features

### `features/feature_extractor.py`
- Extracts features as DICT (for rules/UI)
- Used by rule engine for explanations
- Can include additional features not in ML extractor

### `rules/rule_engine.py`
- Generates explanations and evidence
- Provides checked items and tips
- **Never overrides ML decision** (fallback only)

### `utils/helpers.py`
- Loose URL validation
- URL normalization
- Domain extraction

## ✅ Testing

### Test ML Feature Extractor

```python
from ml_feature_extractor import extract_features

features = extract_features("https://example.com")
print(f"Extracted {len(features)} features")
```

### Test API Endpoint

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 🎓 Viva/Review Notes

### Key Points to Emphasize

1. **ML-First Architecture**: ML is the decision authority, rules are for explanation
2. **Feature Separation**: Two separate extractors (LIST vs DICT)
3. **Loose Validation**: Allows suspicious URLs to be analyzed
4. **Modular Design**: Clean separation of concerns
5. **Production-Ready**: Error handling, logging, health checks

### Common Questions

**Q: Why two feature extractors?**  
A: ML requires LIST format matching training order. Rules need DICT format for flexible explanations.

**Q: What if ML model is unavailable?**  
A: System falls back to rule-based analysis with clear indication.

**Q: How do you ensure feature order matches training?**  
A: `ml_feature_extractor.py` uses fixed order and includes validation functions.

## 📝 License

Educational/Research Project - B.Tech Final Year Project

## 👥 Authors

AtomGuard Development Team

---

**Built with ❤️ for Phishing Detection Research**

