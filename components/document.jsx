import localFont from "next/font/local";
import { basePath } from "../lib/site.mjs";
import { PageBackdrop } from "./morning-art";
import "../app/globals.css";

const sans = localFont({
  src: [
    {
      path: "../assets/fonts/be-vietnam-pro-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../assets/fonts/be-vietnam-pro-vietnamese-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../assets/fonts/be-vietnam-pro-latin-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../assets/fonts/be-vietnam-pro-vietnamese-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../assets/fonts/be-vietnam-pro-latin-800-normal.woff2",
      weight: "800",
    },
    {
      path: "../assets/fonts/be-vietnam-pro-vietnamese-800-normal.woff2",
      weight: "800",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});
const serif = localFont({
  src: [
    {
      path: "../assets/fonts/source-serif-4-latin-wght-normal.woff2",
      weight: "200 900",
    },
    {
      path: "../assets/fonts/source-serif-4-vietnamese-wght-normal.woff2",
      weight: "200 900",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "AI Morning",
  icons: { icon: `${basePath}/assets/mark.svg` },
};
const themeScript = `try{let s=localStorage;let t=s.getItem('ai-morning-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;if(s.getItem('ai-morning-reading')==='true')document.documentElement.dataset.reading='true';if(s.getItem('ai-morning-large')==='true'||(!s.getItem('ai-morning-large')&&s.getItem('ai-morning-large-type')==='true'))document.documentElement.dataset.large='true'}catch{}`;

export default function Document({ children, language }) {
  return (
    <html
      lang={language}
      className={`${sans.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PageBackdrop />
        {children}
      </body>
    </html>
  );
}
