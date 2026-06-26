import swaggerJSDoc from "swagger-jsdoc";
import type { OAS3Definition } from "swagger-jsdoc";

const swaggerDefinition: OAS3Definition = {
  openapi: "3.0.0",
  info: {
    title: "English Read API",
    version: "1.0.0",
    description: "英文学习平台后端 API 文档",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "开发环境",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          code: { type: "integer", example: 40001 },
          message: { type: "string", example: "参数校验失败" },
          data: { type: "object", nullable: true },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          username: { type: "string" },
          email: { type: "string" },
          created_at: { type: "string" },
        },
      },
      WordBook: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          level: { type: "string" },
          word_count: { type: "integer" },
          description: { type: "string" },
        },
      },
      Word: {
        type: "object",
        properties: {
          id: { type: "integer" },
          word: { type: "string" },
          phonetic: { type: "string" },
          translation: { type: "string" },
          example_sentence: { type: "string" },
          difficulty: { type: "integer" },
        },
      },
      ArticleListItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          summary: { type: "string" },
          level: { type: "string" },
          category: { type: "string" },
          source: { type: "string" },
          created_at: { type: "string" },
        },
      },
      ArticleDetail: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          content: { type: "string" },
          level: { type: "string" },
          category: { type: "string" },
          questions: { type: "array" },
          article_words: { type: "array" },
          created_at: { type: "string" },
          user_progress: { type: "object", nullable: true },
        },
      },
      StatsOverview: {
        type: "object",
        properties: {
          total_words_learned: { type: "integer" },
          total_articles_read: { type: "integer" },
          avg_quiz_score: { type: "integer" },
          weekly_study_minutes: { type: "integer" },
        },
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
