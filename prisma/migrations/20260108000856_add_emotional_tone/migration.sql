-- CreateEnum
CREATE TYPE "EmotionalTone" AS ENUM ('gratitude', 'love', 'admiration', 'joy', 'caring', 'approval', 'optimism', 'pride', 'relief', 'excitement', 'amusement', 'desire', 'curiosity', 'surprise', 'realization', 'confusion', 'neutral', 'sadness', 'nervousness', 'fear', 'disappointment', 'remorse', 'embarrassment', 'grief', 'annoyance', 'disapproval', 'anger', 'disgust');

-- AlterTable
ALTER TABLE "Reflection" ADD COLUMN     "emotionalTone" "EmotionalTone";
