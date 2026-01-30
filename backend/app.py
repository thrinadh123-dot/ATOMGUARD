"""
AtomGuard Backend API
Flask REST API for ML-Based Phishing URL Detection

CORE ARCHITECTURE PRINCIPLES:
- Machine Learning (ML) is the FINAL decision authority
- Rule-based logic is used ONLY for explanations, evidence, and UI indicators
- ML and Rule systems are strictly separated
- Feature extraction for ML must be IDENTICAL to training

Author: AtomGuard Development Team
Project: Phishing Website and URL Detection Using Machine Learning
"""

import os
import pickle
import ipaddress
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import ML feature extractor (returns LIST)
# Explicit import from current directory to avoid root directory conflicts
import sys
import os
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
from ml_feature_extractor import extract_features

# Import rule-based feature extractor (returns DICT)
from features.feature_extractor import FeatureExtractor

# Import rule engine for explanations
from rules.rule_engine import RuleEngine

# Import URL validation (loose validation) and domain extraction
from utils.helpers import validate_url, extract_domain

# ------------------ TRUSTED DOMAIN ALLOWLIST ------------------
# Used to reduce false positives from URL-only ML models.
# This runs AFTER ML prediction and does NOT modify ML confidence.
TRUSTED_DOMAINS = {
    "wikipedia.org",
    "google.com",
    "github.com",
    "microsoft.com",
    "apple.com",
    "amazon.com",
    "openai.com",
}

# ------------------ CONFIDENCE GATING THRESHOLD ------------------
# Hard threshold to prevent over-claiming phishing detection.
# If ML confidence < this threshold, downgrade PHISHING to SUSPICIOUS.
# This ensures the system never confidently wrong.
PHISHING_HARD_THRESHOLD = 0.85

# ------------------ VERIFICATION SOURCES ------------------
# External tools users can use to independently verify results.
# Aligns with industry-standard verification methods.
VERIFICATION_SOURCES = [
    "https://www.google.com/safe-browsing/search",
    "https://www.virustotal.com",
    "https://transparencyreport.google.com",
]

# ==================== FLASK APP SETUP ====================

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize rule-based components
feature_extractor = FeatureExtractor()  # For rule engine and UI
rule_engine = RuleEngine()  # For explanations only

# ==================== ML MODEL LOADING ====================

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "model",
    "phishing_model.pkl"
)

ml_model = None

try:
    if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 0:
        with open(MODEL_PATH, "rb") as f:
            ml_model = pickle.load(f)
        
        # Validate model compatibility
        if not hasattr(ml_model, 'predict_proba') and not hasattr(ml_model, 'predict'):
            raise ValueError("Loaded model does not support predict_proba() or predict()")
        
        # Test feature compatibility with a dummy feature vector
        try:
            test_features = [0.0] * 7  # Model expects 7 features
            if hasattr(ml_model, 'predict_proba'):
                _ = ml_model.predict_proba([test_features])
            elif hasattr(ml_model, 'predict'):
                _ = ml_model.predict([test_features])
            print("✅ ML model loaded successfully from:", MODEL_PATH)
            print("✅ Model compatibility verified (7 features)")
        except ValueError as ve:
            if "features" in str(ve).lower():
                # Extract expected feature count from error
                import re
                match = re.search(r'expecting (\d+) features', str(ve))
                if match:
                    expected = match.group(1)
                    print(f"❌ Model feature mismatch: Model expects {expected} features, but extractor provides 7")
                    print("⚠️  Model may have been trained with different features")
                    raise ValueError(f"Feature count mismatch: model expects {expected} features")
            raise
        
    else:
        print("⚠️  ML model not found at:", MODEL_PATH)
        print("⚠️  Backend will use rule-based fallback only")
        ml_model = None
except Exception as e:
    import traceback
    print("❌ Error loading ML model:", str(e))
    print("   Traceback:", traceback.format_exc())
    print("⚠️  Backend will use rule-based fallback only")
    ml_model = None

# ==================== API ENDPOINTS ====================

