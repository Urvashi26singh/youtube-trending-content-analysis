# YouTube Trending Content Analysis

An end-to-end **Data Analytics project** analyzing YouTube trending videos to identify content performance, audience engagement, category trends, and top-performing creators.

🔗 **Live Dashboard:** https://yttrendanaly-drgvrhwe.manus.space/

---

## 📌 Project Overview

This project analyzes **32,638 cleaned YouTube trending observations** to understand:

- Which content categories receive the most views
- Which channels consistently perform well
- How likes and comments relate to views
- How trending performance changes over time
- Which categories show stronger audience engagement
- What insights can help content creators improve their strategy

The project combines **Python, Pandas, MySQL, SQL, Power BI, and an interactive analytics dashboard**.

> **Note:** The analysis is observational and identifies patterns in the dataset. It does not claim that any individual factor directly causes higher performance.

---

## 🎯 Business Problem

Content creators publish large amounts of content, but not every video performs equally.

The objective of this analysis is to answer:

1. Which categories generate the most views?
2. Which channels have the strongest performance?
3. Which categories have the highest engagement?
4. How does trending activity change month by month?
5. Which videos demonstrate strong growth while trending?
6. What actionable recommendations can be derived from the data?

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
| AI Analyst | Server-side LLM + read-only fallback |
| Testing | Vitest |
| Deployment | Manus |

---

## 📊 Data Preparation

The original dataset contained **37,352 records**.

The cleaning pipeline produced **32,638 valid observations**:

| Cleaning Stage | Records |
|---|---:|
| Original dataset | 37,352 |
| Invalid video IDs removed | 511 |
| Duplicate records removed | 4,194 |
| Removed/error videos | 9 |
| **Final cleaned dataset** | **32,638** |

Python and Pandas were used for data validation and preparation.

The cleaned data was then loaded into MySQL for analysis.

---

## 🔎 Analytics Workflow

```text
Raw YouTube Dataset
        ↓
Python / Pandas
        ↓
Data Cleaning & Validation
        ↓
MySQL Database
        ↓
SQL Analysis
        ↓
Power BI / Interactive Dashboard
        ↓
Business Insights
        ↓
Content Strategy Recommendations
