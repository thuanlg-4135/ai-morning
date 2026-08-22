const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const lines = (...items) => items.join('\n');

const svgShell = (label, content, viewBox = '0 0 920 500') =>
  '<svg viewBox="' + viewBox + '" role="img" aria-label="' + escapeHtml(label) + '">\n' +
  '  <rect width="100%" height="100%" class="svg-surface"/>\n' +
  content + '\n</svg>';

const visuals = {
  'cost-down-system-up': {
    label: 'Chi phí inference giảm trong khi chất lượng hệ thống agent tăng',
    svg: () => svgShell('Chi phí inference giảm trong khi chất lượng hệ thống agent tăng', lines(
      '<text x="58" y="66" class="svg-type svg-muted" font-size="15" font-weight="700" letter-spacing="2">PRICE / PERFORMANCE</text>',
      '<line x1="58" y1="94" x2="862" y2="94" class="svg-line" stroke-width="1"/>',
      '<g class="svg-type">',
      '  <text x="58" y="157" class="svg-text" font-size="27" font-weight="800">COST</text>',
      '  <text x="742" y="157" class="svg-accent" font-size="27" font-weight="800">DOWN</text>',
      '  <path d="M166 149h520" fill="none" class="svg-line" stroke-width="2"/>',
      '  <path d="m674 138 18 11-18 11" fill="none" class="svg-accent-line" stroke-width="3"/>',
      '  <rect x="58" y="208" width="804" height="196" class="svg-paper svg-line" stroke-width="1.5"/>',
      '  <rect x="90" y="244" width="180" height="124" class="svg-strong"/>',
      '  <text x="116" y="292" class="svg-text" font-size="18" font-weight="800">MODEL</text>',
      '  <text x="116" y="322" class="svg-muted" font-size="13">capability · reasoning</text>',
      '  <path d="M270 306h52" fill="none" class="svg-accent-line" stroke-width="3"/>',
      '  <rect x="322" y="228" width="226" height="160" class="svg-accent-soft"/>',
      '  <text x="350" y="277" class="svg-text" font-size="18" font-weight="800">SYSTEM</text>',
      '  <text x="350" y="307" class="svg-muted" font-size="13">harness · routing</text>',
      '  <text x="350" y="330" class="svg-muted" font-size="13">tools · verification</text>',
      '  <text x="350" y="353" class="svg-muted" font-size="13">cost per task</text>',
      '  <path d="M548 306h52" fill="none" class="svg-accent-line" stroke-width="3"/>',
      '  <rect x="600" y="244" width="230" height="124" class="svg-text"/>',
      '  <text x="628" y="292" class="svg-paper" font-size="18" font-weight="800">OUTCOME</text>',
      '  <text x="628" y="322" class="svg-paper" font-size="13">reliable completion</text>',
      '  <text x="628" y="345" class="svg-accent" font-size="13" font-weight="800">SYSTEM UP</text>',
      '</g>',
      '<text x="58" y="457" class="svg-type svg-muted" font-size="14">From token price to completed work.</text>'
    ))
  },

  'sol-pricing-channel-comparison': {
    label: 'So sánh giá GPT-5.6 Sol giữa Amazon Bedrock và OpenAI first-party',
    mobile: () => lines(
      '<div class="mobile-chart" role="img" aria-label="Bedrock có giá input 4 đô và output 20 đô; OpenAI API có giá input 5 đô và output 30 đô trên mỗi triệu token">',
      '  <div class="mobile-chart__legend"><span>Input</span><span>Output</span></div>',
      '  <div class="mobile-chart__row"><strong>Bedrock</strong><span style="--bar: 67%">$4</span><span style="--bar: 67%">$20</span></div>',
      '  <div class="mobile-chart__row"><strong>OpenAI API</strong><span style="--bar: 83%">$5</span><span style="--bar: 100%">$30</span></div>',
      '</div>'
    ),
    svg: () => svgShell('So sánh giá GPT-5.6 Sol giữa Amazon Bedrock và OpenAI first-party', lines(
      '<text x="52" y="60" class="svg-type svg-muted" font-size="14" font-weight="700" letter-spacing="2">SOL PRICING · USD / 1M TOKENS</text>',
      '<line x1="52" y1="88" x2="868" y2="88" class="svg-line" stroke-width="1"/>',
      '<g class="svg-type">',
      '  <text x="52" y="145" class="svg-text" font-size="22" font-weight="800">CHANNEL</text>',
      '  <text x="588" y="145" class="svg-muted" font-size="13" font-weight="700">INPUT</text>',
      '  <text x="744" y="145" class="svg-muted" font-size="13" font-weight="700">OUTPUT</text>',
      '  <rect x="52" y="174" width="816" height="104" class="svg-accent-soft"/>',
      '  <text x="82" y="218" class="svg-text" font-size="21" font-weight="800">AMAZON BEDROCK</text>',
      '  <text x="82" y="248" class="svg-muted" font-size="13">promotional · through at least 21.11.2026</text>',
      '  <text x="588" y="235" class="svg-accent" font-size="34" font-weight="800">$4</text>',
      '  <text x="744" y="235" class="svg-accent" font-size="34" font-weight="800">$20</text>',
      '  <rect x="52" y="294" width="816" height="104" class="svg-paper svg-line" stroke-width="1.5"/>',
      '  <text x="82" y="338" class="svg-text" font-size="21" font-weight="800">OPENAI API</text>',
      '  <text x="82" y="368" class="svg-muted" font-size="13">first-party docs · at scan time</text>',
      '  <text x="588" y="355" class="svg-text" font-size="34" font-weight="800">$5</text>',
      '  <text x="744" y="355" class="svg-text" font-size="34" font-weight="800">$30</text>',
      '</g>',
      '<text x="52" y="454" class="svg-type svg-muted" font-size="14">Pricing is channel-specific. Recheck before changing assumptions.</text>'
    ))
  },

  'model-harness-environment-verification': {
    label: 'Agent stack gồm model, harness, environment và verification',
    svg: () => svgShell('Agent stack gồm model, harness, environment và verification', lines(
      '<text x="52" y="60" class="svg-type svg-muted" font-size="14" font-weight="700" letter-spacing="2">PRODUCTION AGENT STACK</text>',
      '<g class="svg-type">',
      '  <rect x="52" y="104" width="190" height="106" class="svg-paper svg-line" stroke-width="1.5"/>',
      '  <text x="78" y="148" class="svg-accent" font-size="13" font-weight="800">01</text>',
      '  <text x="78" y="180" class="svg-text" font-size="22" font-weight="800">MODEL</text>',
      '  <path d="M242 157h36" fill="none" class="svg-accent-line" stroke-width="3"/>',
      '  <rect x="278" y="104" width="190" height="106" class="svg-paper svg-line" stroke-width="1.5"/>',
      '  <text x="304" y="148" class="svg-accent" font-size="13" font-weight="800">02</text>',
      '  <text x="304" y="180" class="svg-text" font-size="22" font-weight="800">HARNESS</text>',
      '  <path d="M468 157h36" fill="none" class="svg-accent-line" stroke-width="3"/>',
      '  <rect x="504" y="104" width="190" height="106" class="svg-paper svg-line" stroke-width="1.5"/>',
      '  <text x="530" y="148" class="svg-accent" font-size="13" font-weight="800">03</text>',
      '  <text x="530" y="180" class="svg-text" font-size="20" font-weight="800">ENVIRONMENT</text>',
      '  <path d="M694 157h36" fill="none" class="svg-accent-line" stroke-width="3"/>',
      '  <rect x="730" y="104" width="138" height="106" class="svg-text"/>',
      '  <text x="752" y="148" class="svg-accent" font-size="13" font-weight="800">04</text>',
      '  <text x="752" y="178" class="svg-paper" font-size="16" font-weight="800">VERIFY</text>',
      '  <rect x="52" y="260" width="816" height="132" class="svg-strong"/>',
      '  <text x="82" y="304" class="svg-text" font-size="18" font-weight="800">EXECUTION LOOP</text>',
      '  <text x="82" y="340" class="svg-muted" font-size="14">observe → choose tool → act → recover → check result</text>',
      '  <path d="M82 365h716" fill="none" class="svg-line" stroke-width="2" stroke-dasharray="10 8"/>',
      '  <circle cx="798" cy="365" r="8" class="svg-accent"/>',
      '</g>',
      '<text x="52" y="454" class="svg-type svg-muted" font-size="14">Reliability is an end-to-end property, not a model-only score.</text>'
    ))
  },

  'browser-computer-use': {
    label: 'Browser agent quan sát giao diện và hành động qua approval boundary',
    svg: () => svgShell('Browser agent quan sát giao diện và hành động qua approval boundary', lines(
      '<text x="52" y="60" class="svg-type svg-muted" font-size="14" font-weight="700" letter-spacing="2">BROWSER / COMPUTER USE</text>',
      '<rect x="52" y="92" width="535" height="330" rx="6" class="svg-paper svg-line" stroke-width="1.5"/>',
      '<rect x="52" y="92" width="535" height="48" rx="6" class="svg-strong"/>',
      '<circle cx="81" cy="116" r="6" class="svg-accent"/>',
      '<circle cx="103" cy="116" r="6" class="svg-muted"/>',
      '<rect x="86" y="178" width="176" height="18" rx="3" class="svg-strong"/>',
      '<rect x="86" y="216" width="350" height="70" rx="4" fill="none" class="svg-line" stroke-width="1.5"/>',
      '<rect x="86" y="312" width="122" height="44" class="svg-accent"/>',
      '<text x="112" y="340" class="svg-type svg-paper" font-size="14" font-weight="800">CONTINUE</text>',
      '<rect x="77" y="206" width="386" height="96" rx="6" fill="none" class="svg-accent-line" stroke-width="3" stroke-dasharray="8 7"/>',
      '<path d="M589 248h76" fill="none" class="svg-accent-line" stroke-width="3"/>',
      '<g transform="translate(690 158)" class="svg-type">',
      '  <circle cx="76" cy="76" r="76" class="svg-text"/>',
      '  <text x="76" y="68" text-anchor="middle" class="svg-paper" font-size="14" font-weight="700">UNDERSTAND</text>',
      '  <text x="76" y="91" text-anchor="middle" class="svg-paper" font-size="14" font-weight="700">THE TARGET</text>',
      '  <text x="76" y="114" text-anchor="middle" class="svg-accent" font-size="12" font-weight="800">THEN APPROVE</text>',
      '</g>',
      '<text x="690" y="363" class="svg-type svg-text" font-size="18" font-weight="800">OBSERVE → ACT</text>',
      '<text x="690" y="390" class="svg-type svg-muted" font-size="14">with a human boundary</text>'
    ))
  },

  'chat-tools-workflow-workspace': {
    label: 'AI dịch chuyển từ chat qua tools và workflow tới workspace',
    svg: () => svgShell('AI dịch chuyển từ chat qua tools và workflow tới workspace', lines(
      '<text x="48" y="58" class="svg-type svg-muted" font-size="14" font-weight="700" letter-spacing="2">WHERE AI WORK HAPPENS</text>',
      '<line x1="116" y1="214" x2="804" y2="214" class="svg-line" stroke-width="2"/>',
      '<g class="svg-type">',
      '  <g transform="translate(52 134)"><rect width="152" height="160" class="svg-paper svg-line" stroke-width="1.5"/><text x="24" y="42" class="svg-accent" font-size="13" font-weight="800">01</text><text x="24" y="89" class="svg-text" font-size="25" font-weight="800">CHAT</text><text x="24" y="119" class="svg-muted" font-size="13">ask · answer</text></g>',
      '  <g transform="translate(268 134)"><rect width="152" height="160" class="svg-paper svg-line" stroke-width="1.5"/><text x="24" y="42" class="svg-accent" font-size="13" font-weight="800">02</text><text x="24" y="89" class="svg-text" font-size="25" font-weight="800">TOOLS</text><text x="24" y="119" class="svg-muted" font-size="13">call · return</text></g>',
      '  <g transform="translate(484 134)"><rect width="152" height="160" class="svg-paper svg-line" stroke-width="1.5"/><text x="24" y="42" class="svg-accent" font-size="13" font-weight="800">03</text><text x="24" y="89" class="svg-text" font-size="22" font-weight="800">WORKFLOW</text><text x="24" y="119" class="svg-muted" font-size="13">plan · act · verify</text></g>',
      '  <g transform="translate(700 114)"><rect width="168" height="200" class="svg-text"/><text x="24" y="48" class="svg-accent" font-size="13" font-weight="800">04 / NOW</text><text x="24" y="99" class="svg-paper" font-size="21" font-weight="800">WORKSPACE</text><text x="24" y="131" class="svg-paper" font-size="13">people + agents</text><text x="24" y="154" class="svg-paper" font-size="13">shared context</text></g>',
      '</g>'
    ), '0 0 920 390')
  }
};

