/*
 * Tests for the Live Activity Halo input interaction primitive (window.LiveHalo).
 *
 * Covers: state transitions (idle → focus → typing → cooldown → focus, blur → idle),
 * the typing-idle timeout and cooldown timer, prefers-reduced-motion, and
 * disabled/read-only fields never entering the typing animation.
 *
 * No test framework: plain assertions + a controllable fake clock so the
 * timeout/cooldown transitions are deterministic. Run with: npm test
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// ── Controllable fake clock + reduced-motion switch, installed before scripts run ──
let NOW = 0;
let QUEUE = [];
let TID = 1;
let REDUCED = false;

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://x.test/',
  beforeParse(w) {
    w.requestAnimationFrame = () => 0;
    w.cancelAnimationFrame = () => {};
    w.matchMedia = (q) => ({
      matches: /reduce/.test(q) ? REDUCED : false,
      media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}
    });
    w.HTMLMediaElement.prototype.play = () => Promise.resolve();
    w.HTMLMediaElement.prototype.pause = () => {};
    w.Chart = function () { return { destroy() {}, update() {}, data: {}, options: {} }; };
    w.Chart.register = () => {};
    // Fake timers so cooldown/typing-idle transitions are deterministic.
    w.setTimeout = (fn, ms) => { const id = TID++; QUEUE.push({ id, fn, at: NOW + (ms || 0) }); return id; };
    w.clearTimeout = (id) => { QUEUE = QUEUE.filter((t) => t.id !== id); };
  }
});
const w = dom.window;
const d = w.document;

function tick(ms) {
  NOW += ms;
  const due = QUEUE.filter((t) => t.at <= NOW).sort((a, b) => a.at - b.at);
  QUEUE = QUEUE.filter((t) => t.at > NOW);
  due.forEach((t) => { try { t.fn(); } catch (e) { /* ignore unrelated page timers */ } });
}
function focus(el) { try { el.focus(); } catch (e) {} el.dispatchEvent(new w.FocusEvent('focusin', { bubbles: true })); }
function blur(el) { el.dispatchEvent(new w.FocusEvent('focusout', { bubbles: true })); try { el.blur(); } catch (e) {} }
function type(el) { el.dispatchEvent(new w.Event('input', { bubbles: true })); }
function has(el, c) { return el.classList.contains(c); }

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   - ' + name); }
  catch (e) { console.error('  FAIL - ' + name + '\n         ' + (e && e.message)); process.exitCode = 1; }
}

// jsdom executes the inline scripts synchronously during construction, so the
// LiveHalo primitive is already registered — run the suite directly.
runSuite();

