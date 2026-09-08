export const portfolioFacts = {
  projectTitle: "YouTube Trending Content Analysis",
  projectDescription: "An end-to-end data analytics project analyzing trending YouTube videos using Python, SQL, MySQL and Power BI to uncover content performance, engagement and trending patterns.",
  rawRecords: 37352,
  invalidIdsRemoved: 511,
  duplicatesRemoved: 4194,
  removedOrErrorVideos: 9,
  cleanedRecords: 32638,
  datasetFilename: "youtube_trending_cleaned.csv",
  sourceUrl: "https://github.com/lychengrex/Data-Analysis-of-Trending-Youtube-Videos",
  sourceLabel: "Cleaned YouTube Trending dataset",
  technologies: ["Python", "Pandas", "SQL", "MySQL", "Power BI", "DAX", "Git/GitHub"],
} as const;

export const businessQuestions = [
  "What categories receive the most views?",
  "Which channels generate the highest views?",
  "Which categories have the highest engagement?",
  "How does performance change month to month?",
  "Which videos or channels show strong trending performance?",
  "What patterns can help creators improve content strategy?",
] as const;

export const limitations = [
  "The dataset covers a historical period rather than current YouTube activity.",
  "Trending videos represent YouTube’s trending selection, not every video uploaded.",
  "Videos can appear across multiple trending observations.",
  "Historical trends may not represent today’s YouTube recommendation algorithm.",
  "Observational relationships should not automatically be interpreted as causation.",
] as const;
