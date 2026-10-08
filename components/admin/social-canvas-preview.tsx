"use client";

import React, { useRef, useEffect, useState } from "react";
import { Download, Copy, Check, Sparkles, Eye, Palette, CheckCircle } from "lucide-react";

interface SocialCanvasPreviewProps {
  questionText: string;
  questionTextEn?: string;
  options: { key: string; text: string; isCorrect?: boolean }[];
  correctOption: string;
  examName: string;
  subject: string;
  topic?: string;
  onDownload?: (dataUrl: string) => void;
}

export function SocialCanvasPreview({
  questionText,
  questionTextEn,
  options,
  correctOption,
  examName,
  subject,
  topic,
}: SocialCanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [theme, setTheme] = useState<"royal" | "crimson" | "midnight">("royal");
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  // Preload logo
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/brand/examtwister_logo.png";
    img.onload = () => setLogoImg(img);
  }, []);

  // Redraw canvas whenever props/state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1080 x 1920 (9:16 vertical standard)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    if (theme === "royal") {
      bgGrad.addColorStop(0, "#0B192C");
      bgGrad.addColorStop(0.3, "#1E3E62");
      bgGrad.addColorStop(0.7, "#000000");
      bgGrad.addColorStop(1, "#1E3E62");
    } else if (theme === "crimson") {
      bgGrad.addColorStop(0, "#2B0910");
      bgGrad.addColorStop(0.3, "#5B1425");
      bgGrad.addColorStop(0.7, "#140407");
      bgGrad.addColorStop(1, "#380D17");
    } else {
      bgGrad.addColorStop(0, "#080B10");
      bgGrad.addColorStop(0.4, "#131B2A");
      bgGrad.addColorStop(0.8, "#05070A");
      bgGrad.addColorStop(1, "#182235");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative top aura
    const sunGrad = ctx.createRadialGradient(W / 2, 280, 50, W / 2, 280, 500);
    sunGrad.addColorStop(0, "rgba(245, 158, 11, 0.35)");
    sunGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, W, 700);

    // 2. Draw Top Left Logo
    if (logoImg) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 20;
      ctx.drawImage(logoImg, 50, 50, 160, 160);
      ctx.restore();
    } else {
      // Fallback logo box
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.arc(130, 130, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0B192C";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("RET", 130, 140);
    }

    // 3. Top Right Subject & Badges
    ctx.textAlign = "right";
    ctx.fillStyle = "#FDE68A";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("LEARN • PRACTICE • IMPROVE • SUCCEED", W - 50, 90);

    // Subject title (Golden 3D)
    ctx.fillStyle = "#FBBF24";
    ctx.font = "900 44px sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 10;
    ctx.fillText(subject.toUpperCase(), W - 50, 145);
    ctx.shadowBlur = 0;

    // Sub badge pill (FOR CET | REET | LDC)
    const subPillText = "FOR CET | REET | LDC | SI | PATWAR";
    ctx.font = "bold 20px sans-serif";
    const subPillWidth = ctx.measureText(subPillText).width + 30;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.roundRect(W - 50 - subPillWidth, 165, subPillWidth, 38, 19);
    ctx.fill();
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(subPillText, W - 65, 191);

    // 4. Center Exam Banner (Ribbon)
    const bannerY = 240;
    const bannerH = 65;
    const bannerGrad = ctx.createLinearGradient(100, bannerY, W - 100, bannerY);
    bannerGrad.addColorStop(0, "#991B1B");
    bannerGrad.addColorStop(0.5, "#DC2626");
    bannerGrad.addColorStop(1, "#991B1B");

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 15;
    ctx.fillStyle = bannerGrad;
    ctx.beginPath();
    ctx.roundRect(60, bannerY, W - 120, bannerH, 12);
    ctx.fill();
    ctx.strokeStyle = "#FCD34D";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFBEB";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(`${examName} का महत्वपूर्ण सवाल`, W / 2, bannerY + 43);

    // 5. Main Question Card (White with Yellow 'Q.' badge)
    const cardX = 60;
    const cardY = 340;
    const cardW = W - 120;
    const cardH = 340;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.restore();

    // Glowing Yellow 'Q.' Badge on Top Center of Card
    const qBadgeY = cardY;
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.arc(W / 2, qBadgeY, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Q.", W / 2, qBadgeY + 15);

    // Question Hindi Text inside Card
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    
    // Wrap Question Text if long
    const maxTextW = cardW - 60;
    const words = questionText.split(" ");
    let line = "";
    let qLineY = cardY + 110;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextW && n > 0) {
        ctx.fillText(line, W / 2, qLineY);
        line = words[n] + " ";
        qLineY += 50;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, W / 2, qLineY);

    // Question English Text (Sub-line)
    if (questionTextEn) {
      ctx.fillStyle = "#475569";
      ctx.font = "500 24px sans-serif";
      ctx.fillText(`(${questionTextEn})`, W / 2, qLineY + 50);
    }

    // 6. Option Cards (4 Sleek 3D Buttons - 2x2 Grid)
    const optY = 720;
    const optW = (cardW - 30) / 2;
    const optH = 110;

    const optCoords = [
      { x: cardX, y: optY, key: "A" },
      { x: cardX + optW + 30, y: optY, key: "B" },
      { x: cardX, y: optY + optH + 20, key: "C" },
      { x: cardX + optW + 30, y: optY + optH + 20, key: "D" },
    ];

    optCoords.forEach((coord) => {
      const optData = options.find((o) => o.key === coord.key);
      const isThisCorrect = coord.key === correctOption;
      const isHighlighted = revealAnswer && isThisCorrect;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 12;

      if (isHighlighted) {
        // Glowing Green for Correct Answer
        ctx.fillStyle = "#10B981";
        ctx.strokeStyle = "#FCD34D";
        ctx.lineWidth = 4;
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#E2E8F0";
        ctx.lineWidth = 1.5;
      }

      ctx.beginPath();
      ctx.roundRect(coord.x, coord.y, optW, optH, 18);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Red Circle Badge for Letter A/B/C/D
      const badgeX = coord.x + 45;
      const badgeY = coord.y + optH / 2;

      ctx.fillStyle = isHighlighted ? "#047857" : "#EF4444";
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(coord.key, badgeX, badgeY + 8);

      // Option Text
      ctx.textAlign = "left";
      ctx.fillStyle = isHighlighted ? "#FFFFFF" : "#0F172A";
      ctx.font = "bold 26px sans-serif";
      const optText = optData ? optData.text.split("(")[0].trim() : `Option ${coord.key}`;
      ctx.fillText(optText, coord.x + 90, coord.y + 55);

      // Sub english or pronunciation
      const optEn = optData?.text.includes("(") ? optData.text.split("(")[1]?.replace(")", "") : "";
      if (optEn) {
        ctx.fillStyle = isHighlighted ? "#E6FFFA" : "#64748B";
        ctx.font = "500 18px sans-serif";
        ctx.fillText(optEn, coord.x + 90, coord.y + 85);
      }
    });

    // 7. Viral Challenge Strip (90% Log Ghalat Dete Hain)
    const viralY = 1010;
    const viralGrad = ctx.createLinearGradient(100, viralY, W - 100, viralY);
    viralGrad.addColorStop(0, "#0F172A");
    viralGrad.addColorStop(0.5, "#1E293B");
    viralGrad.addColorStop(1, "#0F172A");

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 15;
    ctx.fillStyle = viralGrad;
    ctx.beginPath();
    ctx.roundRect(60, viralY, W - 120, 85, 42);
    ctx.fill();
    ctx.strokeStyle = "#E11D48";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#F8FAFC";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("🔥 90% लोग गलत उत्तर देते हैं! बिना Google किए A/B/C/D बताओ! 🎯", W / 2, viralY + 52);

    // 8. Study Checklist Ribbon
    const ribbonY = 1120;
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.beginPath();
    ctx.roundRect(60, ribbonY, W - 120, 70, 14);
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#F1F5F9";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("📖 STUDY SMARTER  |  💡 PRACTICE REGULARLY  |  📈 IMPROVE  |  🏆 CRACK EXAMS", W / 2, ribbonY + 43);

    // 9. Golden Slogan Banner at Bottom
    const sloganY = 1680;
    const sloganGrad = ctx.createLinearGradient(80, sloganY, W - 80, sloganY);
    sloganGrad.addColorStop(0, "#F59E0B");
    sloganGrad.addColorStop(0.5, "#FDE68A");
    sloganGrad.addColorStop(1, "#F59E0B");

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = sloganGrad;
    ctx.beginPath();
    ctx.roundRect(80, sloganY, W - 160, 90, 16);
    ctx.fill();
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#0F172A";
    ctx.font = "900 32px sans-serif";
    ctx.fillText("सवाल सीधा नहीं, सोच टेढ़ी करो!", W / 2, sloganY + 42);
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#1E293B";
    ctx.fillText("RAJASTHAN EXAM TWISTER", W / 2, sloganY + 72);

    // 10. Bottom Hashtags
    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 18px sans-serif";
    ctx.fillText("#RajasthanGK  #RajasthanCET  #CET2024  #HindiGrammar  #RSSB  #REET  #ExamTwister", W / 2, 1850);
  }, [questionText, questionTextEn, options, correctOption, examName, subject, topic, theme, revealAnswer, logoImg]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ExamTwister_Reel_${Date.now()}.jpg`;
    a.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        handleDownload();
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }, "image/png");
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">
            Interactive Live 1080p Canvas Engine
          </h3>
        </div>

        {/* Theme & Mode Switcher Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setTheme("royal")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                theme === "royal" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-600"
              }`}
            >
              Royal Navy
            </button>
            <button
              onClick={() => setTheme("crimson")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                theme === "crimson" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              Crimson
            </button>
            <button
              onClick={() => setTheme("midnight")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                theme === "midnight" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              Midnight
            </button>
          </div>

          <button
            onClick={() => setRevealAnswer(!revealAnswer)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
              revealAnswer
                ? "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{revealAnswer ? "Answer Revealed ✓" : "Reveal Answer Mode"}</span>
          </button>
        </div>
      </div>

      {/* Canvas Display Viewport (Aspect Ratio 9:16) */}
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-slate-950">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>

        {/* Action Buttons Under Canvas */}
        <div className="w-full max-w-[320px] grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download 1080p</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied!" : "Copy Image"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
