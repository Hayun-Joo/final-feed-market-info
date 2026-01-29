import { getBrowser } from '../utils/screenshot';
import type { Page } from 'puppeteer';

export interface EthanolData {
  productionImageBase64: string;
  stocksImageBase64: string;
}

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureEthanolGraph(graphName: string): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  let imageBase64 = '';

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`Loading corn reports page for ${graphName}...`);
    await page.goto('https://www.cmegroup.com/trading/agricultural/corn-reports.html', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await waitFor(5000);

    // Demand Charts 섹션 찾기
    console.log('Scrolling to Demand Charts...');
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3, h4, div, span'));
      for (const heading of headings) {
        if (heading.textContent?.includes('Demand Charts')) {
          heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    });

    await waitFor(3000);

    // 그래프 링크 클릭 (새 창 또는 팝업으로 열릴 수 있음)
    console.log(`Looking for ${graphName} link...`);

    const graphClicked = await page.evaluate((name) => {
      const links = Array.from(document.querySelectorAll('a, button, div'));
      for (const link of links) {
        if (link.textContent?.includes(name)) {
          (link as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, graphName);

    if (graphClicked) {
      console.log(`${graphName} clicked`);
      await waitFor(5000); // 그래프 로딩 대기
    }

    // 그래프 이미지가 페이지에 나타났는지 확인
    console.log('Looking for graph image...');
    await page.waitForSelector('img', { timeout: 10000 }).catch(() => {
      console.log('No image found with selector');
    });

    // 그래프 영역으로 스크롤
    await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      for (const img of images) {
        if (
          img.src.toLowerCase().includes('ethanol') ||
          img.alt?.toLowerCase().includes('ethanol') ||
          img.src.toLowerCase().includes('chart') ||
          img.src.toLowerCase().includes('graph')
        ) {
          img.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      // 이미지를 못 찾았다면 첫 번째 이미지로 스크롤
      if (images.length > 0) {
        images[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    await waitFor(2000);

    // 스크린샷
    console.log('Taking screenshot...');
    const screenshot = (await page.screenshot({
      encoding: 'binary',
      fullPage: false,
    })) as Buffer;

    imageBase64 = screenshot.toString('base64');

  } catch (error) {
    console.error(`Ethanol ${graphName} scraping error:`, error);
  } finally {
    await page.close();
  }

  return imageBase64;
}

export async function scrapeEthanolData(): Promise<EthanolData> {
  console.log('Starting ethanol data scraping...');

  const productionImage = await captureEthanolGraph('US Ethanol Production');
  const stocksImage = await captureEthanolGraph('US Ethanol Stocks');

  return {
    productionImageBase64: productionImage,
    stocksImageBase64: stocksImage,
  };
}
