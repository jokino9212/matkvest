const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:8765/audits/vue_mount_fixture.html');
    const result = await page.evaluate(async () => {
      const { mountAppFooter, mountRewardNotice } = await import('/assets/ui/knowledge-map.js');
      const host = document.querySelector('#vue-host');
      const calls = [];
      const flush = () => new Promise(resolve => setTimeout(resolve, 0));
      mountAppFooter(host, { label: 'Old', title: 'Old title' }, { activate: () => calls.push('old') });
      await flush();
      host.querySelector('button').click();
      mountAppFooter(host, { label: 'New', title: 'New title' }, { activate: () => calls.push('new') });
      await flush();
      const updatedLabel = host.querySelector('button')?.textContent.trim();
      host.querySelector('button').click();
      mountRewardNotice(host, { visible: true, id: 1, text: 'Reward' });
      await flush();
      const switched = host.querySelector('#rewardPop')?.textContent.trim();
      host.remove();
      await flush();
      return { calls, updatedLabel, switched };
    });
    assert.deepEqual(result.calls, ['old', 'new']);
    assert.equal(result.updatedLabel, 'New');
    assert.equal(result.switched, 'Reward');
    console.log('PASS: new actions, new model, view switching, host removal');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
