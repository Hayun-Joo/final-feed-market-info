import puppeteer, { Browser, Page } from 'puppeteer';

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
      protocolTimeout: 60000,
    });
  }
  return browserInstance;
}

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function takeScreenshot(
  url: string,
  selector?: string,
  waitTime: number = 3000
): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 실제 브라우저처럼 보이도록 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await waitFor(waitTime);

    let screenshot: Buffer;

    if (selector) {
      const element = await page.$(selector);
      if (element) {
        screenshot = (await element.screenshot({ encoding: 'binary' })) as Buffer;
      } else {
        screenshot = (await page.screenshot({ fullPage: false, encoding: 'binary' })) as Buffer;
      }
    } else {
      screenshot = (await page.screenshot({ fullPage: false, encoding: 'binary' })) as Buffer;
    }

    return screenshot.toString('base64');
  } finally {
    await page.close();
  }
}

export async function executePageAction(
  url: string,
  action: (page: Page) => Promise<void>,
  waitTime: number = 3000
): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 실제 브라우저처럼 보이도록 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await waitFor(waitTime);

    await action(page);

    await waitFor(2000);

    const screenshot = (await page.screenshot({
      fullPage: false,
      encoding: 'binary',
    })) as Buffer;

    return screenshot.toString('base64');
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