function runSuite() {
  const H = w.LiveHalo;
  assert.ok(H, 'window.LiveHalo primitive is exposed');

  // A response box inside the Forms tab (open the report form so it is rendered).
  w.openForm('report');
  const input = d.querySelector('#report-wrap [data-rpt="leadName"]');
  const textarea = d.querySelector('#report-wrap [data-rpt="barriers"]');
  assert.ok(input && textarea, 'report response boxes exist');

  test('exposes centralized timing config', () => {
    assert.strictEqual(typeof H.config.typingIdleMs, 'number');
    assert.strictEqual(typeof H.config.cooldownMs, 'number');
  });

  test('recognizes response boxes by their field class, anywhere in the app', () => {
    assert.strictEqual(H.isResponseBox(input), true);
    const plain = d.createElement('input'); plain.type = 'text'; d.body.appendChild(plain);
    assert.strictEqual(H.isResponseBox(plain), false, 'a non form-field input is ignored');
    // A budget-table cell input (.bmr-cell-input) is covered wherever it lives.
    const cell = d.createElement('input'); cell.type = 'text'; cell.className = 'bmr-cell-input bmr-num'; d.body.appendChild(cell);
    assert.strictEqual(H.isResponseBox(cell), true, 'budget-area .bmr-cell-input boxes are covered');
  });

  test('idle → focus → typing → cooldown → focus (full state machine)', () => {
    assert.strictEqual(H.stateOf(input), 'idle');
    focus(input);
    assert.strictEqual(H.stateOf(input), 'focus');
    assert.ok(has(input, 'halo-focus') && !has(input, 'halo-typing'), 'soft focus highlight');

    type(input);
    assert.strictEqual(H.stateOf(input), 'typing');
    assert.ok(has(input, 'halo-typing'), 'circling activity ring while typing');

    tick(H.config.typingIdleMs);
    assert.strictEqual(H.stateOf(input), 'cooldown');
    assert.ok(has(input, 'halo-cooldown') && !has(input, 'halo-typing'), 'eases into cooldown');

    tick(H.config.cooldownMs);
    assert.strictEqual(H.stateOf(input), 'focus', 'settles back to calm focused state');
  });

  test('continued typing resets the idle timer (stays in typing)', () => {
    focus(input); type(input);
    tick(H.config.typingIdleMs - 50);
    type(input); // keep typing before idle fires
    tick(H.config.typingIdleMs - 50);
    assert.strictEqual(H.stateOf(input), 'typing', 'still typing — idle timer was reset');
    blur(input);
  });

  test('circling animation is not restarted on every keystroke', () => {
    focus(input);
    type(input);
    const enters = input.dataset.haloTypingEnters;               // entered typing once
    type(input); type(input); type(input);                       // more keystrokes in the same burst
    assert.strictEqual(input.dataset.haloTypingEnters, enters, 'typing state entered once per burst (animation not reset)');
    assert.ok(has(input, 'halo-typing'), 'ring stays on while typing');
    blur(input);
  });

  test('blur clears all halo state → idle', () => {
    focus(input); type(input);
    blur(input);
    assert.strictEqual(H.stateOf(input), 'idle');
    assert.ok(!has(input, 'halo-focus') && !has(input, 'halo-typing') && !has(input, 'halo-cooldown'), 'no halo classes after blur');
  });

  test('cooldown after blur resolves to idle, not focus', () => {
    focus(input); type(input);
    blur(input);            // leaves focus while a typing-idle timer is pending
    tick(H.config.typingIdleMs + H.config.cooldownMs);
    assert.strictEqual(H.stateOf(input), 'idle');
  });

  test('textarea response boxes get the same behavior', () => {
    focus(textarea); type(textarea);
    assert.strictEqual(H.stateOf(textarea), 'typing');
    assert.ok(has(textarea, 'halo-typing'));
    blur(textarea);
  });

  test('circling halo is active on focus (cursor in box), not only while typing', () => {
    focus(input);
    assert.strictEqual(H.stateOf(input), 'focus');
    assert.ok(has(input, 'halo-focus'), 'halo shows as soon as the cursor is in the box');
    blur(input);
    assert.strictEqual(H.stateOf(input), 'idle', 'cleared when the cursor leaves');
  });

  test('prefers-reduced-motion: no circling on focus or typing (static border)', () => {
    REDUCED = true;
    focus(input);
    assert.ok(has(input, 'halo-no-motion'), 'focus under reduced motion → static border, no spin');
    type(input);
    assert.strictEqual(H.stateOf(input), 'typing', 'still tracks the typing state');
    assert.ok(has(input, 'halo-no-motion'), 'typing under reduced motion → still no spin');
    blur(input);
    REDUCED = false;
  });

  test('disabled fields never enter the typing animation', () => {
    input.disabled = true;
    focus(input); type(input);
    assert.strictEqual(H.stateOf(input), 'idle', 'disabled field stays idle');
    assert.ok(!has(input, 'halo-typing'));
    input.disabled = false;
  });

  test('read-only fields never enter the typing animation', () => {
    input.readOnly = true;
    focus(input); type(input);
    assert.strictEqual(H.stateOf(input), 'idle', 'read-only field stays idle');
    assert.ok(!has(input, 'halo-typing'));
    input.readOnly = false;
  });

  console.log('\n' + passed + ' passed' + (process.exitCode ? ' (with failures)' : ''));
  if (process.exitCode) process.exit(process.exitCode);
}
