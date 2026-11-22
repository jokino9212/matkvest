'use strict';

const assert = require('node:assert/strict');
const { readFile, mkdir } = require('node:fs/promises');
const http = require('node:http');
const { extname, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '..');
const mountPath = '/matkvest/';
const bundlePath = mountPath + 'assets/ui/knowledge-map.js';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};
const host = page => page.locator('#knowledgeMapVue[data-v-app]');
const detail = page => page.locator('#knowledgeTopicDetailVue[data-v-app]');
const card = (page, title) => host(page).locator('.knowledge-card').filter({
  has: page.locator('.knowledge-card-title').getByText(title, { exact: false }),
});

async function openMap(page) {
  await page.locator('.knowledge-home-card button').first().click();
  await host(page).getByRole('heading', { name: '📊 Карта знаний', exact: true }).waitFor();
}

async function expectCurrentCards(page) {
  const expected = await page.evaluate(() => {
    const data = buildKnowledgeMapData(knowledgeResolveProfile().profile, knowledgeMapState.grade);
    return knowledgeFilteredSections(data).flatMap(section => section.topics.map(topic => topic.title));
  });
  const actual = await host(page).locator('.knowledge-card-title').allTextContents();
  assert.equal(actual.length, expected.length);
  expected.forEach((title, index) => assert(actual[index].endsWith(title), actual[index] + ' → ' + title));
  return actual.length;
}

async function checkTextbookCourses(page) {
  const rowCounts = [41, 60, 78, 68, 51, 48, 127, 127];
  const cardCounts = { 5: 74, 6: 75, 7: 149, 8: 137 };
  const home = page.locator('#homeDashboard[data-v-app]');
  const modal = page.locator('#modal .vue-report[data-v-app]');
  for (const [index, count] of rowCounts.entries()) {
    const grade = index + 1;
    await home.getByRole('button', { name: 'Открыть ' + grade + ' класс', exact: true }).click();
    const course = page.locator('#grade' + grade + 'Vue[data-v-app]');
    const contents = course.getByRole('region', { name: 'Темы ' + grade + ' класса', exact: true });
    const search = course.getByRole('searchbox', { name: 'Найти учебную тему' });
    const body = contents.locator('.mk-g5-toc-body');
    const toggle = contents.locator('.mk-g5-toc-toggle');
    const first = contents.locator('details').first();
    const second = contents.locator('details').nth(1);
    const rows = contents.locator('.mk-g5-toc-list > li:not(.mk-g7-toc-section)');
    await contents.waitFor();
    assert.equal(await rows.count(), count);
    assert.equal(await course.getByRole('searchbox').count(), 1);
    if (cardCounts[grade]) assert.equal(await course.locator('.topic').count(), cardCounts[grade]);
    if (grade === 5) await course.locator('.g5-mix').getByRole('button', { name: 'Играть' }).waitFor();
    if (grade >= 7) {
      const subjectTitles = ['Алгебра', 'Геометрия', 'Вероятность и статистика'];
      assert.deepEqual(await contents.locator('.mk-g5-toc-part-heading').allTextContents(), subjectTitles);
      assert.deepEqual(await course.locator('.g7-course > .grade-head h2').allTextContents(), subjectTitles);
      const paragraph = grade === 7 ? '12' : '46';
      await search.fill('геометрия ' + paragraph);
      const numbered = contents.locator('li[data-paragraph]:visible');
      await numbered.first().waitFor();
      assert.deepEqual(await numbered.evaluateAll(items => items.map(row => row.dataset.paragraph)), [paragraph]);
      await course.getByRole('button', { name: 'Очистить', exact: true }).click();
    }
    if (grade === 6) {
      await search.fill('НОД');
      await contents.locator('[data-topic-id="g6:gcd"]:visible').waitFor();
      await course.getByRole('button', { name: 'Очистить', exact: true }).click();
    }
    await first.locator('summary').press('Enter');
    assert.equal(await first.getAttribute('open'), '');
    await first.locator('summary').press('Space');
    assert.equal(await first.getAttribute('open'), null);
    await first.locator('summary').press('Enter');
    const destination = second.locator('.mk-g5-toc-link').first();
    const topicId = await destination.getAttribute('data-topic-id');
    const label = await destination.locator('.mk-g5-toc-item-title').evaluate(title => title.firstChild.textContent.trim());
    const y = await toggle.evaluate(button => {
      button.scrollIntoView({ block: 'center' });
      return window.scrollY;
    });
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert(await body.isHidden());
    assert.equal(await page.evaluate(() => window.scrollY), y);
    await search.fill('zzzz-no-textbook-results');
    await course.getByRole('status').getByText(/Найдено тем: 0/).waitFor();
    assert.equal(await rows.filter({ visible: true }).count(), 0);
    await search.fill(label);
    await destination.waitFor();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    const clear = course.getByRole('button', { name: 'Очистить', exact: true });
    await clear.click();
    assert.equal(await first.getAttribute('open'), '');
    assert.equal(await second.getAttribute('open'), null);
    assert.equal(await search.inputValue(), '');
    assert(await search.evaluate(input => input === document.activeElement));

    await search.fill(label);
    await destination.click();
    await modal.getByRole('button', { name: /1\. Разминка/ }).waitFor();
    const route = await page.evaluate(() => mk854Route());
    assert.deepEqual(route, { screen: 'topic', grade, topicId: grade === 4 ? topicId.slice(3) : topicId });
    if (grade === 5 || grade === 8) {
      await page.reload();
      await modal.getByRole('button', { name: /1\. Разминка/ }).waitFor();
      assert.deepEqual(await page.evaluate(() => mk854Route()), route);
    }
    await modal.getByRole('button', { name: 'Закрыть окно', exact: true }).click();
    await contents.waitFor();
    await page.reload();
    await contents.waitFor();
    assert.deepEqual(await page.evaluate(() => mk854Route()), { screen: 'grade', grade });
    assert.equal(await rows.count(), count);
    assert.equal(await search.inputValue(), '');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await course.getByRole('button', { name: '← Главный экран', exact: true }).click();
    await home.getByRole('heading', { name: 'Выбери класс', exact: true }).waitFor();
  }
  console.log('PASS Vue textbook contents offline, ' + page.viewportSize().width + ' px: Grades 1–8');
}

