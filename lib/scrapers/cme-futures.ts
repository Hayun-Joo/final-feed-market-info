import { getBrowser } from '../utils/screenshot';
import type { Page } from 'puppeteer';

export interface FuturesPriceData {
  symbol: string;
  price: string;
  unit: string;
  chartImageBase64: string;
}

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeFuturesChart(url: string, symbol: string): Promise<FuturesPriceData> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  let extractedPrice = 'N/A';
  let chartImage = '';

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitFor(5000);

    // 1. QUOTES 탭 클릭
    console.log('Clicking QUOTES tab...');
    const quotesClicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button, [role="tab"]'));
      for (const el of elements) {
        const text = el.textContent?.trim().toUpperCase();
        if (text === 'QUOTES' || text?.includes('QUOTE')) {
          (el as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (quotesClicked) {
      console.log('QUOTES clicked, waiting...');
      await waitFor(4000);
    }

    // 2. 스크롤 다운
    await page.evaluate(() => window.scrollBy(0, 500));
    await waitFor(2000);

    // 3. 첫 번째 CHART 버튼 찾아서 클릭 (새 창으로 열릴 수 있음)
    console.log('Looking for CHART button...');

    // 새 창 감지 준비
    const newPagePromise = new Promise<Page>(resolve => {
      browser.once('targetcreated', async (target) => {
        const newPage = await target.page();
        if (newPage) resolve(newPage);
      });
    });

    const chartClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a, button'));
      for (const btn of buttons) {
        if (btn.textContent?.toUpperCase().includes('CHART')) {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    let chartPage = page;

    if (chartClicked) {
      console.log('CHART button clicked');

      // 새 창이 열렸는지 확인 (5초 대기)
      try {
        chartPage = await Promise.race([
          newPagePromise,
          new Promise<Page>((_, reject) => setTimeout(() => reject('timeout'), 5000))
        ]).catch(() => page);

        if (chartPage !== page) {
          console.log('Chart opened in new window');
          await waitFor(5000); // 차트 로딩 대기
        } else {
          await waitFor(5000);
        }
      } catch {
        await waitFor(5000);
      }
    }

    // 4. 1D 버튼 클릭
    console.log('Changing to 1D...');
    const dayButtonClicked = await chartPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], div, span'));
      for (const btn of buttons) {
        const text = btn.textContent?.trim();
        if (text === '1D' || text === 'D' || text === '1d') {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (dayButtonClicked) {
      console.log('1D clicked');
      await waitFor(3000);
    }

    // 5. 가격 추출
    console.log('Extracting price...');
    const priceData = await chartPage.evaluate(() => {
      const bodyText = document.body.innerText;

      // 패턴 매칭
      const patterns = [
        /C\s*(\d{3,4}['`]?\d{2,3})/,  // C10714 형태
        /Last[:\s]+(\d+['`]?\d*\.?\d+)/i,
        /(\d{3,4}['`]\d{2,3}\.?\d*)/,
      ];

      for (const pattern of patterns) {
        const match = bodyText.match(pattern);
        if (match) {
          return match[1];
        }
      }
      return null;
    });

    if (priceData) {
      extractedPrice = priceData;
      console.log('Price extracted:', extractedPrice);
    }

    // 6. 스크린샷
    console.log('Taking screenshot...');
    const screenshot = (await chartPage.screenshot({
      encoding: 'binary',
      fullPage: false,
    })) as Buffer;

    chartImage = screenshot.toString('base64');

    // 새 창이었다면 닫기
    if (chartPage !== page) {
      await chartPage.close();
    }

  } catch (error) {
    console.error('Scraping error:', error);
  } finally {
    await page.close();
  }

  return {
    symbol,
    price: extractedPrice,
    unit: 'c/bu',
    chartImageBase64: chartImage,
  };
}

export async function scrapeSoybeanFutures(): Promise<FuturesPriceData> {
  return await scrapeFuturesChart(
    'https://www.cmegroup.com/markets/agriculture/oilseeds/soybean.html',
    'ZS'
  );
}

export async function scrapeCornFutures(): Promise<FuturesPriceData> {
  return await scrapeFuturesChart(
    'https://www.cmegroup.com/markets/agriculture/grains/corn.html',
    'ZC'
  );
}

export async function scrapeWheatFutures(): Promise<FuturesPriceData> {
  return await scrapeFuturesChart(
    'https://www.cmegroup.com/markets/agriculture/grains/wheat.html',
    'ZW'
  );
}
