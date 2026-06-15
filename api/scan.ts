import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Resilient helper wrapper to execute vision generation with:
 * 1. Exponential backoff retries for transient errors (HTTP 503, 429) up to 3 times.
 * 2. Instant fallback to gemini-1.5-flash if primary gemini-1.5-pro encounters continuous issues.
 */
async function generateContentResiliently(
  ai: GoogleGenAI,
  imagePart: any,
  textPart: any,
  systemInstruction: string
): Promise<GenerateContentResponse> {
  const models = ["gemini-1.5-pro", "gemini-1.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    let attempts = 0;
    const maxAttempts = 3;
    let currentDelay = 2000; // start with 2 seconds

    while (attempts < maxAttempts) {
      try {
        console.log(`[Resilient Proxy] Generating content with model: ${model} (Attempt ${attempts + 1}/${maxAttempts})`);
        
        const response = await ai.models.generateContent({
          model: model,
          contents: {
            parts: [imagePart, textPart]
          },
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.35
          }
        });

        if (response && response.text) {
          console.log(`[Resilient Proxy] Execution succeeded using model: ${model}`);
          return response;
        }
        
        throw new Error("Returned empty textual output.");
      } catch (err: any) {
        attempts++;
        lastError = err;
        const errMessage = (err?.message || String(err)).toLowerCase();

        console.error(`[Resilient Proxy] Error on ${model} (Attempt ${attempts}): ${err.message || err}`);

        // Handle critical instant failure categories (API key invalidation etc)
        if (
          errMessage.includes("key_invalid") || 
          errMessage.includes("api key not valid") || 
          errMessage.includes("unauthorized") ||
          errMessage.includes("invalid key")
        ) {
          throw err;
        }

        // Apply exponential backoff before the next attempt
        if (attempts < maxAttempts) {
          console.log(`[Resilient Proxy] Exponential backoff active. Waiting ${currentDelay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentDelay *= 2; // exponential scaling (2s -> 4s)
        }
      }
    }

    console.warn(`[Resilient Proxy] Model ${model} failed after ${maxAttempts} attempts. Moving to fallback option...`);
  }

  throw lastError || new Error("All responsive models failed to resolve the intelligence report.");
}

/**
 * Verifies a student/product license on Gumroad.
 */
async function verifyGumroadLicense(licenseKey: string): Promise<boolean> {
  if (!licenseKey) {
    console.warn("[Gumroad License] Verification failed: Empty License Key.");
    return false;
  }
  try {
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        product_permalink: "sitesec-vision-v1",
        license_key: licenseKey,
        increment_uses_count: "true"
      }).toString()
    });

    if (!response.ok) {
      console.warn(`[Gumroad License] Verification response status error: ${response.status}`);
      return false;
    }

    const data: any = await response.json();
    if (data && data.success === true) {
      const uses = data.uses || 0;
      if (uses <= 2) {
        console.log(`[Gumroad License] Successfully verified key. Active devices count: ${uses}`);
        return true;
      } else {
        console.warn(`[Gumroad License] License usage exceeded limits. Current Uses: ${uses}`);
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error("[Gumroad License] Network handshake error:", error);
    return false;
  }
}

export default async function handler(req: any, res: any) {
  // CORS configuration for Vercel
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Only POST endpoints allowed." });
  }

  try {
    const { apiKey, licenseKey, imageBase64, mimeType } = req.body;

    // 0. Gumroad License Validation Gate
    const isLicenseValid = await verifyGumroadLicense(licenseKey);
    if (!isLicenseValid) {
      console.warn(`[Gumroad License] Refusing scan. License key is invalid or exhausted: ${licenseKey}`);
      return res.status(403).json({
        success: false,
        error: "LICENSE_INVALID",
        message: "عذراً، رمز تفعيل الرخصة غير صالح أو تم استخدامه على أجهزة متعددة. يرجى تفعيل الأداة عبر متجر SiteSec الرسمي للتشغيل."
      });
    }

    // 1. Validate inputs
    const activeKey = (apiKey && apiKey.trim()) ? apiKey.trim() : process.env.GEMINI_API_KEY;
    
    if (!activeKey) {
      return res.status(400).json({
        success: false,
        error: "يرجى تزويد رمز واجهة برمجة التطبيقات (API Key) في الخانة المخصصة أو تهيئة مفتاح خادم رئيسي للتمكن من الاتصال الفوري."
      });
    }

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "لقطة الشاشة (Screenshot) المرفقة فارغة أو تالفة. يرجى إعادة تحميل الصورة وإعادة المحاولة."
      });
    }

    // 2. Initialize Gemini SDK
    const ai = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    // 3. Define Arabic instruction
    const systemInstruction = 
      "أنت خبير محترف في ذكاء الأعمال (BI)، ومحلل تسعير، ومستشار سلاسل التوريد والتحكيم التجاري الإلكتروني (Arbitrage).\n" +
      "مهمتك هي إجراء تحليل بصري عميق للصورة المرفقة وصياغة تقرير استراتيجي باللغة العربية الفصحى يهدف لتمكين التاجر من كسر حصة المنافس في السوق وإعادة السيطرة بهامش ربح فائق.\n\n" +
      "يجب أن يسير التحليل والتقرير وفق الهيكلية والمراحل التالية بدقة وثبات:\n" +
      "1. كشف المنتجات وتحديد الأسعار (Object Detection & Price Extraction):\n" +
      "   - تحديد وتدوين كل منتج تجاري ظاهر في لقطة الشاشة بشكل فردي.\n" +
      "   - استخراج السعر المسجل للمنافس بدقة بالعملة الظاهر (الافتراض والأساس هو الدرهم المغربي 'dh/MAD' إلا إن ظهرت عملة أخرى في الصورة).\n\n" +
      "2. مصفوفة مقارنة الفوارق السعرية والأرباح (Market Comparison Matrix):\n" +
      "   - احسب 'التكلفة التقديرية الواصلة' (Estimated Landed Cost) من خلال إضافة فارق شحن وتخليص جمركي جمركي بقيمة 25% إلى 35% فوق سعر التصنيع الافتراضي للجملة، شاملاً الضريبة على القيمة المضافة المحلية 20% TVA في المغرب.\n" +
      "   - قم بصياغة جدول مقارنة مالي يحتوي على الأعمدة التالية:\n" +
      "     * اسم المنتج كـ رابط نشط مباشر يبحث في شبكة علي بابا بالجملة بالصيغة التالية تماماً: [اسم المنتج](https://www.alibaba.com/trade/search?SearchText=Product+Name) مع استبدال اسم المنتج بالأنسب بالإنجليزية للبحث الفوري.\n" +
      "     * سعر المنافس الحالي (dh/MAD)\n" +
      "     * التكلفة التقديرية الواصلة (Landed Cost) (dh/MAD)\n" +
      "     * صافي الفجوة السعرية (Net Price Gap) (dh/MAD)\n" +
      "     * هامش الأرباح الصافي المتوقع (Net Margin %)\n\n" +
      "3. مصفوفة تقييم مخاطر السلسلة والتوريد (Quality & Sourcing Risk Assessment Matrix):\n" +
      "   - قم بتحليل المخاطر والمصادر البديلة. للسلع الكهربائية أو المعاد تجديدها أو ذات العلامات الكبرى، يرجى تزويد تنبيهات صارمة حول:\n" +
      "     * مخاطر المنتخبات المقلدة (Clone Risks).\n" +
      "     * قيود شحن البطاريات والليثيوم كبضائع خطرة (DG Cargo).\n" +
      "     * اشتراطات المصادقة التنظيمية المحلية في المغرب (مثل شهادة ANRT للأجهزة السلكية واللاسلكية والاتصالات).\n\n" +
      "4. خطة العمل اللوجستية والتسعيرية التكتيكية (Tactical Arbitrage Action Plan):\n" +
      "   - خطة واقعية ومفصلة لشحن وتخزين المنتج وتجاوز العقبات اللوجستية والمستندية الاعتيادية في الموانئ المغربية (الدار البيضاء، طنجة المتوسط).\n" +
      "   - تكتيك التسعير الهجومي لضرب وتفتيت السوق للمنافس (تقديم خصم اختراق يضمن ريادة السوق مع الاحتفاظ بأعلى ربحية ممكنة).\n" +
      "   - صغ التقرير العسكري الاستخباراتي بلهجة جادة، مِهنية، عريضة الخطوط ومقنعة للغاية.";

    const promptString = "قم بإجراء المسح الاستخباراتي البصري الكامل فوراً وصوغ تقرير التحكيم التجاري الشامل طبقاً للتعليمات والبروتوكول.";

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: imageBase64
      }
    };

    const textPart = {
      text: promptString
    };

    const response = await generateContentResiliently(ai, imagePart, textPart, systemInstruction);

    const reportText = response.text;
    if (!reportText) {
      return res.status(500).json({
        success: false,
        error: "تعذر توليد تقرير متكامل بواسطة النموذج الذكائي. الرجاء مراجعة الصورة والمحاولة مرة أخرى."
      });
    }

    return res.status(200).json({
      success: true,
      report: reportText
    });

  } catch (error: any) {
    console.error("Vercel serverless integration error:", error);
    const isApiKeyFault = error?.message?.includes("API_KEY_INVALID") || error?.message?.includes("API key not valid");
    return res.status(500).json({
      success: false,
      error: isApiKeyFault 
        ? "رمز واجهة برمجة التطبيقات (API Key) غير صالح أو منتهي الصلاحية. يرجى الحصول على رمز جديد صالح من Google AI Studio."
        : `خطأ أثناء الاتصال بمزود الذكاء البصري: ${error.message || error}`
    });
  }
}
