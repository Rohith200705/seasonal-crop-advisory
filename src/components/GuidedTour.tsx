"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/language";
import { useToast } from "./Toast";

type Step = {
  path: string;
  selector: string;
  title: { en: string; hi: string; ta: string };
  text: { en: string; hi: string; ta: string };
  optional?: boolean;
};

const STEPS: Step[] = [
  {
    path: "/",
    selector: '[data-tour="hero-title"]',
    title: { en: "Welcome", hi: "स्वागत है", ta: "வரவேற்கிறோம்" },
    text: {
      en: "This is Seasonal Crop Advisory — a profit-aware, climate-resilient crop planning tool for Indian farmers. This 60-second tour will point out everything.",
      hi: "यह सीज़नल क्रॉप एडवाइज़री है — भारतीय किसानों के लिए लाभ-केंद्रित, जलवायु-सहनशील फ़सल योजना उपकरण। यह 60-सेकंड का टूर आपको सब दिखाएगा।",
      ta: "இது Seasonal Crop Advisory — இந்திய விவசாயிகளுக்கான இலாப-அறிவிப்பு, காலநிலை-தாங்கும் பயிர் திட்டமிடல் கருவி. இந்த 60-வினாடி சுற்றுப்பயணம் எல்லாவற்றையும் சுட்டிக்காட்டும்.",
    },
  },
  {
    path: "/",
    selector: '[data-tour="lang-switch"]',
    title: { en: "Language switch", hi: "भाषा बदलें", ta: "மொழி மாற்றம்" },
    text: {
      en: "Tap here to switch the whole app between English, हिन्दी and தமிழ் — every label, reason and button translates instantly.",
      hi: "यहाँ टैप करके पूरे ऐप को अंग्रेज़ी, हिन्दी और तमिल के बीच बदलें — हर लेबल, कारण और बटन तुरंत अनुवाद होते हैं।",
      ta: "இங்கே தட்டி, முழு செயலியையும் English, हिन्दी, தமிழ் இடையே மாற்றலாம் — ஒவ்வொரு விளக்கமும் காரணமும் உடனே மொழிபெயர்க்கப்படும்.",
    },
  },
  {
    path: "/advisory",
    selector: '[data-tour="season-picker"]',
    title: { en: "Pick your season", hi: "मौसम चुनें", ta: "பருவத்தைத் தேர்ந்தெடுக்கவும்" },
    text: {
      en: "Choose Kharif (monsoon), Rabi (winter) or Zaid (summer). The advisory re-ranks all 22 crops for that season's sowing window.",
      hi: "खरीफ़ (मानसून), रबी (सर्दी) या ज़ाइद (गर्मी) चुनें। सलाह उस मौसम की बुवाई विंडो के लिए सभी 22 फ़सलों को फिर से क्रमबद्ध करती है।",
      ta: "காரிஃ (பருவமழை), ரபி (குளிர்) அல்லது ஜைத் (வெப்பம்) தேர்ந்தெடுக்கவும். அந்தப் பருவ விதைக்கும் காலத்திற்காக 22 பயிர்களையும் மறுவரிசைப்படுத்தும்.",
    },
  },
  {
    path: "/advisory",
    selector: '[data-tour="soil-fields"]',
    title: { en: "Soil & rainfall inputs", hi: "मिट्टी और वर्षा विवरण", ta: "மண் & மழை விவரங்கள்" },
    text: {
      en: "Enter your soil type, pH and last season's rainfall. These drive the soil-fit and climate-fit scores behind every recommendation.",
      hi: "अपनी मिट्टी का प्रकार, pH और पिछले मौसम की वर्षा भरें। ये हर सिफ़ारिश के पीछे सॉइल-फ़िट और क्लाइमेट-फ़िट स्कोर तय करते हैं।",
      ta: "உங்கள் மண் வகை, pH மற்றும் கடந்த பருவ மழையை உள்ளிடவும். ஒவ்வொரு பரிந்துரைக்கும் பின்னால் உள்ள மண்-பொருத்த, காலநிலை-பொருத்த மதிப்பெண்களை இவை தீர்மானிக்கின்றன.",
    },
  },
  {
    path: "/advisory",
    selector: '[data-tour="weather-fields"]',
    title: { en: "Heat & climate", hi: "गर्मी और जलवायु", ta: "வெப்பம் & காலநிலை" },
    text: {
      en: "Add this year's temperature range and humidity. Extreme heat is weighted 25% in the Season Risk Index.",
      hi: "इस वर्ष का तापमान रेंज और आर्द्रता जोड़ें। अत्यधिक गर्मी सीज़न रिस्क इंडेक्स में 25% वज़न पाती है।",
      ta: "இந்த ஆண்டின் வெப்பநிலை வரம்பு, ஈரப்பதத்தைச் சேர்க்கவும். கடும் வெப்பம் Season Risk Index-ல் 25% எடை பெறுகிறது.",
    },
  },
  {
    path: "/advisory",
    selector: '[data-tour="submit-btn"]',
    title: { en: "Generate advisory", hi: "सलाह बनाएँ", ta: "ஆலோசனை உருவாக்கு" },
    text: {
      en: "Hit this button. The engine scores all 22 crops — expected yield × mandi price − input cost, damped by risk — and returns ranked, explained advice.",
      hi: "यह बटन दबाएँ। इंजन सभी 22 फ़सलों को स्कोर करता है — अपेक्षित उपज × मंडी भाव − लागत, जोखिम से समायोजित — और क्रमबद्ध, समझाया हुआ परामर्श देता है।",
      ta: "இந்த பொத்தானை அழுத்தவும். இயந்திரம் 22 பயிர்களையும் மதிப்பிடுகிறது — எதிர்பார்க்கப்படும் விளைச்சல் × சந்தை விலை − செலவு, இலாபக் குறியீடு — வரிசைப்படுத்தி, விளக்கத்துடன் ஆலோசனை தரும்.",
    },
  },
  {
    path: "/advisory",
    selector: '[data-tour="results"]',
    optional: true,
    title: { en: "Ranked results", hi: "क्रमबद्ध परिणाम", ta: "வரிசைப்படுத்திய முடிவுகள்" },
    text: {
      en: "Each card shows fit %, expected yield, net margin and a Season Risk Index — with plain-language reasons. A green climate gate hides crops that won't survive your conditions.",
      hi: "हर कार्ड फ़िट %, अपेक्षित उपज, शुद्ध लाभ और सीज़न रिस्क इंडेक्स दिखाता है — सरल भाषा में कारणों के साथ। हरा क्लाइमेट गेट उन फ़सलों को छिपाता है जो आपकी परिस्थितियों में नहीं टिकेंगी।",
      ta: "ஒவ்வொரு அட்டையும் பொருத்த %, எதிர்பார்க்கப்படும் விளைச்சல், நிகர லாபம், Season Risk Index காட்டும் — எளிய விளக்கத்துடன். பச்சை காலநிலை கேட் உங்கள் சூழலில் உயிர்ப்பிக்காத பயிர்களை மறைக்கும்.",
    },
  },
  {
    path: "/advisory",
    selector: '[data-tour="feedback"]',
    optional: true,
    title: { en: "Feedback loop", hi: "प्रतिक्रिया लूप", ta: "கருத்து வளையம்" },
    text: {
      en: "After acting on the advice, tell us what actually grew. Your rating retrains the ranking weights — this is the app's learning loop from the PPT.",
      hi: "सलाह पर अमल करने के बाद, हमें बताएँ कि वास्तव में क्या उगा। आपकी रेटिंग रैंकिंग वेट को फिर से सिखाती है — यह PPT का लर्निंग लूप है।",
      ta: "ஆலோசனைப்படி செயல்பட்ட பிறகு, உண்மையில் என்ன விளைந்தது என்று சொல்லுங்கள். உங்கள் மதிப்பீடு தரவரிசை எடைகளைப் பயிற்றுவிக்கும் — இது PPT-ன் கற்றல் வளையம்.",
    },
  },
  {
    path: "/dashboard",
    selector: '[data-tour="dash-stats"]',
    title: { en: "Live dashboard", hi: "लाइव डैशबोर्ड", ta: "நேரடி டாஷ்போர்டு" },
    text: {
      en: "Counters here are real: model accuracy from the PPT benchmark, live query count and feedback stored in MongoDB.",
      hi: "यहाँ के काउंटर वास्तविक हैं: PPT बेंचमार्क से मॉडल एक्यूरेसी, लाइव क्वेरी काउंट और MongoDB में संग्रहीत फ़ीडबैक।",
      ta: "இங்குள்ள எண்ணிக்கைகள் உண்மையானவை: PPT ஒப்பீட்டிலிருந்து மாதிரி துல்லியம், நேரடிக் கேள்விகள், MongoDB-ல் சேமித்த கருத்துகள்.",
    },
  },
  {
    path: "/prices",
    selector: '[data-tour="price-chart"]',
    title: { en: "Mandi prices", hi: "मंडी भाव", ta: "சந்தை விலைகள்" },
    text: {
      en: "120-day price series with volatility per crop. Volatility feeds 35% of the Season Risk Index — a jumpy market means a risky bet.",
      hi: "प्रति फ़सल 120-दिन की भाव श्रृंखला और अस्थिरता। अस्थिरता सीज़न रिस्क इंडेक्स का 35% हिस्सा है — उतार-चढ़ाव वाला बाज़ार जोखिम भरा दाँव है।",
      ta: "ஒவ்வொரு பயிருக்கும் 120-நாள் விலைத் தொடர், ஏற்ற இறக்கம். ஏற்ற இறக்கம் Season Risk Index-ல் 35% — ஏற்ற இறக்கம் நிறைந்த சந்தை ஆபத்தான சூதாட்டம்.",
    },
  },
];

