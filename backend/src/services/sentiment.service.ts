import Sentiment from 'sentiment';

const sentiment = new Sentiment();

/**
 * Analyze sentiment of text
 */
export const analyzeSentiment = (
    text: string
): {
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    score: number;
    comparative: number;
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
        comparative: result.comparative,
    };
};

/**
 * Batch analyze multiple texts
 */
export const batchAnalyzeSentiment = (
    texts: string[]
): Array<{
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    score: number;
    comparative: number;
}> => {
    return texts.map((text) => analyzeSentiment(text));
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
