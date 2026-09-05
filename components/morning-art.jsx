// Decorative, theme-aware SVGs. No images, filters, or browser JavaScript to load.
function Spark({ x, y, size = 12 }) {
  return (
    <path
      d={`M${x} ${y - size}Q${x} ${y} ${x + size} ${y}Q${x} ${y} ${x} ${y + size}Q${x} ${y} ${x - size} ${y}Q${x} ${y} ${x} ${y - size}Z`}
    />
  );
}

export function PageBackdrop() {
  return (
    <div className="page-backdrop" aria-hidden="true">
      <svg className="backdrop-sunrise" viewBox="0 0 800 860" fill="none">
        <circle cx="640" cy="210" r="265" className="art-wash-sage" />
        <circle cx="635" cy="215" r="197" className="art-wash-peach" />
        <g className="art-line" strokeWidth="1">
          <circle cx="635" cy="215" r="225" />
          <circle cx="635" cy="215" r="243" strokeDasharray="2 9" />
          <path d="M122 391C281 480 547 111 743 293S610 762 299 650" />
          <path d="M80 416C247 514 564 157 746 327S586 794 252 679" />
          <path d="M32 738H798M81 757H729" />
        </g>
        <g className="art-accent">
          <Spark x={311} y={303} size={17} />
          <Spark x={700} y={550} size={24} />
          <circle cx="206" cy="567" r="5" />
          <circle cx="382" cy="73" r="4" />
        </g>
        <g className="art-line" strokeWidth="1.5">
          <path d="M400 609h20m-10-10v20M98 340h12m-6-6v12" />
          <circle cx="525" cy="739" r="6" />
        </g>
      </svg>
      <svg className="backdrop-margin" viewBox="0 0 180 1000" fill="none">
        <g className="art-line" strokeWidth="1">
          <path d="M-80 30C300 175-210 443 84 621S-50 938 150 1090" />
          <path d="M-60 12C320 157-190 425 104 603S-30 920 170 1072" />
          <circle cx="28" cy="350" r="37" />
          <circle cx="28" cy="350" r="48" strokeDasharray="2 7" />
        </g>
        <g className="art-accent">
          <Spark x={53} y={737} size={17} />
          <circle cx="44" cy="98" r="4" />
        </g>
      </svg>
      <svg className="backdrop-bottom" viewBox="0 0 900 360" fill="none">
        <path d="M0 340Q450-190 900 340" className="art-wash-sage" />
        <g className="art-line" strokeWidth="1">
          <path d="M-40 340Q450-260 940 340M-50 360Q450-240 950 360" />
          <path d="M85 297h730M130 312h640M205 327h490" />
        </g>
        <g className="art-accent">
          <Spark x={170} y={211} />
          <Spark x={747} y={140} size={19} />
        </g>
      </svg>
    </div>
  );
}

export function MorningDesk({ className = "" }) {
  return (
    <div className={`morning-desk ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1200 170" fill="none">
        <path d="M0 146H1200" className="art-line" />
        <path d="M0 151H1200" className="art-line" strokeDasharray="1 8" />
        <g className="desk-sun">
          <path d="M502 145a98 98 0 0 1 196 0Z" className="art-wash-peach" />
          <path
            d="M514 145a86 86 0 0 1 172 0M528 145a72 72 0 0 1 144 0"
            className="art-accent-line"
            strokeWidth="1.3"
          />
          <g
            className="art-accent-line"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M600 14v16m-65-1 8 14m-55 35 14 8m166-57-8 14m55 35-14 8" />
          </g>
        </g>
        <g
          className="desk-terminal"
          transform="translate(96 22) rotate(-5 90 65)"
        >
          <rect
            x="8"
            y="9"
            width="171"
            height="116"
            rx="8"
            className="art-wash-sage"
          />
          <rect
            x="0"
            y="0"
            width="171"
            height="116"
            rx="8"
            className="art-paper art-ink-line"
            strokeWidth="1.5"
          />
          <path d="M0 25h171" className="art-ink-line" />
          <g className="art-accent">
            <circle cx="14" cy="13" r="3" />
            <circle cx="25" cy="13" r="3" opacity=".5" />
            <circle cx="36" cy="13" r="3" opacity=".3" />
          </g>
          <path
            d="m21 46 11 9-11 9m24 0h22m-45 18h90m-90 13h62"
            className="art-ink-line"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="m123 83 7 7 16-20"
            className="art-accent-line"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g className="desk-cup" transform="translate(845 20)">
          <ellipse cx="71" cy="123" rx="73" ry="9" className="art-wash-sage" />
          <path
            d="M17 58h88v29c0 28-17 35-44 35S17 115 17 87Z"
            className="art-paper art-ink-line"
            strokeWidth="1.5"
          />
          <path
            d="M106 67h9c25 0 24 33-11 34"
            className="art-ink-line"
            strokeWidth="1.5"
          />
          <ellipse
            cx="61"
            cy="58"
            rx="44"
            ry="8"
            className="art-wash-peach art-ink-line"
            strokeWidth="1.5"
          />
          <g
            className="desk-steam art-accent-line"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M43 41c-13-13 14-17 2-30m22 27c-13-13 14-17 2-30m20 32c-10-9 10-14 2-23" />
          </g>
          <g className="art-accent">
            <Spark x={62} y={91} size={12} />
          </g>
        </g>
        <g
          className="desk-notes"
          transform="translate(1000 55) rotate(9 62 40)"
        >
          <path d="M4 10h111v72H4Z" className="art-wash-sage" />
          <path
            d="M0 0h111v72H0Z"
            className="art-paper art-ink-line"
            strokeWidth="1.5"
          />
          <path
            d="M15 17h42m-42 11h76m-76 11h76m-76 11h55"
            className="art-line"
            strokeWidth="2"
          />
          <path
            d="m82 12 5 5 11-13"
            className="art-accent-line"
            strokeWidth="1.5"
          />
        </g>
        <g className="desk-orbit art-line" strokeWidth="1.2">
          <path
            d="M305 92c64-72 93 47 159-22M724 105c17-26 41-28 71-10"
            strokeDasharray="3 7"
          />
          <path d="m455 66 10 2-5 10m325 8 7 9-11 1" />
        </g>
        <g className="art-accent">
          <Spark x={353} y={46} size={12} />
          <Spark x={767} y={38} size={9} />
          <Spark x={1143} y={108} size={10} />
        </g>
        <g className="art-line" strokeWidth="1.2">
          <path d="M39 98h12m-6-6v12M410 122h10m-5-5v10" />
          <circle cx="318" cy="127" r="4" />
        </g>
      </svg>
    </div>
  );
}

export function CornerGarden() {
  return (
    <svg
      className="corner-garden"
      viewBox="0 0 180 240"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M83 239V89m0 107c0-39-59-14-59-68 48 0 59 26 59 68m0-46c0-46 66-27 66-79-47 0-66 37-66 79m0-40c0-43-38-27-38-69 36 0 38 28 38 69"
        className="art-ink-line"
        strokeWidth="1.5"
      />
      <path
        d="M50 189h70l-9 47H59Z"
        className="art-wash-peach art-ink-line"
        strokeWidth="1.5"
      />
      <path
        d="M46 189h78v9H46Z"
        className="art-paper art-ink-line"
        strokeWidth="1.5"
      />
      <g className="art-accent">
        <Spark x={138} y={35} size={13} />
        <circle cx="22" cy="88" r="3" />
      </g>
    </svg>
  );
}
