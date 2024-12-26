import express from "express";
import mongoose from "mongoose";
import { scrapeTrends } from "./scrape";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import connectDB from "./db";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cors());
connectDB();

app.get("/health", (req, res) => {
  res.send("healthy server");
});

app.post("/scrape", async (req, res) => {
  try {
    console.log("Scraping trends...");
    const scrapeData = await scrapeTrends();
    console.log("Scrape complete.");
    res.status(200).json({
      success: true,
      data: scrapeData,
    });
  } catch (err) {
    console.error("Error running scraper:", err);
    res.status(500).send("Error running scraper.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
