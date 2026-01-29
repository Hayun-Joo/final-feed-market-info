import { getBrowser } from '../utils/screenshot';
import type { Page } from 'puppeteer';

export interface BunkerData {
  chartImageBase64: string;
  vlsfoPrice?: string;
  wtiPrice?: string;
}

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function scrapeBunkerPrices(): Promise<BunkerData> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  let chartImage = '';

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Loading Ship & Bunker...');
    await page.goto('https://shipandbunker.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await waitFor(5000);

    // Top Bunker Prices 섹션 찾기
    console.log('Looking for Top Bunker Prices...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent?.includes('Top Bunker Prices')) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
    });

    await waitFor(2000);

    // Global 20 Ports Average 클릭 또는 드롭다운 찾기
    console.log('Looking for port selector...');
    const portClicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        const text = el.textContent;
        if (text?.includes('Global 20 Ports') || text?.includes('Select Port')) {
          (el as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (portClicked) {
      console.log('Port selector clicked');
      await waitFor(2000);
    }

    // Singapore 선택
    console.log('Selecting Singapore...');
    await page.evaluate(() => {
      // Select 요소 찾기
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        const options = Array.from(select.options);
        const singaporeOption = options.find(
          (opt) => opt.text.includes('Singapore') || opt.value.toLowerCase().includes('singapore')
        );
        if (singaporeOption) {
          select.value = singaporeOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }

      // 링크나 버튼으로 Singapore 찾기
      const elements = Array.from(document.querySelectorAll('a, button, div, li, option'));
      for (const el of elements) {
        if (el.textContent?.trim() === 'Singapore') {
          (el as HTMLElement).click();
          return;
        }
      }
    });

    await waitFor(3000);

    // Add More Ports/Grades 찾기
    console.log('Looking for Add More Ports/Grades...');
    const addMoreClicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent?.includes('Add More Ports/Grades') || el.textContent?.includes('Add More')) {
          (el as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (addMoreClicked) {
      console.log('Add More clicked');
      await waitFor(2000);
    }

    // WTI 선택
    console.log('Selecting WTI...');
    await page.evaluate(() => {
      // Select 드롭다운에서 WTI 찾기
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        const options = Array.from(select.options);
        const wtiOption = options.find((opt) => opt.text.includes('WTI') || opt.value.toLowerCase().includes('wti'));
        if (wtiOption) {
          select.value = wtiOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }

      // 옵션 목록에서 WTI 찾기
      const elements = Array.from(document.querySelectorAll('option, li, div'));
      for (const el of elements) {
        if (el.textContent?.trim() === 'WTI') {
          (el as HTMLElement).click();
          return;
        }
      }
    });

    await waitFor(2000);

    // Add to graph 버튼 클릭
    console.log('Looking for add to graph button...');
    const addToGraphClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('add to graph')) {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (addToGraphClicked) {
      console.log('Add to graph clicked');
      await waitFor(4000); // 그래프 로딩 대기
    }

    // 차트 영역으로 스크롤
    console.log('Scrolling to chart...');
    await page.evaluate(() => {
      const charts = Array.from(document.querySelectorAll('canvas, svg, [class*="chart"], [class*="graph"]'));
      if (charts.length > 0) {
        charts[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    await waitFor(2000);

    // 스크린샷
    console.log('Taking screenshot...');
    const screenshot = (await page.screenshot({
      encoding: 'binary',
      fullPage: false,
    })) as Buffer;

    chartImage = screenshot.toString('base64');

  } catch (error) {
    console.error('Bunker scraping error:', error);
  } finally {
    await page.close();
  }

  return {
    chartImageBase64: chartImage,
    vlsfoPrice: 'N/A',
    wtiPrice: 'N/A',
  };
}
