"""
AtomGuard Backend API
Flask API for phishing URL detection and analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from features.feature_extractor import FeatureExtractor
from rules.rule_engine import RuleEngine
from utils.helpers import validate_url
import os
import pickle

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize components
feature_extractor = FeatureExtractor()
rule_engine = RuleEngine()

# ML Model Integration (with fallback)
# Load phishing detection model if available, otherwise use rule-based only
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'phishing_model.pkl')
ml_model = None

try:
    if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 0:
        with open(MODEL_PATH, 'rb') as f:
            ml_model = pickle.load(f)
        print(f"ML model loaded successfully from {MODEL_PATH}")
    else:
        print(f"ML model not found at {MODEL_PATH}. Using rule-based detection only.")
except Exception as e:
    print(f"Error loading ML model: {e}. Using rule-based detection only.")
    ml_model = None

@app.route('/api/analyze', methods=['POST'])
def analyze_url():
    """
    Analyze a URL for phishing indicators
    
    Request body:
        {
            "url": "https://example.com"
        }
    
    Returns:
        JSON analysis result with verdict, risk level, and explanations
    """
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url'].strip()
        
        # Validate URL format
        if not validate_url(url):
            return jsonify({
                'error': 'Invalid URL format',
                'verdict': 'SUSPICIOUS',
                'riskLevel': 'Medium'
            }), 400
        
        # Extract features for analysis
        features = feature_extractor.extract(url)
        
        # ML MODEL IS PRIMARY DECISION AUTHORITY
        # Rule engine is used only for generating explanations and evidence
        ml_verdict = None
        ml_confidence = 0.0
        
        if ml_model is not None:
            try:
                # Get feature names and prepare feature vector for model
                feature_names = feature_extractor.get_feature_names()
                feature_vector = [features.get(name, 0.0) for name in feature_names]
                
                # Get ML prediction (ML is the decision authority)
                if hasattr(ml_model, 'predict_proba'):
                    ml_prediction = ml_model.predict_proba([feature_vector])[0]
                    # ML model returns probabilities: [safe_prob, phishing_prob] or similar
                    if len(ml_prediction) >= 2:
                        phishing_prob = ml_prediction[1] if len(ml_prediction) > 1 else ml_prediction[0]
                        ml_confidence = phishing_prob
                        
                        # ML decides verdict based on probability threshold
                        if phishing_prob >= 0.7:
                            ml_verdict = 'PHISHING'
                        elif phishing_prob >= 0.4:
                            ml_verdict = 'SUSPICIOUS'
                        else:
                            ml_verdict = 'SAFE'
                    else:
                        # Single probability output
                        ml_confidence = ml_prediction[0]
                        if ml_confidence >= 0.7:
                            ml_verdict = 'PHISHING'
                        elif ml_confidence >= 0.4:
                            ml_verdict = 'SUSPICIOUS'
                        else:
                            ml_verdict = 'SAFE'
                elif hasattr(ml_model, 'predict'):
                    ml_prediction = ml_model.predict([feature_vector])[0]
                    # Binary classification: 0 = SAFE, 1 = PHISHING
                    if ml_prediction == 1:
                        ml_verdict = 'PHISHING'
                        ml_confidence = 0.8  # Default confidence for binary
                    else:
                        ml_verdict = 'SAFE'
                        ml_confidence = 0.2
            except Exception as e:
                # If ML model fails, log error but continue
                print(f"ML model prediction error: {e}. Will use rule-based fallback.")
                ml_model = None  # Mark as unavailable
        
        # Use rule engine for explanations and evidence (not for verdict)
        rule_result = rule_engine.analyze(url, features)
        
        # ML verdict takes precedence - it is the decision authority
        if ml_verdict is not None:
            # Use ML verdict, but keep rule engine explanations
            final_verdict = ml_verdict
            # Adjust risk level based on ML confidence
            if ml_verdict == 'PHISHING':
                final_risk = 'High'
            elif ml_verdict == 'SUSPICIOUS':
                final_risk = 'Medium' if ml_confidence >= 0.5 else 'Low'
            else:
                final_risk = 'Low'
            
            # Update explanation to reflect ML-based decision
            explanation = f"We evaluated multiple technical parameters and derived this result using combined ML analysis. "
            if ml_verdict == 'PHISHING':
                explanation += "The ML model identified multiple indicators suggesting this URL is a phishing attempt."
            elif ml_verdict == 'SUSPICIOUS':
                explanation += "The ML model detected some concerning patterns that warrant caution."
            else:
                explanation += "The ML model analysis indicates this URL appears safe based on the evaluated parameters."
        else:
            # Fallback to rule-based if ML unavailable (should not happen in production)
            final_verdict = rule_result['verdict']
            final_risk = rule_result['riskLevel']
            explanation = rule_result['explanation']
            print("Warning: ML model unavailable, using rule-based fallback")
        
        # Build final result with ML verdict and rule-based explanations
        analysis_result = {
            'verdict': final_verdict,
            'riskLevel': final_risk,
            'explanation': explanation,
            'evidence': rule_result['evidence'],
            'checkedItems': rule_result['checkedItems'],
            'identificationTips': rule_result['identificationTips'],
            'actionSteps': rule_result['actionSteps']
        }
        
        return jsonify(analysis_result), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Analysis failed: {str(e)}',
            'verdict': 'SUSPICIOUS',
            'riskLevel': 'Medium'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AtomGuard API'
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle

from feature_extractor import extract_features

app = Flask(__name__)
CORS(app)

# Load model ONCE at startup
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

@app.route("/analyze", methods=["POST"])
def analyze_url():
    data = request.get_json()

    if not data or "url" not in data:
        return jsonify({"error": "URL not provided"}), 400

    url = data["url"]

    # Feature extraction
    features = extract_features(url)

    # Prediction
    prediction = model.predict([features])[0]
    probability = model.predict_proba([features])[0][1]

    status = "Phishing" if prediction == 1 else "Legitimate"
    confidence = round(probability * 100, 2)

    # Simple explanation logic (based on features)
    reasons = []
    if features[0] > 75:
        reasons.append("URL length is unusually long")
    if features[2] == 1:
        reasons.append("Contains '@' symbol")
    if features[4] == 0:
        reasons.append("Does not use HTTPS")
    if features[6] > 1:
        reasons.append("Multiple subdomains detected")

    return jsonify({
        "url": url,
        "status": status,
        "confidence": f"{confidence}%",
        "reasons": reasons
    })

if __name__ == "__main__":
    app.run(debug=True)
