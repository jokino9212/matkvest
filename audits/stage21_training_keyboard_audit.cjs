'use strict';
const assert = require('node:assert/strict');
const {withMatkvestBrowser} = require('./matkvest_browser_harness.cjs');

const divisionCells = '#stage[data-v-app] .qin:not([readonly]):not([disabled])';
const quizFields = '#qstage[data-v-app] input:not([type="hidden"]):not([readonly]):not([disabled])';
const cases = [
  {name: 'column-division'},
  {name: 'grade5-topic', grade: 5, topic: 'frac_to_mixed'},
  {name: 'grade6-topic', grade: 6, topic: 'g6:arithmetic_mean'},
];

async function openExercise(page, scenario) {
  if (scenario.name === 'column-division') {
    await page.evaluate(() => {
      startColumnStage('div', 0);
      // Use a long quotient to exercise movement between cells at narrow widths.
      task = {a: 14067, b: 3, quotient: '4689', ans: 4689, steps: divisionSteps(14067, 3)};
      renderTask();
    });
    return page.locator(divisionCells);
  }

  await page.evaluate(grade => openGrade(grade), scenario.grade);
  const course = page.locator('#grade' + scenario.grade + 'Vue[data-v-app]');
  await course.locator('.topic[data-topic-id="' + scenario.topic + '"]').click();
  await page.locator('#modal [data-v-app] button.stage-card:not(:disabled)').first().click();
  return page.locator(quizFields);
}

function layout(page) {
  return page.locator('#modal').evaluate(modal => {
    const viewportWidth = document.documentElement.clientWidth;
    const root = modal.getBoundingClientRect();
    const controls = [...modal.querySelectorAll('input,textarea,select,button,.quizq,.lesson,.stage-card,.div-layout')];
    const bad = controls.flatMap(control => {
      const {width, height, left, right} = control.getBoundingClientRect();
      if (!width || !height || getComputedStyle(control).visibility === 'hidden') return [];
      if (left >= Math.max(0, root.left) - 3 && right <= Math.min(viewportWidth, root.right) + 3) return [];
      return [{tag: control.tagName, className: control.className, left, right}];
    });
    return {viewportWidth, scrollWidth: document.documentElement.scrollWidth, bad};
  });
}

async function checkScreen(browser, url, width, scenario) {
  const page = await browser.newPage({
    viewport: {width, height: 740}, isMobile: width < 500, hasTouch: width < 500,
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    const fields = await openExercise(page, scenario);
    await fields.first().waitFor();
    for (const height of [740, 420]) {
      await page.setViewportSize({width, height});
      const screen = await layout(page);
      assert(screen.scrollWidth <= width + 2, 'Horizontal page overflow: ' + JSON.stringify(screen));
      assert.deepEqual(screen.bad, [], 'Controls overflow the training modal at height ' + height);
    }

    let focused = fields.first();
    await focused.focus();
    if (scenario.name === 'column-division') {
      await focused.press('ArrowRight');
      focused = fields.nth(1);
    }
    const keyboard = await focused.evaluate(field => {
      field.scrollIntoView({block: 'nearest', inline: 'nearest'});
      const {top, bottom} = field.getBoundingClientRect();
      return {top, bottom, height: document.documentElement.clientHeight, focused: document.activeElement === field};
    });
    assert(keyboard.focused && keyboard.top >= 0 && keyboard.bottom <= keyboard.height + 3,
      'Focused field is outside the keyboard viewport: ' + JSON.stringify(keyboard));
    await page.keyboard.type('4');
    assert.equal(await focused.inputValue(), '4', 'Focused Vue field did not accept keyboard input');
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
}

withMatkvestBrowser(async (browser, url) => {
  const issues = [];
  for (const width of [320, 360, 390, 412, 430, 768]) {
    for (const scenario of cases) {
      try {
        await checkScreen(browser, url, width, scenario);
        console.log('PASS_STAGE21', width, scenario.name);
      } catch (error) {
        issues.push({width, scenario: scenario.name, error: error.message});
      }
    }
  }
  console.log('ISSUES', JSON.stringify(issues));
  assert.equal(issues.length, 0);
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
