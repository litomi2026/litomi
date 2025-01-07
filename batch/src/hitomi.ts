import * as cheerio from 'cheerio';
import { Browser, Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

const HITOMI_DOMAIN = 'https://hitomi.la';

export const driver = await new Builder()
  .forBrowser(Browser.CHROME)
  .setChromeOptions(new chrome.Options())
  .build();

type Params = {
  page?: number;
};

export async function getMangas({ page = 1 }: Params = {}) {
  await driver.get(
    `${HITOMI_DOMAIN}/index-korean.html${page > 1 ? `?page=${page}` : ''}`,
  );

  const 작품Selector = 'body > div > div.gallery-content > div';
  await driver.wait(until.elementLocated(By.css(작품Selector)), 10000);

  const pageSource = await driver.getPageSource();

  const $ = cheerio.load(pageSource);
  const mangas = $(작품Selector);

  return mangas
    .map((_, manga) => ({
      id:
        $(manga)
          .find('div > a')
          .attr('href')
          ?.match(/(\d+)\.html$/)?.[1] ?? '',
      path: $(manga).find('div > a').attr('href'),
      title: $(manga).find('div > h1 > a').text(),
      artists: $(manga)
        .find('div > div.artist-list > ul > li > a')
        .map((_, artist) => $(artist).text())
        .get()
        .filter((tag) => tag !== '...'),
      series: $(manga)
        .find(
          'div > div.dj-content > table > tbody > tr:nth-child(1) > td.series-list > ul > li > a',
        )
        .map((_, series) => $(series).text())
        .get()
        .filter((tag) => tag !== '...'),
      type: $(manga)
        .find(
          'div > div.dj-content > table > tbody > tr:nth-child(2) > td:nth-child(2) > a',
        )
        .text(),
      group: [],
      characters: [],
      tags: $(manga)
        .find(
          'div > div.dj-content > table > tbody > tr:nth-child(4) > td.relatedtags > ul > li > a',
        )
        .map((_, series) => $(series).text())
        .get()
        .filter((tag) => tag !== '...'),
      publishAt:
        $(manga).find('div > div.dj-content > p').attr('data-posted') ?? '',
      imageCount: 0,
    }))
    .get()
    .map((series) => ({
      ...series,
      publishAt: series.publishAt
        ? new Date(series.publishAt).toISOString()
        : '',
    }));
}

type Params2 = {
  path?: string;
};

export async function getMangaDetailInfos({ path = '' }: Params2 = {}) {
  await driver.get(`${HITOMI_DOMAIN}${path}`);

  const mangaInfoSelector =
    'body > div > div.content > div.gallery.dj-gallery > div > table > tbody';
  await driver.wait(until.elementLocated(By.css(mangaInfoSelector)), 10000);

  const pageSource = await driver.getPageSource();

  const $ = cheerio.load(pageSource);
  const mangaInfo = $(mangaInfoSelector);

  return {
    group: $(mangaInfo)
      .find('#groups > ul > li > a')
      .map((_, group) => $(group).text())
      .get(),
    characters: $(mangaInfo)
      .find('#characters > li > a')
      .map((_, character) => $(character).text())
      .get(),
    imageCount: $(
      'body > div > div.content > div.gallery-preview.lillie > div > ul > li',
    ).length,
  };
}

export async function get작품ViewerPathes(작품Path: string) {
  await driver.get(`${HITOMI_DOMAIN}${작품Path}`);

  const 작품ViewerPathesSelector =
    'body > div > div.content > div.gallery-preview.lillie > div > ul > li > div > a';
  await driver.wait(
    until.elementLocated(By.css(작품ViewerPathesSelector)),
    10000,
  );

  const pageSource = await driver.getPageSource();

  const $ = cheerio.load(pageSource);
  return $(작품ViewerPathesSelector)
    .map((_, element) => $(element).attr('href'))
    .get();
}

export async function get작품ImageURL(작품ViewerPath: string) {
  await driver.get(`${HITOMI_DOMAIN}${작품ViewerPath}`);

  const 작품ImageSelector = '#comicImages > picture > source';
  await driver.wait(until.elementLocated(By.css(작품ImageSelector)), 10000);

  const pageSource = await driver.getPageSource();
  const $ = cheerio.load(pageSource);

  return $(작품ImageSelector).attr('srcset') ?? '';
}
