import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { addOilChartAnnotations } from './image-processor';

// Stealth plugin 적용
puppeteer.use(StealthPlugin());

export interface ScrapeResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper function to wait (replaces deprecated page.waitForTimeout)
async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Puppeteer 브라우저 인스턴스 생성 (Stealth mode + Vercel 지원)
export async function createBrowser(): Promise<Browser> {
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isVercel) {
    // Vercel/Serverless 환경
    const chromium = await import('@sparticuz/chromium');
    const puppeteerCore = await import('puppeteer-core');

    const browser = await puppeteerCore.default.launch({
      args: [
        ...chromium.default.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
      ],
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless,
    });

    return browser;
  } else {
    // 로컬 환경
    const browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 240000, // 4분
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    return browser;
  }
}

// 선물 차트 캡처 (CME Group - 직접 차트 URL)
export async function scrapeFuturesChart(
  chartUrl: string,
  symbol: string
): Promise<ScrapeResult> {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    // Viewport 설정
    await page.setViewport({ width: 1920, height: 1080 });

    // Step 1: URL 파라미터를 1day로 직접 변경
    console.log(`[${symbol}] Step 1: Modifying URL to set 1day interval...`);
    let modifiedUrl = chartUrl;
    if (chartUrl.includes('interval=1')) {
      modifiedUrl = chartUrl.replace('interval=1', 'interval=D');
      console.log(`[${symbol}] URL modified to: ${modifiedUrl}`);
    }

    console.log(`[${symbol}] Loading chart page with 1day interval...`);
    await page.goto(modifiedUrl, {
      waitUntil: 'networkidle2',
      timeout: 180000, // 3분
    });
    console.log(`[${symbol}] Page loaded, initial wait...`);
    await wait(10000); // 초기 로딩 10초 대기

    // Step 2: 추가로 1D 버튼 찾아서 클릭 시도 (이중 확인)
    console.log(`[${symbol}] Step 2: Double-checking 1day timeframe...`);
    const dayConfirmed = await page.evaluate(() => {
      // 1D 버튼 찾기
      const allElements = Array.from(document.querySelectorAll('button, div[role="button"], span, a, input, select option'));

      const dayButton = allElements.find((el) => {
        const text = el.textContent?.trim();
        return text === '1D' || text === 'D' || text === '1 Day' || text === '1day' || text === '1d' || text === 'Daily';
      });

      if (dayButton && dayButton.tagName !== 'OPTION') {
        (dayButton as HTMLElement).click();
        return true;
      }

      // Select 드롭다운
      const selects = document.querySelectorAll('select');
      for (const select of Array.from(selects)) {
        const options = Array.from(select.options);
        const dayOption = options.find((opt) =>
          opt.textContent?.includes('1D') ||
          opt.textContent?.includes('Daily') ||
          opt.value === 'D' ||
          opt.value === '1D'
        );
        if (dayOption && select.value !== dayOption.value) {
          select.value = dayOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }

      return false;
    });

    if (dayConfirmed) {
      console.log(`[${symbol}] 1day timeframe confirmed and set`);
      await wait(8000); // 차트 리로딩 8초 대기
    } else {
      console.log(`[${symbol}] 1day already set or button not found`);
      await wait(5000);
    }

    // Step 3: 차트 완전 로딩 대기 (Canvas 렌더링 확인)
    console.log(`[${symbol}] Step 3: Waiting for chart to fully render...`);
    await page.waitForSelector('canvas, svg', { timeout: 20000 }).catch(() => {
      console.log(`[${symbol}] Warning: Chart element not found`);
    });

    // Canvas가 실제로 렌더링되었는지 확인 (최대 30초 대기)
    let chartRendered = false;
    for (let i = 0; i < 15; i++) {
      chartRendered = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;

        // Canvas가 비어있지 않은지 확인
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // 픽셀 중 일부라도 그려져 있는지 확인
        for (let i = 0; i < pixels.length; i += 4) {
          const alpha = pixels[i + 3];
          if (alpha > 0) return true; // 불투명한 픽셀이 있으면 렌더링됨
        }
        return false;
      });

      if (chartRendered) {
        console.log(`[${symbol}] Chart rendered successfully after ${(i + 1) * 2} seconds`);
        break;
      }

      console.log(`[${symbol}] Chart not yet rendered, waiting... (${i + 1}/15)`);
      await wait(2000);
    }

    if (!chartRendered) {
      console.log(`[${symbol}] Warning: Chart may not be fully rendered, capturing anyway...`);
    }

    await wait(3000); // 최종 안정화 대기

    // Step 4: 차트 캡처
    console.log(`[${symbol}] Step 4: Capturing chart...`);
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: true,
    });
    const imageBase64 = screenshot as string;

    console.log(`[${symbol}] Capture complete - image size: ${imageBase64.length} bytes`);

    await browser.close();

    return {
      success: true,
      data: {
        symbol,
        currentPrice: 'N/A',
        priceUnit: 'c/bu',
        contract: 'Mar 2026',
        imageBase64,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error(`[${symbol}] Error closing browser:`, e);
      }
    }
    console.error(`[${symbol}] Scraping error:`, error);
    console.error(`[${symbol}] Error stack:`, error instanceof Error ? error.stack : 'N/A');
    return {
      success: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : '알 수 없는 오류',
    };
  }
}

