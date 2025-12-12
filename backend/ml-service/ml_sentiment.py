#!/usr/bin/env python3
"""
Finance-Specific Sentiment Analysis Service
Uses FinBERT model for accurate financial news sentiment analysis
"""

import sys
import json
import warnings
warnings.filterwarnings('ignore')

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification  # type: ignore
except ImportError:
    print("ERROR: Required packages not installed. Run: pip3 install transformers")
    sys.exit(1)


class FinancialSentimentAnalyzer:
    """Finance-specific sentiment analyzer using FinBERT"""
    
    def __init__(self):
        """Initialize FinBERT model"""
        try:
            print("Loading FinBERT model...")
            model_name = "ProsusAI/finbert"
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
            self.analyzer = pipeline(
                "sentiment-analysis",
                model=self.model,
                tokenizer=self.tokenizer,
                device=-1
            )
            print("FinBERT model loaded successfully")
        except Exception as e:
            print(f"Warning: Could not load FinBERT model: {e}")
            print("Sentiment analysis will use basic word matching")
            self.analyzer = None
    
    def analyze(self, text: str) -> dict:
        """
        Analyze sentiment of financial text
        
        Args:
            text: Financial news text to analyze
            
        Returns:
            dict with sentiment, score, and confidence
        """
        if not text or len(text.strip()) == 0:
            return {
                'sentiment': 'NEUTRAL',
                'score': 0.0,
                'confidence': 0.0,
                'model': 'none'
            }
        
        if self.analyzer is None:
            # Fallback to basic word matching
            return self._basic_sentiment(text)
        
        try:
            text = text[:512]
            result = self.analyzer(text)[0]
            
            label = result['label'].upper()
            confidence = result['score']
            
            sentiment = label if label in ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] else 'NEUTRAL'
            
            if sentiment == 'POSITIVE':
                score = confidence
            elif sentiment == 'NEGATIVE':
                score = -confidence
            else:
                score = 0.0
            
            return {
                'sentiment': sentiment,
                'score': round(score, 3),
                'confidence': round(confidence, 3),
                'model': 'finbert'
            }
            
        except Exception as e:
            print(f"Error analyzing sentiment: {e}")
            return self._basic_sentiment(text)
    
    def _basic_sentiment(self, text: str) -> dict:
        """Fallback basic sentiment analysis"""
        text_lower = text.lower()
        
        positive_words = ['rise', 'gain', 'profit', 'growth', 'up', 'increase', 'bull', 'surge']
        negative_words = ['fall', 'loss', 'decline', 'down', 'decrease', 'bear', 'drop', 'crash']
        
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count > neg_count:
            sentiment = 'POSITIVE'
            score = 0.6
        elif neg_count > pos_count:
            sentiment = 'NEGATIVE'
            score = -0.6
        else:
            sentiment = 'NEUTRAL'
            score = 0.0
        
        return {
            'sentiment': sentiment,
            'score': score,
            'confidence': 0.5,
            'model': 'basic'
        }
    
    def batch_analyze(self, texts: list) -> list:
        """Analyze multiple texts at once"""
        return [self.analyze(text) for text in texts]


def main():
    """Main entry point for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python3 ml_sentiment.py <text>")
        print("Example: python3 ml_sentiment.py 'EUR/USD expected to rise'")
        sys.exit(1)
    
    text = sys.argv[1]
    
    # Initialize analyzer
    analyzer = FinancialSentimentAnalyzer()
    
    # Analyze text
    result = analyzer.analyze(text)
    
    # Output as JSON
    print("=== RESULT ===")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