visuals['model-harness-verification'] = visuals['model-harness-environment-verification'];

const fallbackVisual = {
  label: 'Minh hoạ biên tập trung tính cho tín hiệu AI',
  svg: () => svgShell('Minh hoạ biên tập trung tính cho tín hiệu AI', lines(
    '<text x="52" y="60" class="svg-type svg-muted" font-size="14" font-weight="700" letter-spacing="2">EDITORIAL CONTEXT</text>',
    '<g class="svg-type">',
    '  <rect x="52" y="126" width="220" height="170" class="svg-paper svg-line" stroke-width="1.5"/>',
    '  <text x="82" y="179" class="svg-accent" font-size="13" font-weight="800">01</text><text x="82" y="224" class="svg-text" font-size="25" font-weight="800">SIGNAL</text><text x="82" y="256" class="svg-muted" font-size="13">what changed</text>',
    '  <path d="M272 211h52" fill="none" class="svg-accent-line" stroke-width="3"/>',
    '  <rect x="324" y="106" width="272" height="210" class="svg-accent-soft"/>',
    '  <text x="358" y="162" class="svg-accent" font-size="13" font-weight="800">02</text><text x="358" y="211" class="svg-text" font-size="28" font-weight="800">SYSTEM</text><text x="358" y="246" class="svg-muted" font-size="13">where it matters</text>',
    '  <path d="M596 211h52" fill="none" class="svg-accent-line" stroke-width="3"/>',
    '  <rect x="648" y="126" width="220" height="170" class="svg-text"/>',
    '  <text x="678" y="179" class="svg-accent" font-size="13" font-weight="800">03</text><text x="678" y="224" class="svg-paper" font-size="25" font-weight="800">ACTION</text><text x="678" y="256" class="svg-paper" font-size="13">what to test next</text>',
    '</g>',
    '<text x="52" y="414" class="svg-type svg-muted" font-size="14">The editorial structure remains intact without custom artwork.</text>'
  ), '0 0 920 460')
};

