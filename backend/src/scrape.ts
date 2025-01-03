import { v4 as uuidv4 } from "uuid";
import { Builder, By, until, WebDriver, WebElement } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import connectDB from "./db";
import { Trend } from "./model";


async function waitForElement(
  driver: WebDriver,
  selector: string,
  timeout = 10000
) {
  try {
    await driver.wait(until.elementLocated(By.css(selector)), timeout);
    const element = await driver.findElement(By.css(selector));
    await driver.wait(until.elementIsVisible(element), timeout);
    return element;
  } catch (error) {
    console.error(`Failed to find element with selector: ${selector}`);
    throw error;
  }
}
async function extractTrendingTopic(trendElement: WebElement): Promise<string> {
  try {
    const textElements = await trendElement.findElements(By.css('[dir="ltr"]'));
    for (const element of textElements) {
      const text = await element.getText();

      if (
        text.trim() &&
        !text.includes("Trending") &&
        !text.includes("Entertainment") &&
        !text.includes("Sports") &&
        !text.includes("News") &&
        !text.includes("posts")
      ) {
        return text.trim();
      }
    }
    return "Failed to extract trend";
  } catch (error) {
    console.error("Error extracting trend:", error);
    return "Failed to extract trend";
  }
}
export async function scrapeTrends() {
  let driver: WebDriver | null = null;

  try {
    await connectDB();
    
    const options = new chrome.Options();
    options.addArguments(
      "--headless", // Run in headless mode
      "--disable-gpu", // Disable GPU rendering
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-notifications",
      "--ignore-certificate-errors",
      "--disable-blink-features=AutomationControlled",
      "--disable-extensions",
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

   
    await driver.manage().setTimeouts({
      implicit: 30000, 
      pageLoad: 50000,
    });

    console.log("Navigating to Twitter login page...");
    await driver.get("https://x.com/i/flow/login");

    await driver.wait(until.titleContains("X"), 20000);

    console.log("Waiting for login form...");
    await driver.sleep(2000);
    const usernameInput = await waitForElement(
      driver,
      'input[autocomplete="username"]'
    );
    await usernameInput.clear();
    await usernameInput.sendKeys(process.env.TWITTER_USERNAME as string);

    console.log("Clicking next after username...");
    const nextButtons = await driver.findElements(By.css('[role="button"]'));
    for (const button of nextButtons) {
      const text = await button.getText();
      if (text.toLowerCase() === "next") {
        await button.click();
        break;
      }
    }

    console.log("Checking for verification step...");
    await driver.sleep(2000);
    try {
      const verificationInput = await driver.wait(
        until.elementLocated(
          By.css('input[placeholder*="phone" i], input[placeholder*="email" i], [name="text"]')
        ),
        5000
      );
      
      if (verificationInput) {
        console.log("Phone/Email verification page detected");
        await verificationInput.clear();
        await verificationInput.sendKeys(process.env.TWITTER_PHONE as string);

        
        const verifyNextButtons = await driver.findElements(
          By.css('[role="button"]')
        );
        for (const button of verifyNextButtons) {
          try {
            const text = await button.getText();
            if (text.toLowerCase() === "next") {
              await driver.wait(until.elementIsEnabled(button), 5000);
              await button.click();
              console.log("Clicked next after entering phone/email");
              break;
            }
          } catch (err) {
            continue;
          }
        }
        await driver.sleep(3000);
      }
    } catch (error) {
      console.log("No verification step found, proceeding to password...");
    }

    console.log("Entering password...");
    await driver.sleep(2000); 
    
    const passwordInput = await driver.wait(
      until.elementLocated(By.css('input[name="password"]')),
      50000, 
      "Password field not found"
    );
    await passwordInput.clear();
    await passwordInput.sendKeys(process.env.TWITTER_PASSWORD as string);

    console.log("Logging in...");
    const loginButtons = await driver.findElements(By.css('[role="button"]'));
    for (const button of loginButtons) {
      const text = await button.getText();
      if (text.toLowerCase().includes("log in")) {
        await button.click();
        break;
      }
    }

    console.log("Waiting for home page...");
    await driver.sleep(3000);

    console.log("Waiting for trends section...");
    await driver.wait(
      until.elementLocated(By.css('[data-testid="trend"]')),
      20000
    );

    console.log("Fetching trends...");
    const trends = await driver.findElements(By.css('[data-testid="trend"]'));
    const trendTexts = await Promise.all(
      trends.slice(0, 5).map(async (trend) => {
        return await extractTrendingTopic(trend);
      })
    );

    console.log("Getting IP address...");
    const ipResponse = await fetch("https://api.ipify.org?format=json");
    const { ip } = await ipResponse.json();

    const scrapeId = uuidv4();
    const trend = new Trend({
      scrapeId,
      trend1: trendTexts[0] || "N/A",
      trend2: trendTexts[1] || "N/A",
      trend3: trendTexts[2] || "N/A",
      trend4: trendTexts[3] || "N/A",
      trend5: trendTexts[4] || "N/A",
      timestamp: new Date(),
      ipAddress: ip,
    });

    await trend.save();

    return {
      success: true,
      data: trend,
    };
  } catch (error) {
    console.error("Scraping error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to scrape trends",
    };
  } finally {
    if (driver) {
      console.log("Closing browser...");
      await driver.quit();
    }
  }
}
