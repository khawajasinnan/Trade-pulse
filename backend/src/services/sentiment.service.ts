import Sentiment from 'sentiment';

const sentiment = new Sentiment();

/**
 * Analyze sentiment using ML model (FinBERT) with fallback
 */
export const analyzeSentiment = async (
    text: string
): Promise<{
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    score: number;
    confidence: number;
    model: string;
}> => {
    // Use basic sentiment analyzer only (no ML Python execution)
    return analyzeSentimentBasic(text);
};

/**
 * Basic sentiment analysis (fallback)
 */
export const analyzeSentimentBasic = (
    text: string
): {
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    score: number;
    confidence: number;
    model: string;
} => {
    const result = sentiment.analyze(text);

    // Normalize score to -1 to 1 range
    const normalizedScore = Math.max(-1, Math.min(1, result.comparative));

    // Classify sentiment
    let sentimentClass: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

    if (result.score > 0) {
        sentimentClass = 'POSITIVE';
    } else if (result.score < 0) {
        sentimentClass = 'NEGATIVE';
    } else {
        sentimentClass = 'NEUTRAL';
    }

    return {
        sentiment: sentimentClass,
        score: normalizedScore,
        confidence: 0.5,
        model: 'basic',
    };
};

/**
 * Batch analyze multiple texts
 */
export const batchAnalyzeSentiment = async (
    texts: string[]
): Promise<Array<{
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    score: number;
    confidence: number;
    model: string;
}>> => {
    return Promise.all(texts.map((text) => analyzeSentiment(text)));
};

/**
 * Get sentiment color for UI
 */
export const getSentimentColor = (
    sentimentType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
): string => {
    switch (sentimentType) {
        case 'POSITIVE':
            return 'green';
        case 'NEGATIVE':
            return 'red';
        case 'NEUTRAL':
            return 'gray';
        default:
            return 'gray';
    }
};
