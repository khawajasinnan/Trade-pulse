"""
Trade-Pulse ML Prediction Service
LSTM-based forex price prediction using TensorFlow/Keras
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
import warnings
warnings.filterwarnings('ignore')

# Configuration
SEQUENCE_LENGTH = 7  # Use 7 days to predict next day
EPOCHS = 50
BATCH_SIZE = 32
VALIDATION_SPLIT = 0.2
MODEL_VERSION = "1.0.0"

class ForexPredictor:
    def __init__(self, database_url):
        """Initialize the predictor with database connection"""
        self.database_url = database_url
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.model = None
        
    def connect_db(self):
        """Create database connection"""
        return psycopg2.connect(self.database_url)
    
    def fetch_historical_data(self, currency_pair, days=90):
        """Fetch historical data from database"""
        conn = self.connect_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        query = """
            SELECT currency_pair, open, high, low, close, volume, date
            FROM historical_data
            WHERE currency_pair = %s
            AND date >= %s
            AND date <= %s
            ORDER BY date ASC
        """
        
        cursor.execute(query, (currency_pair, start_date, end_date))
        data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if len(data) < 30:
            raise ValueError(f"Insufficient data for {currency_pair}. Need at least 30 days, got {len(data)}")
        
        return pd.DataFrame(data)
    
    def prepare_data(self, df):
        """Prepare data for LSTM training"""
        # Use closing prices
        prices = df['close'].values.reshape(-1, 1)
        
        # Normalize data
        scaled_data = self.scaler.fit_transform(prices)
        
        # Create sequences
        X, y = [], []
        for i in range(SEQUENCE_LENGTH, len(scaled_data)):
            X.append(scaled_data[i-SEQUENCE_LENGTH:i, 0])
            y.append(scaled_data[i, 0])
        
        X, y = np.array(X), np.array(y)
        
        # Reshape for LSTM [samples, time steps, features]
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))
        
        return X, y, scaled_data
    
    def build_model(self):
        """Build LSTM model"""
        model = Sequential([
            LSTM(units=50, return_sequences=True, input_shape=(SEQUENCE_LENGTH, 1)),
            Dropout(0.2),
            LSTM(units=50, return_sequences=False),
            Dropout(0.2),
            Dense(units=1)
        ])
        
        model.compile(
            optimizer='adam',
            loss='mean_squared_error',
            metrics=['mae']
        )
        
        return model
    
    def train(self, X, y):
        """Train the model"""
        self.model = self.build_model()
        
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        history = self.model.fit(
            X, y,
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            validation_split=VALIDATION_SPLIT,
            callbacks=[early_stopping],
            verbose=0
        )
        
        return history
    
    def predict(self, last_sequence):
        """Make prediction"""
        # Reshape for prediction
        last_sequence = np.reshape(last_sequence, (1, SEQUENCE_LENGTH, 1))
        
        # Predict
        prediction_scaled = self.model.predict(last_sequence, verbose=0)
        
        # Inverse transform to get actual price
        prediction = self.scaler.inverse_transform(prediction_scaled)
        
        return prediction[0][0]
    
    def calculate_direction_and_confidence(self, predicted_price, current_price):
        """Calculate prediction direction and confidence"""
        price_diff = predicted_price - current_price
        percent_change = (price_diff / current_price) * 100
        
        # Determine direction
        if percent_change > 0.5:
            direction = 'UP'
            recommendation = 'BUY'
        elif percent_change < -0.5:
            direction = 'DOWN'
            recommendation = 'SELL'
        else:
            direction = 'NEUTRAL'
            recommendation = 'HOLD'
        
        # Calculate confidence (0-1) based on magnitude
        confidence = min(0.95, max(0.5, 1 - abs(percent_change) / 10))
        
        return direction, recommendation, confidence
    
    def save_prediction(self, currency_pair, predicted_value, direction, confidence):
        """Save prediction to database"""
        conn = self.connect_db()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO predictions (currency_pair, predicted_value, direction, confidence, model_version, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        cursor.execute(query, (
            currency_pair,
            float(predicted_value),
            direction,
            float(confidence),
            MODEL_VERSION,
            datetime.now()
        ))
        
        prediction_id = cursor.fetchone()[0]
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return prediction_id
    
    def run_prediction(self, currency_pair):
        """Complete prediction pipeline"""
        print(f"Starting prediction for {currency_pair}...")
        
        # Fetch data
        print("Fetching historical data...")
        df = self.fetch_historical_data(currency_pair)
        
        # Prepare data
        print("Preparing data...")
        X, y, scaled_data = self.prepare_data(df)
        
        # Train model
        print(f"Training model on {len(X)} samples...")
        history = self.train(X, y)
        
        # Get last sequence for prediction
        last_sequence = scaled_data[-SEQUENCE_LENGTH:]
        
        # Make prediction
        print("Generating prediction...")
        predicted_price = self.predict(last_sequence)
        
        # Get current price
        current_price = df['close'].iloc[-1]
        
        # Calculate direction and confidence
        direction, recommendation, confidence = self.calculate_direction_and_confidence(
            predicted_price, current_price
        )
        
        # Save to database
        print("Saving prediction...")
        prediction_id = self.save_prediction(
            currency_pair,
            predicted_price,
            direction,
            confidence
        )
        
        result = {
            'id': prediction_id,
            'currency_pair': currency_pair,
            'current_price': float(current_price),
            'predicted_value': float(predicted_price),
            'direction': direction,
            'recommendation': recommendation,
            'confidence': float(confidence),
            'model_version': MODEL_VERSION,
            'training_samples': len(X),
            'final_loss': float(history.history['loss'][-1]),
            'final_val_loss': float(history.history['val_loss'][-1])
        }
        
        print(f"Prediction complete!")
        print(f"Current: ${current_price:.4f}")
        print(f"Predicted: ${predicted_price:.4f}")
        print(f"Direction: {direction}")
        print(f"Recommendation: {recommendation}")
        print(f"Confidence: {confidence:.2%}")
        
        return result


def main():
    """Main entry point"""
    if len(sys.argv) < 3:
        print("Usage: python ml_prediction.py <DATABASE_URL> <CURRENCY_PAIR>")
        sys.exit(1)
    
    database_url = sys.argv[1]
    currency_pair = sys.argv[2]
    
    try:
        predictor = ForexPredictor(database_url)
        result = predictor.run_prediction(currency_pair)
        
        # Output JSON result
        print("\n=== RESULT ===")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