// 에탄올 그래프 캡처 (CME Group)
// Stock: 직접 GIF URL에서 다운로드
// Production: corn-reports 페이지에서 이미지 다운로드
export async function scrapeEthanolCharts(): Promise<ScrapeResult> {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    // Stock 이미지: 직접 GIF URL에서 다운로드
    console.log('[Ethanol] Downloading Stocks GIF...');
    const stocksUrl = 'https://www.cmegroup.com/trading/agricultural/files/ht_charts/hu_ethanolstk.gif';

    const stocksResponse = await page.goto(stocksUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    const stocksBuffer = await stocksResponse?.buffer();
    const stocksBase64 = stocksBuffer ? stocksBuffer.toString('base64') : '';

    if (!stocksBase64) {
      throw new Error('Ethanol Stocks GIF 다운로드 실패');
    }

    console.log('[Ethanol] Stocks GIF downloaded successfully');

    // Production 차트: corn-reports 페이지에서 찾기
    console.log('[Ethanol] Loading corn-reports page for Production...');
    await page.goto('https://www.cmegroup.com/trading/agricultural/corn-reports.html', {
      waitUntil: 'networkidle2',
      timeout: 180000, // 3분
    });
    await wait(3000);

    // Production 이미지 URL 찾기
    const productionImageUrl = await page.evaluate(() => {
      // Demand Charts 섹션 찾기
      const links = Array.from(document.querySelectorAll('a'));
      const productionLink = links.find((link) =>
        link.textContent?.includes('US Ethanol Production')
      );
      return productionLink ? (productionLink as HTMLAnchorElement).href : null;
    });

    let productionBase64: string;

    if (productionImageUrl) {
      console.log('[Ethanol] Found Production link, loading...');
      const prodResponse = await page.goto(productionImageUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
      await wait(2000);

      // 이미지 소스 찾기
      const imgSrc = await page.evaluate(() => {
        const img = document.querySelector('img[src*=".gif"], img[src*=".png"], img[src*="chart"]');
        return img ? (img as HTMLImageElement).src : null;
      });

      if (imgSrc && imgSrc.startsWith('http')) {
        const imgResponse = await page.goto(imgSrc);
        const imgBuffer = await imgResponse?.buffer();
        productionBase64 = imgBuffer ? imgBuffer.toString('base64') : '';
      } else {
        // 이미지를 찾지 못한 경우 페이지 스크린샷
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });
        productionBase64 = screenshot as string;
      }
    } else {
      // 링크를 찾지 못한 경우 페이지 스크린샷
      console.log('[Ethanol] Production link not found, taking page screenshot...');
      const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });
      productionBase64 = screenshot as string;
    }

    await browser.close();

    return {
      success: true,
      data: {
        productionChart: productionBase64,
        stocksChart: stocksBase64,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (browser) await browser.close();
    console.error('Ethanol scraping error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// 유가 차트 캡처 (Ship & Bunker)
// 오른쪽 아래 GLOBAL TOP 20 PORTS에서 Singapore + WTI 설정
export async function scrapeOilChart(): Promise<ScrapeResult> {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    // 싱가포르 페이지로 직접 이동
    console.log('[Oil] Loading Singapore oil prices page...');
    const singaporeUrl = 'https://shipandbunker.com/prices/apac/sea/sg-sin-singapore';

    await page.goto(singaporeUrl, {
      waitUntil: 'networkidle2',
      timeout: 180000, // 3분
    });

    console.log('[Oil] Page loaded, waiting for charts to render...');
    await wait(5000);

    // Step 1: 'Global 20 Ports Average' Remove from Graph 클릭
    console.log('[Oil] Step 1: Removing Global 20 Ports Average...');
    const globalRemoved = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, span, div'));
      const removeBtn = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes('remove from graph')
      );
      if (removeBtn) {
        (removeBtn as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (globalRemoved) {
      console.log('[Oil] Global 20 removed successfully');
      await wait(3000);
    } else {
      console.log('[Oil] Remove button not found, continuing...');
    }

    // Step 2: Add More Ports/Grades에서 WTI 선택
    console.log('[Oil] Step 2: Looking for Add More Ports/Grades...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const addMoreElement = elements.find(
        (el) =>
          el.textContent?.includes('Add More Ports') ||
          el.textContent?.includes('Add More') ||
          el.textContent?.includes('add more')
      );
      if (addMoreElement) {
        (addMoreElement as HTMLElement).scrollIntoView({ behavior: 'smooth' });
      }
    });
    await wait(2000);

    // Step 3: 'select market' 드롭다운에서 WTI 선택
    console.log('[Oil] Step 3: Selecting WTI from market dropdown...');
    const wtiSelected = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));

      for (const select of selects) {
        const options = Array.from(select.options);
        const wtiOption = options.find((opt) => opt.textContent?.includes('WTI'));

        if (wtiOption) {
          select.value = wtiOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    });

    if (wtiSelected) {
      console.log('[Oil] WTI selected successfully');
      await wait(2000);
    } else {
      console.log('[Oil] WTI selection failed');
    }

    // Step 4: 'add to graph' 버튼 클릭
    console.log('[Oil] Step 4: Clicking add to graph...');
    const addToGraphClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, div, span'));
      const addBtn = buttons.find(
        (btn) =>
          btn.textContent?.toLowerCase().includes('add to graph') ||
          btn.textContent?.toLowerCase().includes('add graph')
      );
      if (addBtn) {
        (addBtn as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (addToGraphClicked) {
      console.log('[Oil] Add to graph clicked');
      await wait(5000); // 그래프 업데이트 대기
    } else {
      console.log('[Oil] Warning: Add to graph button not found');
    }

    // Step 5: 범례 항목 클릭하여 숨기기 시도
    console.log('[Oil] Step 5: Trying to hide legend items by clicking...');
    await page.evaluate(() => {
      const keywords = ['VLSFO', 'vlsfo', 'WTI', 'wti', 'Singapore', '초저유황'];

      // 모든 클릭 가능한 요소 검색
      const allClickable = Array.from(document.querySelectorAll('*'));

      allClickable.forEach(el => {
        const text = el.textContent || '';
        const isSmallText = (el as HTMLElement).offsetHeight < 50; // 작은 텍스트 (라벨)

        // 키워드를 포함하고 작은 크기의 요소 (범례 아이템일 가능성)
        for (const keyword of keywords) {
          if (text.includes(keyword) && isSmallText) {
            // 클릭 시도
            try {
              (el as HTMLElement).click();
              console.log(`Clicked on: ${text.substring(0, 30)}`);
            } catch (e) {
              // 클릭 실패는 무시
            }
            break;
          }
        }
      });
    });
    await wait(3000); // 범례 토글 후 대기

    // Step 6: VLSFO/WTI 텍스트 강제 제거 (CSS + DOM 조작)
    console.log('[Oil] Step 6: Forcefully removing VLSFO/WTI text labels...');

    // 방법 1: CSS 스타일 주입으로 텍스트 숨김
    await page.addStyleTag({
      content: `
        *:not(button):not(select):not(input) {
          text-rendering: optimizeLegibility;
        }
        /* 모든 요소에서 VLSFO, WTI 텍스트 숨김 */
        body * {
          visibility: visible !important;
        }
      `
    });

    // 방법 2: JavaScript로 강제 제거 (3회 반복)
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const keywords = [
          'VLSFO', 'vlsfo', 'WTI', 'wti',
          '초저유황선박유', '초저유황', 'Singapore', 'US',
          '미국 서부 텍사스 원유', '미국 서부 원유', '미국 서부',
          '원유 가격', 'Singapore VLSFO', 'US WTI'
        ];

        // 1. 모든 HTML 요소
        const allElements = Array.from(document.querySelectorAll('*'));
        allElements.forEach(el => {
          const element = el as HTMLElement;
          const text = element.innerText || element.textContent || '';

          // Add, Select, More 버튼/드롭다운 제외
          if (text.includes('Add') || text.includes('Select') || text.includes('More') ||
              text.includes('add') || text.includes('select')) {
            return;
          }

          for (const keyword of keywords) {
            if (text.includes(keyword)) {
              // 텍스트 자체를 빈 문자열로
              if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
                element.textContent = '';
              }
              // 완전히 숨김
              element.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
              break;
            }
          }
        });

        // 2. SVG text 요소 (차트에서 텍스트가 SVG일 수 있음)
        const svgTexts = document.querySelectorAll('text, tspan');
        svgTexts.forEach(textEl => {
          const text = textEl.textContent || '';
          for (const keyword of keywords) {
            if (text.includes(keyword)) {
              textEl.textContent = '';
              (textEl as any).style.display = 'none';
              textEl.remove();
              break;
            }
          }
        });

        // 3. Canvas에 그려진 텍스트는 제거 불가능하므로 범례 영역 제거
        const legends = document.querySelectorAll(
          '[class*="legend"], [id*="legend"], [class*="label"], [id*="label"], .highcharts-legend'
        );
        legends.forEach(legend => {
          (legend as HTMLElement).style.display = 'none';
          legend.remove();
        });
      });

      await wait(1000); // 각 반복 후 대기
    }

    console.log('[Oil] Text removal complete, waiting before capture...');
    await wait(2000); // 최종 대기

    // 차트 캡처
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: true,
    });

    await browser.close();

    // 이미지에 주석 추가 (화살표 및 한국어 텍스트)
    console.log('[Oil] Adding Korean annotations...');
    const annotatedScreenshot = await addOilChartAnnotations(screenshot as string);

    return {
      success: true,
      data: {
        imageBase64: annotatedScreenshot,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (browser) await browser.close();
    console.error('[Oil] Scraping error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// USDA S&D 리포트 자동 다운로드 (CME Group)
export async function scrapeUSDAReport(
  productType: 'soybean' | 'corn' | 'wheat'
): Promise<ScrapeResult> {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`[USDA ${productType}] Loading corn-reports page...`);
    const url = 'https://www.cmegroup.com/trading/agricultural/corn-reports.html';

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 180000, // 3분
    });

    await wait(3000);

    // USDA Supply & Demand 섹션 찾기
    console.log(`[USDA ${productType}] Looking for USDA S&D section...`);
    const pdfUrl = await page.evaluate((product) => {
      // USDA Supply & Demand 섹션 찾기
      const sections = Array.from(document.querySelectorAll('h2, h3, h4'));
      const usdaSection = sections.find((el) =>
        el.textContent?.includes('USDA Supply') ||
        el.textContent?.includes('Supply & Demand') ||
        el.textContent?.includes('Supply and Demand')
      );

      if (usdaSection) {
        // 섹션 아래의 PDF 링크 찾기
        let currentElement = usdaSection.nextElementSibling;

        while (currentElement) {
          // PDF 링크 찾기
          const links = currentElement.querySelectorAll('a[href*=".pdf"]');
          for (const link of Array.from(links)) {
            const href = (link as HTMLAnchorElement).href;
            const text = link.textContent?.toLowerCase() || '';

            // 제품 타입에 맞는 PDF 찾기
            if (product === 'soybean' && (text.includes('soybean') || text.includes('bean'))) {
              return href;
            } else if (product === 'corn' && text.includes('corn')) {
              return href;
            } else if (product === 'wheat' && text.includes('wheat')) {
              return href;
            }
          }

          currentElement = currentElement.nextElementSibling;
        }
      }

      // 못 찾은 경우 전체에서 검색
      const allLinks = Array.from(document.querySelectorAll('a[href*=".pdf"]'));
      for (const link of allLinks) {
        const href = (link as HTMLAnchorElement).href;
        const text = link.textContent?.toLowerCase() || '';

        // USDA와 제품 타입이 모두 포함된 링크 찾기
        if (text.includes('usda') || href.includes('usda')) {
          if (product === 'soybean' && (text.includes('soybean') || text.includes('bean') || href.includes('soybean'))) {
            return href;
          } else if (product === 'corn' && (text.includes('corn') || href.includes('corn'))) {
            return href;
          } else if (product === 'wheat' && (text.includes('wheat') || href.includes('wheat'))) {
            return href;
          }
        }
      }

      return null;
    }, productType);

    if (!pdfUrl) {
      throw new Error(`USDA ${productType} PDF 링크를 찾을 수 없습니다`);
    }

    console.log(`[USDA ${productType}] Found PDF URL: ${pdfUrl}`);

    // PDF 다운로드
    console.log(`[USDA ${productType}] Downloading PDF...`);
    const pdfResponse = await page.goto(pdfUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    const pdfBuffer = await pdfResponse?.buffer();

    if (!pdfBuffer) {
      throw new Error('PDF 다운로드 실패');
    }

    console.log(`[USDA ${productType}] PDF downloaded successfully`);

    await browser.close();

    return {
      success: true,
      data: {
        pdfBuffer,
        pdfUrl,
        productType,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (browser) await browser.close();
    console.error(`[USDA ${productType}] Scraping error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// 환율 그래프 캡처 (네이버 환율 - 3개월)
export async function scrapeExchangeRate(): Promise<ScrapeResult> {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('[Exchange Rate] Loading Naver USD/KRW page...');
    const url = 'https://search.naver.com/search.naver?sm=mtb_drt&where=m&query=%EB%AF%B8%EA%B5%AD%ED%99%98%EC%9C%A8';

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 180000, // 3분
    });

    console.log('[Exchange Rate] Page loaded, waiting for chart...');
    await wait(5000); // 차트 로딩 충분히 대기

    // Step 1: 환율 차트 영역으로 스크롤
    console.log('[Exchange Rate] Scrolling to chart area...');
    await page.evaluate(() => {
      // 환율 그래프나 차트가 있는 영역으로 스크롤
      const chartArea = document.querySelector('canvas, svg, [class*="graph"], [class*="chart"]');
      if (chartArea) {
        chartArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await wait(2000);

    // Step 2: '3개월' 버튼 클릭
    console.log('[Exchange Rate] Clicking 3개월 button...');
    const threeMonthClicked = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('button, a, span, div, li'));
      const threeMonthBtn = allElements.find((btn) => {
        const text = btn.textContent?.trim();
        return text === '3개월' || text === '3M' || text?.includes('3개월');
      });
      if (threeMonthBtn) {
        (threeMonthBtn as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (threeMonthClicked) {
      console.log('[Exchange Rate] 3개월 clicked successfully');
      await wait(5000); // 차트 업데이트 충분히 대기
    } else {
      console.log('[Exchange Rate] 3개월 button not found, continuing...');
      await wait(2000);
    }

    // Step 3: 전체 페이지 캡처
    console.log('[Exchange Rate] Capturing full page...');

    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: true
    }) as string;

    await browser.close();

    return {
      success: true,
      data: {
        imageBase64: screenshot,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (browser) await browser.close();
    console.error('[Exchange Rate] Scraping error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}
