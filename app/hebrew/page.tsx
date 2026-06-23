import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מיכאל נירגד גיא",
  description: "מיכאל נירגד גיא — קריאייטיב, וידאו, תוכן וניהול פרויקטים דיגיטליים.",
};

const logos = [
  { name: "כאן 11", src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kan11Logo.svg", type: "logo" },
  { name: "הקרן החדשה לישראל", src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/%D7%9C%D7%95%D7%92%D7%95%20%D7%94%D7%A7%D7%A8%D7%9F%20%D7%94%D7%97%D7%93%D7%A9%D7%94%20%D7%9C%D7%99%D7%A9%D7%A8%D7%90%D7%9C.png", type: "logo" },
  { name: "שלי יחימוביץ׳", src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/%D7%A9%D7%9C%D7%99%20%D7%99%D7%97%D7%99%D7%9E%D7%95%D7%91%D7%99%D7%A5%20%D7%AA%D7%9E%D7%95%D7%A0%D7%AA%20%D7%91%D7%97%D7%99%D7%A8%D7%95%D7%AA%202019.jpg", type: "person" },
  { name: "דרכנו", src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/%D7%9C%D7%95%D7%92%D7%95%20%D7%AA%D7%A0%D7%95%D7%A2%D7%AA%20%D7%93%D7%A8%D7%9B%D7%A0%D7%95.png", type: "logo" },
  { name: "Wolt", src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Wolt-logo-2019.png", type: "logo" },
  { name: "Payoneer", src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Payoneer%20logo.svg", type: "logo" },
  { name: "כתר פלסטיק", src: "https://en.wikipedia.org/wiki/Special:Redirect/file/Keter%20Plastics%20logo.svg", type: "logo" },
  { name: "Intel Ignite", src: "https://he.wikipedia.org/wiki/Special:Redirect/file/Intel%20Ignite%20Logo.png", type: "logo" },
  { name: "Taboola", src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Taboola%20logo.svg", type: "logo" },
  { name: "עיריית ירושלים", src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Emblem%20of%20Jerusalem.svg", type: "logo" },
  { name: "הדר לביא", src: "/hadar-lavi.png", type: "person" },
  { name: "BeerBazaar", src: "https://beerbazaar.co.il/cdn/shop/t/32/assets/footer-logo.png?v=152788136598769969031770881302", type: "logo" },
  { name: "רשות החדשנות", src: "https://innovationisrael.org.il/en/wp-content/uploads/sites/3/2024/07/%D7%A8%D7%A9%D7%95%D7%AA-%D7%94%D7%97%D7%93%D7%A9%D7%A0%D7%95%D7%AA.png", type: "logo" },
  { name: "Melio", src: "https://he.wikipedia.org/wiki/Special:Redirect/file/Melio%20logo.svg", type: "logo" },
] as const;

const workItems = [
  <><a href="https://www.instagram.com/reel/C3z3HVgI7Y_/?igsh=dXdkYW85aDkzdXgw" target="_blank" rel="noopener noreferrer">אחד</a> מתוך מאות סרטונים שעשינו ב״ליברל״ בתקופה שבה ניהלתי את המגזין הדיגיטלי.<br />פה יש <a href="https://www.instagram.com/lbrl_il/reels" target="_blank" rel="noopener noreferrer">עוד</a>. מ<a href="https://www.instagram.com/reel/C4-d5NHoUSa/?igsh=ajJ6M2RpNHdxdDA=" target="_blank" rel="noopener noreferrer">שטויות כאלה</a>, ועד דברים שנותנים <a href="https://www.instagram.com/reel/C0_5hsWoP-K/?igsh=MTQ3NHZsa2drdzNuYg==" target="_blank" rel="noopener noreferrer">בוקס בבטן</a>.</>,
  <>סרטון ש<a href="https://drive.google.com/file/d/1YmTmfti-PMlMRQROapJNt2ee0ikv135g/view?usp=drive_link" target="_blank" rel="noopener noreferrer">מכניס אור ללב</a> שיצרתי עבור עיריית ירושלים.</>,
  <>יותר קצר? יותר מצחיק? יותר AI? עדיין מגזר ציבורי? <a href="https://drive.google.com/file/d/19xN3MCDDy1fkfK_8M6TX0RCqTwsovXGb/view?usp=drive_link" target="_blank" rel="noopener noreferrer">בבקשה</a>.</>,
  <>אני גם כותב תסריטים באנגלית <a href="https://drive.google.com/file/d/1MAs5uelNsqbGySJaaNphdGHRaOpoedGB/view?usp=drive_link" target="_blank" rel="noopener noreferrer">לחברות טק</a> — עם הסברים פשוטים <a href="https://drive.google.com/file/d/1DW0h2td__nPJXzlFHZpcwnTu4wne2F2V/view?usp=drive_link" target="_blank" rel="noopener noreferrer">לרעיונות מורכבים</a>.</>,
  <>אין לכם זמן עכשיו, אבל אם אתם אוהבים מוזיקה ואת הכוכבים, בסוף היום <a href="https://youtu.be/dliU3jfUtBc" target="_blank" rel="noopener noreferrer">תרצו לראות את זה</a>.</>,
];

const styles = `
  .hebrewPage{min-height:100vh;background:radial-gradient(circle at 8% 0%,rgba(31,79,133,.12),transparent 28rem),radial-gradient(circle at 100% 14%,rgba(176,120,66,.13),transparent 26rem),#f6f2ea;color:#171615;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;line-height:1.6;padding:22px 14px 38px;}
  .shell{width:min(100%,880px);margin:0 auto;overflow:hidden;border:1px solid rgba(23,22,21,.11);border-radius:30px;background:rgba(255,255,255,.84);box-shadow:0 18px 55px rgba(28,22,16,.09);}
  .hero{padding:40px clamp(22px,6vw,58px) 24px;}
  .title{margin:0 0 10px;font-size:clamp(34px,6.2vw,58px);line-height:1.02;letter-spacing:-.04em;font-weight:820;}
  .subtitle{max-width:600px;margin:0;font-size:clamp(17px,2.2vw,22px);line-height:1.48;color:#2d2925;font-weight:520;}
  .clientTitle{margin:32px 0 10px;color:#746d64;font-size:14px;}
  .marquee{position:relative;margin-inline:calc(clamp(22px,6vw,58px) * -1);border-block:1px solid rgba(23,22,21,.11);background:rgba(255,255,255,.52);overflow:hidden;}
  .marquee:before,.marquee:after{content:"";position:absolute;top:0;bottom:0;width:70px;z-index:2;pointer-events:none;}
  .marquee:before{right:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.92));}
  .marquee:after{left:0;background:linear-gradient(270deg,transparent,rgba(255,255,255,.92));}
  .track{width:max-content;display:flex;gap:10px;align-items:center;padding:12px 10px;animation:scrollLogos 58s linear infinite;}
  .marquee:hover .track{animation-play-state:paused;}
  @keyframes scrollLogos{from{transform:translateX(0)}to{transform:translateX(50%)}}
  .logoItem{flex:0 0 auto;width:112px;height:52px;display:flex;align-items:center;justify-content:center;padding:10px 13px;border:1px solid rgba(23,22,21,.11);border-radius:15px;background:#fff;overflow:hidden;user-select:none;}
  .logoItem img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;filter:saturate(.96) contrast(.99);}
  .logoItem.person{width:78px;height:52px;padding:0;border-radius:16px;background:#ece5d8;}
  .logoItem.person img{width:100%;height:100%;object-fit:cover;max-width:none;max-height:none;filter:none;}
  .content{padding:28px clamp(22px,6vw,58px) 42px;}
  .quick{display:grid;gap:14px;margin-bottom:34px;padding-bottom:28px;border-bottom:1px solid rgba(23,22,21,.11);}
  .quick p{margin:0;max-width:650px;font-size:clamp(16px,1.85vw,19px);}
  .muted{color:#746d64;}
  a{color:#174b7e;text-decoration-thickness:.075em;text-underline-offset:.22em;font-weight:720;}
  a:hover{color:#8a4b21;}
  .cvLinks{display:inline-flex;flex-wrap:wrap;gap:8px;}
  .pill{display:inline-flex;align-items:center;min-height:34px;padding:6px 12px;border:1px solid rgba(23,22,21,.11);border-radius:999px;background:#fff;text-decoration:none;font-size:14px;font-weight:700;}
  .sectionTitle{margin:0 0 14px;font-size:clamp(23px,3.2vw,34px);line-height:1.1;letter-spacing:-.03em;}
  .workList{display:grid;gap:0;margin:0;padding:0;list-style:none;counter-reset:works;}
  .workItem{display:grid;grid-template-columns:30px 1fr;gap:12px;align-items:start;padding:14px 0;border-bottom:1px solid rgba(23,22,21,.11);counter-increment:works;}
  .workItem:before{content:counter(works,decimal-leading-zero);width:30px;height:30px;display:grid;place-items:center;border-radius:999px;border:1px solid rgba(23,22,21,.11);color:#746d64;font-size:11px;font-weight:760;direction:ltr;background:rgba(255,255,255,.55);margin-top:.08em;}
  .workItem p{margin:0;font-size:clamp(16px,1.9vw,19px);line-height:1.62;}
  .contact{display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px 18px;align-items:center;margin-top:34px;padding:18px 20px;border-radius:22px;background:linear-gradient(135deg,#181716,#173d63);color:#fff;}
  .contactTitle{margin:0;font-size:clamp(20px,2.8vw,27px);line-height:1.1;letter-spacing:-.02em;font-weight:780;}
  .contactSubtitle{margin:5px 0 0;color:rgba(255,255,255,.68);font-size:14px;}
  .contactLinks{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;direction:ltr;}
  .contactLinks a{display:inline-flex;align-items:center;min-height:34px;padding:6px 11px;border-radius:999px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);color:#fff;text-decoration:none;font-size:14px;}
  @media (max-width:640px){.hebrewPage{padding:8px}.shell{border-radius:24px}.hero{padding-top:30px}.marquee:before,.marquee:after{width:42px}.logoItem{width:100px;height:48px}.logoItem.person{width:72px;height:48px}.contactLinks{justify-content:flex-start}}
  @media (prefers-reduced-motion:reduce){.track{animation:none;flex-wrap:wrap;width:auto;justify-content:center}}
`;

export default function HebrewPage() {
  const logoItems = [...logos, ...logos];

  return (
    <main className="hebrewPage" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="shell">
        <header className="hero">
          <h1 className="title">מיכאל נירגד גיא</h1>
          <p className="subtitle">איש קריאייטיב, מפיק ומנהל פרויקטים דיגיטליים, בן אדם.</p>

          <p className="clientTitle">מבחר לקוחות שעבדתי איתם:</p>
          <div className="marquee" aria-label="מבחר לקוחות שעבדתי איתם">
            <div className="track">
              {logoItems.map((logo, index) => (
                <div className={`logoItem ${logo.type === "person" ? "person" : ""}`} aria-label={logo.name} title={logo.name} key={`${logo.name}-${index}`}>
                  <img src={logo.src} alt={logo.name} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="content">
          <div className="quick">
            <p><a href="https://mng-vid.com" target="_blank" rel="noopener noreferrer">זה האתר שלי</a>. <span className="muted">הוא באנגלית, ויש שם אוגר מוזר שעשוי מ-AI.</span></p>
            <p>
              יותר oldschool? יש גם קורות חיים:{" "}
              <span className="cvLinks">
                <a className="pill" href="https://drive.google.com/file/d/1ZdJ663iItwz6FIcQAgmpOts7dEZ2GBHK/view?usp=sharing" target="_blank" rel="noopener noreferrer">עברית</a>
                <a className="pill" href="https://drive.google.com/file/d/1KLLrF0nmQUDln5zzW_6v3F3ixJ0X2mdR/view?usp=sharing" target="_blank" rel="noopener noreferrer">English</a>
              </span>
            </p>
          </div>

          <section aria-labelledby="work-title">
            <h2 className="sectionTitle" id="work-title">כמה עבודות רלוונטיות</h2>
            <ol className="workList">
              {workItems.map((item, index) => (
                <li className="workItem" key={index}>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="contact" aria-labelledby="contact-title">
            <div>
              <p className="contactTitle" id="contact-title">מוזמנים לדבר איתי</p>
              <p className="contactSubtitle">במייל או בטלפון.</p>
            </div>
            <div className="contactLinks">
              <a href="mailto:michael.nirgadguy@gmail.com">michael.nirgadguy@gmail.com</a>
              <a href="tel:+972504441505">050-4441505</a>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