async function run(browser, url, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 },
    isMobile: width < 500, hasTouch: width < 500 });
  const page = await context.newPage();
  const errors = [];
  const moduleRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (new URL(response.url()).pathname === bundlePath) {
      moduleRequests.push({ url: response.url(), worker: response.fromServiceWorker() });
    }
  });
  try {
    await page.goto(url);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.evaluate(() => openGrade(4));
    const course = page.locator('#grade4Vue[data-v-app]');
    const toc = course.locator('#mk-g4-textbook-nav');
    await toc.getByRole('heading', { name: 'Темы 4 класса', exact: true }).waitFor();
    assert.equal(await course.getByRole('searchbox').count(), 1);
    await toc.getByRole('button', { name: 'К карточкам', exact: true }).click();
    await toc.getByRole('button', { name: 'Показать разделы', exact: true }).waitFor();
    const courseSearch = course.getByRole('searchbox', { name: 'Найти учебную тему' });
    await courseSearch.fill('действий порядок');
    await toc.getByRole('button', { name: /Числовые выражения. Порядок действий/ }).click();
    await page.locator('.vue-report[data-v-app]').getByRole('button', { name: /1\. Разминка/ }).waitFor();
    await page.getByRole('dialog', { name: /Порядок действий/ }).getByRole('button', { name: 'Закрыть окно' }).click();
    await toc.getByRole('heading', { name: 'Темы 4 класса', exact: true }).waitFor();
    assert.equal(await courseSearch.inputValue(), '');
    await course.getByRole('button', { name: '← Главный экран', exact: true }).click();
    await page.getByRole('heading', { name: 'Выбери класс', exact: true }).waitFor();
    await context.setOffline(true);
    await checkTextbookCourses(page);
    await context.setOffline(false);
    await page.evaluate(() => {
      const progress = progressFor('g4:table');
      progress.best = [4, 5, 7];
      progress.masterPassedWithCorrection = true;
      save();
    });
    const initial = await page.evaluate(() => ({
      profile: currentProfile,
      progress: profileProgressData(state, 'g4:table'),
      storage: localStorage.getItem('mq4_profiles'),
    }));

    await openMap(page);
    assert.equal(await expectCurrentCards(page), 73);
    await card(page, 'Таблица умножения').first().locator('.knowledge-stage.passed').nth(2).waitFor();

    if (process.env.MATKVEST_VUE_SCREENSHOTS) {
      await mkdir(process.env.MATKVEST_VUE_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: resolve(process.env.MATKVEST_VUE_SCREENSHOTS, 'knowledge-map-' + width + '.png') });
    }

    for (const grade of [1, 2, 3, 5, 6, 7, 8, 4]) {
      const tab = host(page).getByRole('button', { name: grade + ' класс', exact: true });
      await tab.click();
      await host(page).getByRole('button', { name: grade + ' класс', exact: true, pressed: true }).waitFor();
      assert(await expectCurrentCards(page) > 0);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

    const search = host(page).getByRole('searchbox', { name: 'Найти тему' });
    await search.fill('Тблица умножения');
    await search.evaluate(input => input.setSelectionRange(1, 1));
    await page.keyboard.insertText('а');
    await card(page, 'Таблица умножения').first().waitFor();
    assert.deepEqual(await search.evaluate(input => [input.value, input.selectionStart, document.activeElement === input]),
      ['Таблица умножения', 2, true]);
    assert(await expectCurrentCards(page) > 0);
    await host(page).getByRole('button', { name: '🔴 Слабые', exact: true }).click();
    await host(page).getByText('По выбранному фильтру тем нет.').waitFor();
    await host(page).getByRole('button', { name: 'Все', exact: true }).click();
    await host(page).getByRole('button', { name: 'Требуют внимания', exact: true }).click();
    await host(page).getByRole('button', { name: 'Требуют внимания', exact: true, pressed: true }).waitFor();

    await card(page, 'Таблица умножения').first().click();
    await detail(page).getByRole('heading', { name: '📊 Таблица умножения', exact: true }).waitFor();
    assert.equal(await detail(page).getByText('✅ Пройдена', { exact: true }).count(), 3);
    await detail(page).getByText('Пока нет заданий.', { exact: true }).waitFor();
    assert.equal(await host(page).count(), 0);
    await page.getByRole('button', { name: '← К карте знаний', exact: true }).click();
    await host(page).getByRole('button', { name: 'Требуют внимания', exact: true, pressed: true }).waitFor();
    assert.equal(await search.inputValue(), 'Таблица умножения');
    await host(page).getByRole('button', { name: '← Главная', exact: true }).click();
    await page.locator('.knowledge-home-card').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('mq4_profiles')), initial.storage);

    await context.setOffline(true);
    await page.reload();
    await openMap(page);
    assert.equal(await expectCurrentCards(page), 73);
    assert.equal(await card(page, 'Таблица умножения').first().locator('.knowledge-stage.passed').count(), 3);
    assert(moduleRequests.some(request => request.worker && request.url.startsWith(url + 'assets/')));
    assert.deepEqual(await page.evaluate(() => profileProgressData(state, 'g4:table')), initial.progress);
    assert.equal(await page.evaluate(() => currentProfile), initial.profile);
    await card(page, 'Таблица умножения').first().click();
    await detail(page).getByRole('heading', { name: '📊 Таблица умножения', exact: true }).waitFor();
    assert.equal(await detail(page).getByText('✅ Пройдена', { exact: true }).count(), 3);

    // Use an independent fixture accessed through the current teacher entry point.
    await page.evaluate(() => {
      const selected = 'Контрольный ученик <2>';
      const profileId = 'vue-test-student';
      profiles[selected] = { ...deepCopy(EMPTY_STATE), profileId, courseProgress: {} };
      teacherUnlocked = true;
      openTeacherStudentDetailById(profileId);
    });
    const teacherButton = page.locator('#teacherStudentVue[data-v-app]')
      .getByRole('button', { name: '📊 Карта знаний', exact: true });
    await teacherButton.click();
    await host(page).getByText('Контрольный ученик <2>', { exact: true }).waitFor();
    assert.equal(await card(page, 'Таблица умножения').first().locator('.knowledge-stage.passed').count(), 0);
    assert.equal(await page.evaluate(() => currentProfile), initial.profile);
    await card(page, 'Таблица умножения').first().click();
    await detail(page).getByRole('button', { name: 'Тренировать тему', exact: true }).click();
    const switchDialog = page.getByRole('dialog', { name: 'Открыть как ученик?', exact: true })
      .locator('.vue-report[data-v-app]');
    await switchDialog.getByRole('button', { name: 'Отмена', exact: true }).click();
    assert.equal(await page.evaluate(() => currentProfile), initial.profile);
    await detail(page).getByRole('button', { name: '← К карте знаний', exact: true }).click();
    await host(page).getByRole('button', { name: '← Контрольный ученик <2>', exact: true }).click();
    await page.locator('.teacher-detail-head').waitFor();
    assert.equal(await host(page).count(), 0);
    assert.equal(await page.evaluate(() => currentProfile), initial.profile);
    await page.evaluate(() => openKnowledgeMap());
    await card(page, 'Таблица умножения').first().click();
    await detail(page).getByRole('button', { name: 'Тренировать тему', exact: true }).click();
    await page.getByRole('heading', { name: '🎯 Тренировка темы', exact: true }).waitFor();
    await page.locator('#tstage[data-v-app]').waitFor();
    await page.locator('#schoolAttemptFrame[data-v-app]').getByRole('progressbar').waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS Vue knowledge map, ' + width + ' px: all grades, filters, caret, detail, offline F5 and teacher profile');
  } finally {
    await context.close();
  }
}

const server = http.createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (!path.startsWith(mountPath)) return response.writeHead(404).end();
  const file = resolve(root, '.' + sep + (path.slice(mountPath.length) || 'index.html'));
  if (!file.startsWith(root + sep)) return response.writeHead(404).end();
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store' }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch().catch(error => {
    server.close();
    throw error;
  });
  try {
    const url = 'http://127.0.0.1:' + server.address().port + mountPath;
    for (const width of [390, 1280]) await run(browser, url, width);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