export default function GuidedTour() {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const [found, setFound] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { lang } = useLang();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = STEPS[index];
  const title = step.title[lang];
  const text = step.text[lang];

  const locate = useCallback(
    (el: Element | null) => {
      if (!el) {
        setBox(null);
        setFound(false);
        return;
      }
      setBox(el.getBoundingClientRect());
      setFound(true);
    },
    []
  );

  useEffect(() => {
    if (!active || !step) return;
    let cancelled = false;

    const tryFind = (attempt = 0) => {
      if (cancelled) return;
      const el = document.querySelector(step.selector);
      if (el) {
        locate(el);
        return;
      }
      if (attempt < 40) {
        pollRef.current = setTimeout(() => tryFind(attempt + 1), 120);
      } else {
        setBox(null);
        setFound(false);
      }
    };

    if (pathname !== step.path) {
      router.push(step.path);
      pollRef.current = setTimeout(() => tryFind(0), 450);
    } else {
      pollRef.current = setTimeout(() => tryFind(0), 0);
    }

    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [active, index, pathname, step, router, locate]);

  useEffect(() => {
    if (!active || !box) return;
    const onScrollOrResize = () => {
      const el = document.querySelector(STEPS[index].selector);
      locate(el);
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [active, box, index, locate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && active) setActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const finish = () => {
    setActive(false);
    setIndex(0);
    toast(
      lang === "hi"
        ? "टूर पूरा हुआ — अब अपनी सलाह बनाएँ!"
        : lang === "ta"
          ? "சுற்றுப்பயணம் முடிந்தது — இப்போது உங்கள் ஆலோசனையை உருவாக்குங்கள்!"
          : "Tour complete — now generate your advisory!",
      "success"
    );
  };

  const go = (dir: 1 | -1) => {
    const next = index + dir;
    if (next < 0) return;
    if (next >= STEPS.length) {
      finish();
      return;
    }
    setIndex(next);
  };

  return (
    <>
      <button
        type="button"
        data-tour="tour-start"
        onClick={() => {
          setIndex(0);
          setActive(true);
        }}
        className="fixed bottom-5 left-5 z-[70] flex items-center gap-2 rounded-full border-2 border-brand-700 bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(20,60,35,0.35)] transition hover:-translate-y-0.5 hover:bg-brand-700 active:translate-y-0"
      >
        <span className="text-base leading-none">▶</span>
        {lang === "hi" ? "डेमो टूर" : lang === "ta" ? "டெமோ சுற்று" : "Demo tour"}
      </button>

      {active && (
        <div className="fixed inset-0 z-[75]">
          <div className="absolute inset-0 bg-ink/45" onClick={() => setActive(false)} />

          {box && found && (
            <div
              className="pointer-events-none absolute rounded-xl border-2 border-brand-400 shadow-[0_0_0_9999px_rgba(15,23,18,0.55)] transition-all duration-300"
              style={{
                top: Math.max(box.top - 8, 4),
                left: Math.max(box.left - 8, 4),
                width: box.width + 16,
                height: box.height + 16,
              }}
            />
          )}

          <div
            className="absolute w-[min(23rem,calc(100vw-2rem))] rounded-2xl border border-brand-200 bg-white p-5 shadow-[0_24px_60px_rgba(10,25,16,0.4)] transition-all duration-300"
            style={
              box && found
                ? {
                    top: box.bottom + 18 + 200 > window.innerHeight
                      ? Math.max(box.top - 196, 12)
                      : box.bottom + 18,
                    left: Math.min(Math.max(box.left, 12), window.innerWidth - 372),
                  }
                : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
            }
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="pill !py-1 text-[11px]">
                {index + 1} / {STEPS.length}
              </span>
              <button
                type="button"
                aria-label="Close tour"
                onClick={() => setActive(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/10 hover:text-ink"
              >
                ✕
              </button>
            </div>
            <h3 className="text-base font-extrabold text-ink">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{text}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40"
              >
                ← Back
              </button>
              <button type="button" onClick={() => go(1)} className="btn-primary !px-4 !py-1.5 text-xs">
                {index === STEPS.length - 1 ? "Finish ✓" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
