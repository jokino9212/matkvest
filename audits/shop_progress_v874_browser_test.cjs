'use strict';
const assert = require('node:assert/strict');
const {withMatkvestBrowser} = require('./matkvest_browser_harness.cjs');

const rarityRank = {common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4};
function compare(a, b) {
  return (rarityRank[a.rarity] ?? 9) - (rarityRank[b.rarity] ?? 9) ||
    Number(a.price || 0) - Number(b.price || 0);
}

async function checkStore(page, width) {
  const orders = await page.evaluate(() => {
    const summary = items => items.map(({id, rarity, price}) => ({id, rarity, price}));
    const shopTypes = ['avatars', 'frames', 'pets', 'titles', 'backgrounds', 'badges',
      'stickers', 'effects', 'nicknameStyles', 'accessories'];
    shopRarityFilter = 'all';
    const shop = Object.fromEntries(shopTypes.map(type => [type, summary(filteredShopItems(type))]));
    const collection = {};
    for (const type of ['avatars', 'frames', 'pets', 'stickers', 'backgrounds']) {
      const original = state.inventory[type];
      const samples = mk872ActiveCollectionItems(type).slice(0, 12);
      state.inventory[type] = [...new Set([...(original || []), ...samples.map(item => item.id)])];
      collection[type] = summary(mk872CollectionOwned(type));
      if (original) state.inventory[type] = original;
      else delete state.inventory[type];
    }
    return {shop, collection};
  });
  for (const [surface, categories] of Object.entries(orders)) {
    for (const [type, items] of Object.entries(categories)) {
      assert(items.length > 1, surface + ' ' + type + ' has too few items to verify sorting');
      assert.deepEqual(items, [...items].sort(compare), surface + ' ' + type + ' at ' + width);
    }
  }

  await page.evaluate(() => openCollection());
  await page.locator('#modal .mk872-col-counter-grid[data-v-app]').waitFor();
  await page.locator('#modal .v71-sort-control select').waitFor();
  await page.evaluate(() => openShop('avatars', 'all'));
  const sort = page.locator('#modal .store-controls[data-v-app] .v71-sort-control select');
  await sort.waitFor();
  assert.equal(await sort.inputValue(), 'rarity');
}

async function openGradeCourse(page, grade) {
  await page.evaluate(grade => openGrade(grade), grade);
  const course = page.locator('#grade' + grade + 'Vue[data-v-app]');
  await course.locator('.v71-progress-count').first().waitFor();
  return course;
}

async function checkGrade4(page, course) {
  const firstGroup = course.locator('.g4-textbook-group').first();
  const label = firstGroup.locator('.v71-progress-count');
  const totals = await course.locator('.g4-textbook-group').evaluateAll(groups => groups.map(group => ({
    cards: group.querySelectorAll('.g4-textbook-card').length,
    total: Number(group.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')),
  })));
  assert.equal(totals.length, 11, 'Grade 4 must show all 11 textbook sections');
  assert.equal(totals.reduce((sum, section) => sum + section.total, 0), 68);
  assert(totals.every(section => section.total === section.cards));
  const topic = await firstGroup.locator('.g4-textbook-card').first().getAttribute('data-topic-id');
  assert(topic, 'Missing topic key in the Grade 4 catalog');
  await page.evaluate(topic => {
    progressFor(topic).best = [4, 5, 7];
    save();
  }, topic);
  await firstGroup.locator('.g4-textbook-card').first()
    .locator('.topic-progress', {hasText: '2/3 этапа'}).waitFor();
  assert.equal(await label.innerText(), 'Пройдено 0 из 6 тем');
  await page.evaluate(topic => {
    progressFor(topic).masterPassedWithCorrection = true;
    save();
  }, topic);
  await firstGroup.locator('.v71-progress-count', {hasText: 'Пройдено 1 из 6 тем'}).waitFor();
  assert.equal(await label.innerText(), 'Пройдено 1 из 6 тем');
  await page.reload();
  await openGradeCourse(page, 4);
  assert.equal(await label.innerText(), 'Пройдено 1 из 6 тем');
}

withMatkvestBrowser(async (browser, url) => {
  for (const width of [320, 390, 768, 1280]) {
    const page = await browser.newPage({
      viewport: {width, height: 850}, isMobile: width < 768, hasTouch: width < 768,
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(url, {waitUntil: 'domcontentloaded'});
      await checkStore(page, width);
      await page.evaluate(() => closeModal());
      const grades = {};
      for (const grade of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const course = await openGradeCourse(page, grade);
        const labels = await course.locator('.v71-section-progress .v71-progress-count').allTextContents();
        assert(labels.length, 'No section counters for grade ' + grade + ' at ' + width);
        for (const label of labels) {
          assert.match(label.trim(), /^Пройдено \d+ из \d+ тем$/, 'Grade ' + grade + ' at ' + width);
        }
        grades[grade] = labels.length;
        if (grade === 4) await checkGrade4(page, course);
      }
      assert.deepEqual(errors, []);
      console.log('PASS shop order, selectors and section counters at', width, 'px', JSON.stringify(grades));
    } finally {
      await page.close();
    }
  }
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