export function renderVisual(visual, { hero = false, assetPrefix = '' } = {}) {
  const kind = typeof visual?.kind === 'string' ? visual.kind : 'editorial';
  const caption = typeof visual?.caption === 'string' && visual.caption.trim()
    ? visual.caption.trim()
    : 'Minh hoạ biên tập cho tín hiệu chính của edition.';
  const credit = typeof visual?.credit === 'string' && visual.credit.trim()
    ? '<span class="visual-credit">' + escapeHtml(visual.credit.trim()) + '</span>'
    : '';
  const classes = hero ? 'editorial-visual hero-visual' : 'editorial-visual inline-visual';

  if ((kind === 'image' || kind === 'screenshot') && typeof visual?.src === 'string' && visual.src.trim()) {
    const alt = typeof visual?.alt === 'string' && visual.alt.trim() ? visual.alt.trim() : caption;
    const rawSrc = visual.src.trim();
    const src = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(rawSrc) ? rawSrc : assetPrefix + rawSrc;
    return '<figure class="' + classes + ' visual--' + kind + '" data-visual-kind="' + kind + '">\n' +
      '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async">\n' +
      '<figcaption>' + escapeHtml(caption) + credit + '</figcaption>\n' +
      '</figure>';
  }

  const key = typeof visual?.key === 'string' ? visual.key : 'unknown';
  const renderer = visuals[key] ?? fallbackVisual;
  const fallbackAttribute = visuals[key] ? '' : ' data-visual-fallback="true"';
  const mobile = typeof renderer.mobile === 'function' ? renderer.mobile() : '';

  return '<figure class="' + classes + ' visual--' + escapeHtml(kind) + '" data-visual-kind="' + escapeHtml(kind) + '" data-visual-key="' + escapeHtml(key) + '"' + fallbackAttribute + '>\n' +
    '<div class="visual__desktop">' + renderer.svg() + '</div>\n' + mobile + '\n' +
    '<figcaption>' + escapeHtml(caption) + credit + '</figcaption>\n' +
    '</figure>';
}
