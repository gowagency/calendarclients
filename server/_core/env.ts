export const ENV = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000"),
  databaseUrl: process.env.DATABASE_URL || "",
  awsRegion: process.env.AWS_REGION || "us-east-1",
  awsBucket: process.env.AWS_S3_BUCKET || "",
};
