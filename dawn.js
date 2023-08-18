const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs").promises;

const func = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://www.dawn.com/newspaper", {
    waitUntil: "domcontentloaded",
  });

  const content = await page.content();

  const $ = cheerio.load(content);
  const storiesLink = $(".story__link");
  const storiesLinksArray = [];
  storiesLink.each((i, el) => {
    storiesLinksArray.push($(el).attr("href"));
  });

  const newsData = [];

  for (let i = 0; i < storiesLinksArray.length; i++) {
    await page.goto(storiesLinksArray[i], { waitUntil: "domcontentloaded" });
    const linkPageContent = await page.content();
    newsData.push(extractNews(linkPageContent));
  }

  browser.close();

  // Save newsData to a JSON file
  try {
    await fs.writeFile("newsData.json", JSON.stringify(newsData, null, 2));
    console.log("News data saved to newsData.json");
  } catch (error) {
    console.error("Error saving news data:", error);
  }
};

const extractNews = (content) => {
  const news = {
    heading: "",
    description: "",
    date: "",
  };
  const $ = cheerio.load(content);
  const heading = $("div.template__header h2.story__title").text();
  const dateTime = $("span.timestamp--date").text();
  const description = $("div.story__content").text();

  news["date"] = dateTime;
  news["description"] = description;
  news["heading"] = heading;

  return news;
};

func();
