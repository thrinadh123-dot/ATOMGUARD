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
        
        # Apply rule-based engine (primary method)
        analysis_result = rule_engine.analyze(url, features)
        
        # Optional: Enhance with ML model if available
        # ML model can adjust confidence or provide additional insights
        if ml_model is not None:
            try:
                # Get feature names and prepare feature vector for model
                feature_names = feature_extractor.get_feature_names()
                feature_vector = [features.get(name, 0.0) for name in feature_names]
                
                # Get ML prediction (assumes model.predict() or model.predict_proba() exists)
                # This is a placeholder - adjust based on your actual model interface
                if hasattr(ml_model, 'predict_proba'):
                    ml_prediction = ml_model.predict_proba([feature_vector])[0]
                    # If ML suggests phishing with high confidence, enhance the rule-based result
                    if len(ml_prediction) > 1 and ml_prediction[1] > 0.7:  # phishing probability > 70%
                        if analysis_result['verdict'] == 'SAFE':
                            analysis_result['verdict'] = 'SUSPICIOUS'
                            analysis_result['riskLevel'] = 'Medium'
                        elif analysis_result['riskLevel'] == 'Low':
                            analysis_result['riskLevel'] = 'Medium'
                elif hasattr(ml_model, 'predict'):
                    ml_prediction = ml_model.predict([feature_vector])[0]
                    # Adjust based on model output format
            except Exception as e:
                # If ML model fails, continue with rule-based result
                print(f"ML model prediction error: {e}. Using rule-based result only.")
        
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

