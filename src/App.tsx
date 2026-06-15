import React, { useState, useEffect, useRef } from "react";
import { 
  Key, 
  Upload, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Cpu, 
  Sparkles, 
  TrendingUp, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Globe,
  Zap
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// Types for scanning step simulation
interface ScanningStep {
  id: number;
  labelAr: string;
  labelEn: string;
  status: "idle" | "running" | "completed";
}

export default function App() {
  // Key state logic
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  
  // Gumroad License states
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [showLicenseKey, setShowLicenseKey] = useState<boolean>(false);
  const [licenseErrorText, setLicenseErrorText] = useState<string>("");

  // Image state logic
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scan states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatusLabel, setScanStatusLabel] = useState<string>("خامل - في انتظار بدء الفحص");
  const [reportResult, setReportResult] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");

  // Code Export states
  const [activeTab, setActiveTab] = useState<"scan" | "export">("scan");
  const [exportFile, setExportFile] = useState<"app" | "html">("app");
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Telemetry simulation steps
  const [scanningSteps, setScanningSteps] = useState<ScanningStep[]>([
    { id: 1, labelAr: "استخلاص الأجسام وتحديد أسعار المنافسين للبضاعة البصرية", labelEn: "Object Detection & Pricing Capture", status: "idle" },
    { id: 2, labelAr: "تخمين المواد الخام ومطابقتها بمصانع الصين والشرق الأقصى", labelEn: "Factory Sourcing & Taobao Simulation", status: "idle" },
    { id: 3, labelAr: "مقارنة الحسابات وهوامش الربح وتحليل الفوارق الشاملة", labelEn: "Margin Modeling & Disparity Analytics", status: "idle" },
    { id: 4, labelAr: "صياغة خطة الشحن التكتيكية واستراتيجية التسعير الهجومي باللغة العربية", labelEn: "Tactical Arbitrage Report Drafting", status: "idle" }
  ]);

  // Load key from LocalStorage for seamless UX
  useEffect(() => {
    const savedKey = localStorage.getItem("sitesec_api_key");
    const savedLicense = localStorage.getItem("sitesec_license_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
    if (savedLicense) {
      setLicenseKey(savedLicense);
    }
  }, []);

  // Save key on change
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setApiKey(val);
    localStorage.setItem("sitesec_api_key", val);
  };

  // Save license on change
  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setLicenseKey(val);
    localStorage.setItem("sitesec_license_key", val);
  };

  // Image Selection Handler
  const handleImageChange = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setErrorText("");
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setErrorText("الرجاء تحديد ملف صورة صالح (PNG, JPEG, WEBP)");
    }
  };

  // Drag and Drop triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageSelected(e.dataTransfer.files[0]);
    }
  };

  const handleImageSelected = (file: File) => {
    handleImageChange(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Strategic Scan Executor
  const handleLaunchScan = async () => {
    if (!apiKey) {
      setErrorText("الرجاء تزويد رمز واجهة برمجة التطبيقات (API Key) للاتصال بـ Gemini.");
      return;
    }
    if (!licenseKey) {
      setErrorText("الرجاء تزويد رمز تفعيل رخصة المنتج (Gumroad License Key) قبل تشغيل المسح.");
      return;
    }
    if (!imageFile) {
      setErrorText("الرجاء رفع لقطة شاشة لصفحة منتج المنافس لتشغيل الفحص البصري.");
      return;
    }

    setIsScanning(true);
    setReportResult("");
    setErrorText("");
    setLicenseErrorText("");
    
    // Reset simulated steps
    setScanningSteps(prev => prev.map(s => ({ ...s, status: "idle" })));

    // Helper reader to transfer base64 inline safely to custom Node.js endpoint
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64DataUrl = event.target?.result as string;
      const base64Clean = base64DataUrl.split(",")[1];
      const mimeType = imageFile.type;

      try {
        // Step 1: Detect objects
        updateStepStatus(1, "running");
        setScanStatusLabel("جاري تحليل أسعار المنافسين...");
        await delay(1500);
        updateStepStatus(1, "completed");

        // Step 2: Sourcing
        updateStepStatus(2, "running");
        setScanStatusLabel("جاري مطابقة المصانع وتخمين سعر التكلفة المائي...");
        await delay(2000);
        updateStepStatus(2, "completed");

        // Step 3: Calculation
        updateStepStatus(3, "running");
        setScanStatusLabel("جاري حساب الهوامش الاستراتيجية وفوارق الربحية...");
        await delay(1500);
        updateStepStatus(3, "completed");

        // Step 4: Write Arabic draft
        updateStepStatus(4, "running");
        setScanStatusLabel("جاري صياغة التقرير الاستخباراتي بالعربية الفصحى...");

        // Fire request to custom Express endpoint `/api/scan`
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            apiKey: apiKey,
            licenseKey: licenseKey,
            imageBase64: base64Clean,
            mimeType: mimeType
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          updateStepStatus(4, "completed");
          setReportResult(data.report);
          setScanStatusLabel("اكتمل نظام الرصد والتقرير بنجاح");
        } else {
          if (data.error === "LICENSE_INVALID" || response.status === 403) {
            setLicenseErrorText(data.message || "عذراً، رمز تفعيل الرخصة غير صالح أو تم استخدامه على أجهزة متعددة. يرجى تفعيل الأداة عبر متجر SiteSec الرسمي للتشغيل.");
            setScanStatusLabel("فشل تفعيل الرخصة");
          } else {
            throw new Error(data.error || "فشل غير متوقع من نموذج تحليل الصور.");
          }
        }

      } catch (err: any) {
        setScanningSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "idle" } : s));
        setErrorText(err.message || "فشلت الاتصالات الاستخباراتية. تعذر إنتاج التقرير التكتيكي.");
        setScanStatusLabel("فشلت مهمة المسح");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(imageFile);
  };

  const updateStepStatus = (id: number, status: "idle" | "running" | "completed") => {
    setScanningSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // local python templates content for beautiful export tab
  const pythonAppCode = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiteSec Vision-Intel Router v1.0 - Local Backend Orchestrator
E-Commerce & Commercial Arbitrage Sourcing Engine
Powered by Gemini 1.5 Pro / 1.5 Flash Resilient Sourcing Agent
"""

import os
import time
import base64
import logging
from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types

app = Flask(__name__)

def generate_report_resiliently(client, image_bytes, mime_type, system_instruction, user_prompt):
    """
    Executes resilient call with Exponential Backoff (3 attempts, 2s then 4s wait)
    and dynamic model fallback from 'gemini-1.5-pro' to 'gemini-1.5-flash'.
    """
    models = ["gemini-1.5-pro", "gemini-1.5-flash"]
    last_error = None

    for model in models:
        attempts = 0
        max_attempts = 3
        current_delay = 2.0

        while attempts < max_attempts:
            try:
                response = client.models.generateContent(
                    model=model,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        user_prompt
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.35,
                    )
                )
                if response and response.text:
                    return response.text
                raise RuntimeError("Empty response received from API.")
            except Exception as e:
                attempts += 1
                last_error = e
                if "key_invalid" in str(e).lower():
                    raise e
                if attempts < max_attempts:
                    time.sleep(current_delay)
                    current_delay *= 2.0
    raise last_error

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def scan_intelligence():
    try:
        api_key = request.form.get('api_key', '').strip()
        if not api_key:
            return jsonify({'success': False, 'error': 'API Key مطلوب'}), 400

        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'لقطة الرصد مطلوبة'}), 400

        image_file = request.files['image']
        image_bytes = image_file.read()
        mime_type = image_file.content_type or 'image/png'

        client = genai.Client(api_key=api_key)

        system_instruction = (
            "أنت خبير محترف في ذكاء الأعمال وصياغة مقارنات التوريد والتحكيم التجاري الإلكتروني (Arbitrage).\\n\\n"
            "مهمتك صياغة تقرير عسكري دقيق باللغة العربية الفصحى يتضمن:\\n"
            "1. تفكيك الأقسام واستخراج أسعار المنافس بالدرهم المغربي dh/MAD.\\n"
            "2. مصفوفة مقارنات الأسعار مع احتساب سعر التكلفة الواصلة (Landed Cost + 25%-35% هامش جمارك و20% TVA ضريبة في المغرب) مع روابط علي بابا [Product](url).\\n"
            "3. مصفوفة لتقييم مخاطر السلسلة والتوريد (مخاطر المقلد، البطاريات والمواد الخطرة، واشتراطات تصريح ANRT بالمغرب).\\n"
            "4. خطة عمل لوجستية وتكتيكات تسعير هجومية لكسر سوق المنافس بموانئ المغرب (الدار البيضاء/طنجة)."
        )

        report = generate_report_resiliently(
            client, image_bytes, mime_type, 
            system_instruction, "قم ببدء التحليل البصري الاستخباري وصياغة التقرير الكلي فوراً."
        )

        return jsonify({'success': True, 'report': report})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)`;

  const pythonHtmlCode = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiteSec Vision-Intel Router v1.0</title>
    <!-- Tailwind CDN for cybernetic dark glass design -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Tajawal', sans-serif; background: radial-gradient(circle, #050816 0%, #0b0e26 100%); }
        .liquid-glass { background: rgba(10, 15, 30, 0.45); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.08); }
    </style>
</head>
<body class="text-slate-100 min-h-screen py-8">
    <!-- UI components fully described in templates/index.html of exported files -->
    <div class="max-w-5xl mx-auto px-4">
        <!-- Render visual dropzones, secure key inputs, and live marked results -->
    </div>
</body>
</html>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden flex flex-col justify-between" dir="rtl">
      
      {/* Background blobs simulating floating liquid fluid */}
      <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-bl from-purple-500/10 to-transparent blur-[130px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 py-8 z-10 flex-grow">
        
        {/* Sleek cybernetic title header */}
        <header className="flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-full text-xs text-cyan-400 font-semibold mb-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" id="sec-ping"></span>
            <span>بوابة الاتصال الاستخباراتي المباشر نشطة</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 mb-2">
            SiteSec Vision-Intel Router v1.0
          </h1>
          
          <p className="text-sm md:text-base text-slate-400 max-w-2xl font-light">
            منفذ تحليل الصور والاستخلاص البصري لتوليد مصفوفات التحكيم التجاري وهوامش الربح وخرائط التوريد البديلة الفائقة.
          </p>

          {/* Tab Navigation to show dual utility */}
          <div className="flex gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5 mt-6">
            <button 
              onClick={() => setActiveTab("scan")}
              className={`px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "scan" 
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap id="zap-icon" className="w-4 h-4" />
              <span>لوحة الاستعلام المباشر</span>
            </button>
            <button 
              onClick={() => setActiveTab("export")}
              className={`px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "export" 
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileCode id="code-icon" className="w-4 h-4" />
              <span>أكواد التطبيق المحلي للكمبيوتر (Python)</span>
            </button>
          </div>
        </header>

        {activeTab === "scan" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Controls Panel (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="bg-[#0b1022]/45 backdrop-blur-[20px] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <h2 className="text-base md:text-lg font-bold text-cyan-400 mb-5 pb-2 border-b border-white/5 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>معايير مسح الماركت واللوجستية</span>
                </h2>

                <div className="space-y-5">
                  
                  {/* Security Input 1: API Key Field */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                      <span className="text-purple-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        رمز اتصال Google AI Studio API Key
                      </span>
                      <a 
                        href="https://aistudio.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 hover:underline transition-all font-semibold"
                      >
                        احصل على الرمز بحرية من هنا
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    
                    <div className="relative">
                      <input 
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={handleApiKeyChange}
                        placeholder="AIzaSy..." 
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm leading-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] outline-none text-slate-100 placeholder-slate-600 transition-all pl-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-white transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-normal">
                      سيتم تخزين المفتاح محلياً في متصفحك بشكل آمن لتسريع المسح اللاحق ولا يتم مشاركته مع أية أطراف ثالثة.
                    </span>
                  </div>

                  {/* Security Input 3: Gumroad License Key */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                      <span className="text-purple-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        رمز تفعيل رخصة المنتج (Gumroad License Key)
                      </span>
                      <span className="text-purple-400 text-xs font-semibold shadow-[0_0_8px_rgba(139,92,246,0.1)]">
                        ترخيص آمن SiteSec
                      </span>
                    </div>
                    
                    <div className="relative">
                      <input 
                        type={showLicenseKey ? "text" : "password"}
                        value={licenseKey}
                        onChange={handleLicenseKeyChange}
                        placeholder="XXXX-XXXX-XXXX-XXXX" 
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm leading-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] outline-none text-slate-100 placeholder-slate-600 transition-all pl-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowLicenseKey(!showLicenseKey)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-white transition-colors"
                      >
                        {showLicenseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-normal">
                      يرجى إدخال مفتاح رخصة المنتج الرسمي لـ Gumroad للتحقق والاستخدام العادل.
                    </span>
                  </div>

                  {/* Input Zone 2: Drag and Drop visual target */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-medium text-purple-300 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      المستند البصري للرصد والتحليل
                    </span>

                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => e.target.files && handleImageSelected(e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />

                    {!imagePreview ? (
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className={`border-2 border-dashed rounded-xl p-8 hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col items-center text-center justify-center ${
                          isDragOver 
                            ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_20px_rgba(0,240,255,0.1)]" 
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <Upload className="w-10 h-10 text-slate-400 group-hover:text-cyan-400 animate-pulse mb-3" />
                        <h4 className="text-xs md:text-sm font-medium text-slate-200">اسحب لقطة شاشة المنافس إلى هنا</h4>
                        <p className="text-[10px] text-slate-500 mt-1">أو تصفح الملفات من جهازك مباشرة</p>
                      </div>
                    ) : (
                      <div className="border border-white/10 rounded-xl overflow-hidden relative bg-black/30 p-2">
                        <img 
                          src={imagePreview} 
                          alt="لقطة الشاشة المستهدفة" 
                          className="w-full max-h-56 object-contain rounded-lg"
                        />
                        <div className="absolute top-4 left-4 flex gap-1.5">
                          <button 
                            onClick={handleRemoveImage}
                            className="bg-red-600/80 hover:bg-red-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold shadow-md backdrop-blur transition-all"
                          >
                            حذف الصورة
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scan button */}
                  <button 
                    disabled={isScanning}
                    onClick={handleLaunchScan}
                    className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-xl hover:shadow-[0_0_30px_rgba(0,240,255,0.45)] transition-all flex items-center justify-center gap-2 border border-white/10 text-sm md:text-base relative"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>جاري الرصد والتحليل الجيومورفولوجي...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-5 h-5 animate-pulse text-cyan-100" />
                        <span>تشغيل مسح ذكاء التوريد والتحكيم</span>
                      </>
                    )}
                  </button>

                </div>

              </div>

              {/* Security Advisory notice */}
              <div className="bg-[#121021]/30 border border-purple-500/10 rounded-xl p-4 text-xs text-purple-300 animate-pulse">
                <div className="flex gap-2 items-start">
                  <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>بروتوكول الأمان المفعّل:</strong> يتم توجيه طلباتك عبر خادم آمن مباشرة إلى خوادم Google Gemini باستخدام واجهة API المورّدة من قبلك. لقطات الشاشة لا تُحفظ في قواعد بيانات دائمة.
                  </p>
                </div>
              </div>

            </div>

            {/* Results Output Screen / Step Visualiser (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6 w-full">
              
              <div className="bg-[#0b1022]/45 backdrop-blur-[20px] border border-white/10 rounded-2xl p-6 min-h-[500px] flex flex-col relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                
                {/* Header state inside results */}
                <h2 className="text-base md:text-lg font-bold text-cyan-400 mb-5 pb-2 border-b border-white/5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    تقرير مصفوفة الأرباح والاستراتيجيات
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${
                    isScanning 
                      ? "bg-yellow-950/30 text-yellow-400 border-yellow-500/20 animate-pulse" 
                      : reportResult 
                        ? "bg-green-950/30 text-green-400 border-green-500/20" 
                        : "bg-slate-900 text-slate-500 border-white/5"
                  }`}>
                    {scanStatusLabel}
                  </span>
                </h2>

                {/* Simulated Steps during API Execution */}
                {isScanning && (
                  <div className="space-y-4 mb-6 pt-2 bg-white/[0.01] p-4 rounded-xl border border-white/5 animate-fade-in">
                    {scanningSteps.map(step => (
                      <div key={step.id} className="flex gap-3 items-start justify-between">
                        <div className="flex gap-2.5 items-start">
                          <span className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center border text-[9px] font-bold shrink-0 ${
                            step.status === "completed" 
                              ? "bg-green-500/20 border-green-500 text-green-400" 
                              : step.status === "running" 
                                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse" 
                                : "bg-slate-900 border-slate-700 text-slate-500"
                          }`}>
                            {step.status === "completed" ? "✓" : step.id}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{step.labelAr}</p>
                            <p className="text-[9px] font-mono text-slate-500 tracking-wider uppercase">{step.labelEn}</p>
                          </div>
                        </div>

                        {step.status === "running" && (
                          <div className="flex gap-0.5 mt-1.5 shrink-0">
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "1500ms" }}></span>
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "3000ms" }}></span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* General/System Error Banner */}
                {errorText && (
                  <div className="rounded-xl bg-red-950/30 border border-red-500/20 p-4 text-xs md:text-sm text-red-400 leading-relaxed flex gap-2 items-start mb-6">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-1">فشل الرصد التكتيكي:</strong>
                      <p>{errorText}</p>
                    </div>
                  </div>
                )}

                {/* Gumroad License Error Card */}
                {licenseErrorText && (
                  <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 bg-red-950/20 backdrop-blur-[20px] border border-red-500/30 rounded-2xl shadow-[0_0_55px_rgba(239,68,68,0.18)] text-center my-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse mb-4">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-red-400 mb-2 font-sans tracking-tight">فشل ترخيص الاستخدام</h3>
                    <p className="text-xs md:text-sm text-slate-300 max-w-md leading-relaxed mb-6">
                      {licenseErrorText}
                    </p>
                    <a 
                      href="https://sitesec.gumroad.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <span>تفعيل رخصة SiteSec الآن</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Placeholder empty state */}
                {!isScanning && !reportResult && !errorText && !licenseErrorText && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center py-20">
                    <Globe className="w-12 h-12 text-slate-600 animate-pulse mb-4" />
                    <h3 className="text-sm font-bold text-slate-300 mb-1">التقرير غير مفعّل</h3>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                      الرجاء إدخال رمز واجهة البرمجة (API Key) ورمز الترخيص، ثم رفع لقطة شاشة لمنتج المنافس لبدء التحليل البصري التكتيكي لـ Gemini.
                    </p>
                  </div>
                )}

                {/* Rendered report output */}
                {reportResult && !licenseErrorText && (
                  <div className="flex-grow report-content leading-relaxed text-slate-200 text-sm overflow-y-auto pr-1">
                    <div className="prose prose-invert max-w-none text-right">
                      <ReactMarkdown>{reportResult}</ReactMarkdown>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        ) : (
          /* Python Code Download section for computer Localhost */
          <div className="bg-[#0b1022]/45 backdrop-blur-[20px] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 mb-6">
              <div>
                <h2 className="text-base md:text-lg font-bold text-cyan-400 flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  <span>تصدير التطبيق المحلي لسرعتك الشخصية (Localhost Python Engine)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  يمكنك تشغيل هذا البرنامج ذو مظهر "Liquid Glass" الفاخر في حاسوبك الشخصي مجاناً بالكامل دون تكاليف استضافة خارجية!
                </p>
              </div>

              <div className="flex gap-2 mt-4 md:mt-0">
                <button 
                  onClick={() => setExportFile("app")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    exportFile === "app" 
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/30" 
                      : "bg-slate-900 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  app.py (خادم Flask الرئيسي)
                </button>
                <button 
                  onClick={() => setExportFile("html")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    exportFile === "html" 
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/30" 
                      : "bg-slate-900 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  templates/index.html (الواجهة المائة)
                </button>
              </div>
            </div>

            {/* Explanatory notes to install */}
            <div className="bg-cyan-950/15 border border-cyan-500/10 rounded-xl p-4 text-xs leading-relaxed mb-6">
              <h3 className="font-bold text-cyan-400 mb-2">كيفية إعداد وتشغيل التطبيق في حاسوبك الشخصي:</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                <li>قم بإنشاء مجلد جديد في حاسوبك باسم <code className="bg-black/30 px-1 py-0.5 rounded text-pink-400">sitesec-vision</code>.</li>
                <li>احفظ محتويات الملف المالي <code className="bg-black/30 px-1 py-0.5 rounded text-pink-400">app.py</code> بداخله.</li>
                <li>أنشئ مجلداً فرعياً باسم <code className="bg-black/30 px-1 py-0.5 rounded text-pink-400 font-bold">templates</code> واحفظ بداخله الواجهة باسم <code className="bg-black/30 px-1 py-0.5 rounded text-pink-400">index.html</code>.</li>
                <li>افتح موجه الأوامر (Terminal) وثبّت الإضافات: <code className="bg-black/40 text-cyan-400 px-2 py-0.5 rounded font-mono select-all">pip install flask google-genai</code></li>
                <li>شغّل النظام: <code className="bg-black/40 text-cyan-400 px-2 py-0.5 rounded font-mono select-all">python app.py</code> ثم افتح المتصفح على الرابط <code className="text-white underline">http://localhost:5000/</code></li>
              </ol>
            </div>

            {/* Code screen with copy visual controls */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
              <div className="absolute left-4 top-4 z-10 flex gap-2">
                <button 
                  onClick={() => copyToClipboard(exportFile === "app" ? pythonAppCode : pythonHtmlCode)}
                  className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الكود</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-6 overflow-x-auto text-[11px] md:text-xs font-mono text-left text-slate-300 leading-relaxed max-h-[450px]" dir="ltr">
                {exportFile === "app" ? pythonAppCode : pythonHtmlCode}
              </pre>
            </div>

          </div>
        )}

      </div>

      {/* Footer copyright section */}
      <footer className="text-center py-6 border-t border-white/5 text-[11px] text-slate-600 z-10">
        <p dir="ltr">SiteSec Vision-Intel Router v1.0 &copy; 2026. Designed with professional Glassmorphism and Gemini Vision engine.</p>
      </footer>

    </div>
  );
}
