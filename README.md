# YouTube Trending Content Analysis

An end-to-end **Data Analytics project** analyzing 32,638 cleaned YouTube trending observations to identify content performance, audience engagement, category trends, and top-performing creators.

🌐 **Live Dashboard:** https://yttrendanaly-drgvrhwe.manus.space/

💻 **GitHub Repository:** https://github.com/Urvashi26singh/youtube-trending-content-analysis

---

## 📌 Project Overview

This project analyzes YouTube trending content using **Python, Pandas, MySQL, SQL, and Power BI**.

The goal is to transform raw trending-video data into actionable business insights around:

- Content category performance
- Video reach and views
- Audience engagement
- Creator/channel performance
- Monthly trending patterns
- Content strategy recommendations

The project follows an end-to-end analytics workflow:

**Data Cleaning → Database → SQL Analysis → Power BI → Business Insights**

---

## 🎯 Business Problem

YouTube creators and content teams need to understand which types of content perform well and how audience engagement differs across categories and creators.

This analysis answers questions such as:

1. Which content categories generate the highest views?
2. Which channels have strong recurring performance?
3. Which categories have higher engagement rates?
4. How does trending activity change over time?
5. What patterns can help creators improve content strategy?

---

## 🛠️ Technology Stack

| Area | Tools |
|---|---|
| Data Cleaning | Python, Pandas |
| Database | MySQL |
| Data Analysis | SQL |
| Visualization | Power BI |
| Dashboard | React, TypeScript |
| Backend | Node.js, tRPC |
| Deployment | Manus |

---

## 📊 Data Preparation

The original dataset contained **37,352 records**.

After data validation and cleaning:

| Stage | Records |
|---|---:|
| Original dataset | 37,352 |
| Invalid video IDs removed | 511 |
| Duplicate records removed | 4,194 |
| Removed/error videos | 9 |
| **Final cleaned dataset** | **32,638** |

Python and Pandas were used for data cleaning and validation before loading the cleaned data into MySQL.

---

## 🔎 Analytics Workflow

```text
Raw Dataset
     ↓
Python / Pandas
     ↓
Data Cleaning & Validation
     ↓
MySQL
     ↓
SQL Analysis
     ↓
Power BI
     ↓
Business Insights
     ↓
Recommendations