@app.route("/api/analyze", methods=["POST"])
def analyze_url():
    """
    Analyze a URL for phishing indicators using ML model.
    
    Request Body (JSON):
        {
            "url": "http://example.com"
        }
    
    Response Body (JSON):
        {
            "verdict": "PHISHING | SUSPICIOUS | SAFE",
            "riskLevel": "High | Medium | Low",
            "confidence": 92.34,
            "explanation": "ML-based explanation",
            "evidence": [...],
            "checkedItems": [...],
            "identificationTips": [...],
            "actionSteps": [...]
        }
    
    ML Decision Thresholds:
        - >= 0.7 (70%) → PHISHING
        - 0.4 - 0.69 (40-69%) → SUSPICIOUS
        - < 0.4 (< 40%) → SAFE
    """
    try:
        # ========== REQUEST VALIDATION ==========
        data = request.get_json()
        
        if not data or "url" not in data:
            return jsonify({
                "error": "URL is required",
                "verdict": "SUSPICIOUS",
                "riskLevel": "Medium"
            }), 400
        
        url = data["url"].strip()
        
        if not url:
            return jsonify({
                "error": "URL cannot be empty",
                "verdict": "SUSPICIOUS",
                "riskLevel": "Medium"
            }), 400
        
        # ========== URL VALIDATION (LOOSE) ==========
        # NOTE: Validation is intentionally loose to allow suspicious URLs
        # to be analyzed by ML and rules rather than rejected early
        if not validate_url(url):
            return jsonify({
                "verdict": "SUSPICIOUS",
                "riskLevel": "Medium",
                "confidence": 0.0,
                "explanation": "URL format validation failed. The URL does not meet basic structural requirements for analysis.",
                "evidence": [],
                "checkedItems": ["URL format validation failed"],
                "identificationTips": ["Ensure the URL has a valid format with a domain name"],
                "actionSteps": ["Please provide a valid URL format", "Check for typos or missing protocol"]
            }), 400
        
        # ========== FEATURE EXTRACTION ==========
        
        try:
            # Extract ML features (LIST format - for ML model)
            ml_features = extract_features(url)
            
            # Validate ML features
            if not isinstance(ml_features, list):
                raise ValueError("ML feature extractor must return a list")
            if len(ml_features) == 0:
                raise ValueError("ML feature extractor returned empty list")
            
        except Exception as e:
            print(f"❌ ML feature extraction error: {str(e)}")
            return jsonify({
                "verdict": "SUSPICIOUS",
                "riskLevel": "Medium",
                "confidence": 0.0,
                "error": "Feature extraction failed",
                "explanation": "An error occurred during feature extraction. Please verify the URL format.",
                "evidence": [],
                "checkedItems": ["Feature extraction failed"],
                "identificationTips": ["Please verify the URL format and try again"],
                "actionSteps": ["Retry the analysis", "Check the URL format"]
            }), 500
        
        try:
            # Extract rule features (DICT format - for explanations)
            rule_features = feature_extractor.extract(url)
            
            # Generate rule-based explanations (ML will override verdict)
            rule_result = rule_engine.analyze(url, rule_features)
            
        except Exception as e:
            print(f"❌ Rule feature extraction/analysis error: {str(e)}")
            # Continue with ML-only analysis if rule engine fails
            rule_result = {
                "evidence": [],
                "checkedItems": ["Rule-based analysis unavailable"],
                "identificationTips": ["ML analysis completed successfully"],
                "actionSteps": ["Review ML analysis results"]
            }
        
        # ========== ML DECISION (PRIMARY AUTHORITY) ==========
        
        ml_verdict = None
        ml_confidence = 0.0
        ml_available = False  # Track if ML prediction succeeded
        
        if ml_model is not None:
            try:
                # Validate feature vector length
                # Model expects exactly 7 features (as per training)
                expected_features = 7
                if len(ml_features) != expected_features:
                    raise ValueError(
                        f"Feature vector length mismatch: model expects {expected_features} features, "
                        f"but extractor returned {len(ml_features)}. "
                        f"This indicates a mismatch between training and inference feature extraction."
                    )
                
                # Get ML prediction probabilities
                if hasattr(ml_model, 'predict_proba'):
                    probabilities = ml_model.predict_proba([ml_features])[0]
                    
                    # Handle binary classification: [safe_prob, phishing_prob]
                    if len(probabilities) >= 2:
                        phishing_prob = probabilities[1]  # Phishing probability
                    else:
                        phishing_prob = probabilities[0]  # Fallback
                    
                    ml_confidence = float(phishing_prob)
                    
                    # Ensure confidence is valid (0.0 to 1.0)
                    ml_confidence = max(0.0, min(1.0, ml_confidence))
                    
                    # Apply ML thresholds
                    if ml_confidence >= 0.7:
                        ml_verdict = "PHISHING"
                    elif ml_confidence >= 0.4:
                        ml_verdict = "SUSPICIOUS"
                    else:
                        ml_verdict = "SAFE"
                    
                    ml_available = True
                    print(f"✅ ML prediction: {ml_verdict} (confidence: {ml_confidence:.2%})")
                        
                elif hasattr(ml_model, 'predict'):
                    # Binary prediction: 0 = SAFE, 1 = PHISHING
                    prediction = ml_model.predict([ml_features])[0]
                    if prediction == 1:
                        ml_verdict = "PHISHING"
                        ml_confidence = 0.8  # Default high confidence
                    else:
                        ml_verdict = "SAFE"
                        ml_confidence = 0.2  # Default low confidence
                    
                    ml_available = True
                    print(f"✅ ML prediction: {ml_verdict} (binary classification)")
                else:
                    raise ValueError("ML model does not support predict_proba or predict")
                    
            except Exception as e:
                import traceback
                error_msg = str(e)
                print(f"❌ ML prediction error: {error_msg}")
                print(f"   Feature vector length: {len(ml_features)}")
                print(f"   Feature vector: {ml_features}")
                print(f"   Traceback: {traceback.format_exc()}")
                
                # Check if it's a feature mismatch error
                if "features" in error_msg.lower() and "expecting" in error_msg.lower():
                    print("   ⚠️  CRITICAL: Feature count mismatch between model and extractor!")
                    print("   ⚠️  This indicates the model was trained with different features.")
                    print("   ⚠️  Please verify the model training feature set matches extract_features().")
                
                # Fall through to rule-based fallback
                ml_available = False
        
        # ========== POST-ML HARDENING LAYERS ==========
        # These layers run AFTER ML prediction to ensure correctness
        # and prevent false positives without modifying ML confidence.
        
        trusted_domain_override = False
        confidence_gating_applied = False
        private_ip_detected = False

        if ml_available:
            domain = extract_domain(url) or ""
            
            
            # ========== LAYER 1: TRUSTED DOMAIN OVERRIDE ==========
            # Match base domains and subdomains, e.g. en.wikipedia.org → wikipedia.org
            is_trusted = any(
                domain == trusted or domain.endswith(f".{trusted}")
                for trusted in TRUSTED_DOMAINS
            )
            if is_trusted and ml_verdict == "PHISHING":
                # ML says PHISHING with high confidence, but domain is trusted.
                # Override final verdict to SAFE / Low risk while keeping ML confidence.
                trusted_domain_override = True
                ml_verdict = "SAFE"
            
            # ========== LAYER 2: CONFIDENCE GATING (ANTI-PANIC) ==========
            # Prevent over-claiming: downgrade PHISHING if confidence is not strong enough.
            if ml_verdict == "PHISHING" and ml_confidence < PHISHING_HARD_THRESHOLD:
                # ML flagged as PHISHING but confidence is below hard threshold.
                # Downgrade to SUSPICIOUS to prevent false alarms.
                confidence_gating_applied = True
                ml_verdict = "SUSPICIOUS"
            
            # ========== LAYER 3: PRIVATE / INTERNAL IP HANDLING ==========
            # Private IPs (192.168.x.x, 10.x.x.x, 172.16.x.x) are not phishing websites.
            # They are internal network addresses, commonly used for routers or internal systems.
            try:
                if domain:
                    # Try to parse as IP address
                    ip_obj = ipaddress.ip_address(domain)
                    if ip_obj.is_private:
                        # This is a private/internal IP address
                        private_ip_detected = True
                        # Override to SUSPICIOUS (not PHISHING) with Medium risk
                        if ml_verdict == "PHISHING":
                            ml_verdict = "SUSPICIOUS"
            except (ValueError, AttributeError):
                # Not an IP address, continue normally
                pass

        # ========== FALLBACK TO RULE-BASED (if ML unavailable) ==========
        
        if not ml_available:
            # SAFE DOMAIN ALLOWLIST (fallback mode only)
            domain = extract_domain(url) or ""
            safe_domains = {
                "google.com",
                "www.google.com",
                "accounts.google.com",
            }

            if domain in safe_domains:
                # Known trusted domain in fallback mode
                ml_verdict = "SAFE"
                risk_level = "Low"
                ml_confidence = 0.0
                explanation = (
                    "Preliminary analysis (ML unavailable): "
                    "This URL belongs to a well-known trusted domain. ML analysis is unavailable."
                )
            else:
                # Use rule-based verdict as a hint, but cap severity
                base_verdict = rule_result.get("verdict", "SUSPICIOUS")
                
                # Never allow PHISHING in fallback mode
                if base_verdict == "PHISHING":
                    ml_verdict = "SUSPICIOUS"
                elif base_verdict in ("SAFE", "SUSPICIOUS"):
                    ml_verdict = base_verdict
                else:
                    ml_verdict = "SUSPICIOUS"

                # Cap risk level at Medium in fallback mode
                if ml_verdict == "SAFE":
                    risk_level = "Low"
                else:
                    risk_level = "Medium"

                ml_confidence = 0.0
                explanation = (
                    "Preliminary analysis (ML unavailable): "
                    + rule_result.get(
                        "explanation",
                        "Some indicators were detected, but ML analysis is unavailable."
                    )
                )

            print("⚠️  Using rule-based fallback (ML model unavailable or prediction failed)")
        else:
            # ========== DETERMINE RISK LEVEL ==========
            
            if ml_verdict == "PHISHING":
                risk_level = "High"
            elif ml_verdict == "SUSPICIOUS":
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            # ========== GENERATE ML-BASED EXPLANATION (WITH TRANSPARENCY) ==========
            # Every explanation clearly states what happened and why.
            
            if trusted_domain_override:
                # Mode: ML decision + trusted domain adjustment
                explanation = (
                    "Although the ML model detected phishing-like patterns, this URL "
                    "belongs to a well-known trusted domain. The verdict was adjusted "
                    "to prevent false positives. "
                    f"(ML phishing confidence: {ml_confidence:.1%})."
                )
                # Ensure risk level is Low for trusted overrides
                risk_level = "Low"
            elif private_ip_detected:
                # Mode: ML decision + private IP handling
                explanation = (
                    f"This URL points to a private/internal IP address ({domain}). "
                    f"These addresses (192.168.x.x, 10.x.x.x, 172.16.x.x) are commonly used "
                    f"for routers or internal systems and are not phishing websites. "
                    f"However, accessing them unexpectedly may indicate a security concern. "
                    f"(ML analysis confidence: {ml_confidence:.1%})."
                )
                # Ensure risk level is Medium for private IPs
                risk_level = "Medium"
            elif confidence_gating_applied:
                # Mode: ML decision + confidence gating
                explanation = (
                    f"We evaluated multiple technical indicators using machine learning analysis. "
                    f"Some indicators were detected (confidence: {ml_confidence:.1%}), "
                    f"but the confidence level is not strong enough to confidently classify this as phishing. "
                    f"Caution is advised when visiting this URL."
                )
                # Risk level already set to Medium above
            elif ml_verdict == "PHISHING":
                # Mode: Pure ML decision (high confidence phishing)
                explanation = (
                    f"We evaluated multiple technical indicators using machine learning analysis. "
                    f"Strong phishing indicators were detected (confidence: {ml_confidence:.1%}). "
                    f"This URL is highly likely to be a phishing attempt."
                )
            elif ml_verdict == "SUSPICIOUS":
                # Mode: Pure ML decision (moderate confidence)
                explanation = (
                    f"We evaluated multiple technical indicators using machine learning analysis. "
                    f"Some warning signs were detected (confidence: {ml_confidence:.1%}). "
                    f"Caution is advised when visiting this URL."
                )
            else:
                # Mode: Pure ML decision (low confidence / safe)
                explanation = (
                    f"We evaluated multiple technical indicators using machine learning analysis. "
                    f"No significant phishing indicators were detected (confidence: {ml_confidence:.1%}). "
                    f"However, always verify the authenticity of websites before entering sensitive information."
                )
        
        # ========== BUILD RESPONSE ==========
        
        response = {
            "verdict": ml_verdict,  # ML verdict (or rule fallback, possibly adjusted by hardening layers)
            "riskLevel": risk_level,
            "confidence": round(ml_confidence * 100, 2),  # Percentage (always preserved from ML)
            "mlAvailable": ml_available,
            "explanation": explanation,  # Transparent explanation of decision and any adjustments
            "evidence": rule_result["evidence"],  # From rule engine
            "checkedItems": rule_result["checkedItems"],  # From rule engine
            "identificationTips": rule_result["identificationTips"],  # From rule engine
            "actionSteps": rule_result["actionSteps"],  # From rule engine
            "verificationSources": VERIFICATION_SOURCES  # External verification tools for user trust
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        # Comprehensive error handling
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Analysis error: {str(e)}")
        print(f"   Traceback: {error_trace}")
        
        return jsonify({
            "verdict": "SUSPICIOUS",
            "riskLevel": "Medium",
            "confidence": 0.0,
            "error": "Analysis failed due to internal error",
            "explanation": "An unexpected error occurred during URL analysis. Please try again or contact support if the issue persists.",
            "evidence": [],
            "checkedItems": ["Analysis error occurred"],
            "identificationTips": [
                "Please verify the URL format and try again",
                "Check your internet connection",
                "If the problem persists, contact support"
            ],
            "actionSteps": [
                "Retry the analysis",
                "Verify the URL format",
                "Check system status"
            ]
        }), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        JSON with service status
    """
    return jsonify({
        "status": "healthy",
        "service": "AtomGuard API",
        "ml_model_loaded": ml_model is not None
    }), 200


# ==================== APPLICATION ENTRY POINT ====================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print("\n" + "="*50)
    print("🚀 AtomGuard Backend API Starting...")
    print("="*50)
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🤖 ML Model: {'✅ Loaded' if ml_model else '❌ Not Available'}")
    print("="*50 + "\n")
    
    app.run(host=host, port=port, debug=True)
