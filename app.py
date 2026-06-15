#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiteSec Vision-Intel Router v1.0 - Local Backend Orchestrator
E-Commerce & Commercial Arbitrage Sourcing Engine
Powered by Gemini 1.5 Pro / 1.5 Flash (using client-provided API key)

To run this application locally:
1. Ensure Python 3.9+ is installed.
2. Install required dependencies:
   pip install flask google-genai markdown
3. Place this app.py and templates/index.html in their respective directories.
4. Run: python app.py
5. Access the modern Liquid Glass dashboard on http://localhost:5000/
"""

import os
import time
import base64
import logging
import urllib.request
import urllib.parse
import urllib.error
import json
from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types
from google.genai.errors import APIError

# Initialize system logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Restrict max upload size to 16MB for secure memory bounds
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

def verify_gumroad_license(license_key):
    """
    Sends a synchronous POST request to the official Gumroad API endpoint
    to verify the product activation key against our sitesec-vision-v1 permalink.
    Allows up to 2 concurrent device uses to support reasonable licensing limits,
    and gracefully handles network handshakes and exceptions.
    """
    if not license_key:
        logger.warning("[Gumroad License] Empty license key submitted.")
        return False

    url = "https://api.gumroad.com/v2/licenses/verify"
    payload = {
        "product_permalink": "sitesec-vision-v1",
        "license_key": license_key,
        "increment_uses_count": "true"
    }

    try:
        data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

        # Set a reasonable timeout to prevent hanging the system
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = response.read().decode("utf-8")
            res_json = json.loads(res_data)

            # Gumroad returns "success": true when verification completes successfully
            if res_json.get("success") is True:
                uses = res_json.get("uses", 0)
                # Max device limit to support device mobility is set to 2. Change according to policy.
                if isinstance(uses, (int, float)) and uses <= 2:
                    logger.info(f"[Gumroad License] Key verified successfully. Current Uses Count: {uses}")
                    return True
                else:
                    logger.error(f"[Gumroad License] License usage exceeded limits. Uses: {uses}")
                    return False
            else:
                logger.warning(f"[Gumroad License] API rejected license key. Response details: {res_json}")
                return False

    except urllib.error.URLError as url_err:
        logger.error(f"[Gumroad License] Network handshake exception during activation check: {url_err}")
        # Graceful degradation logic if target is offline, or custom response
        return False
    except Exception as e:
        logger.error(f"[Gumroad License] Unexpected error verifying license: {str(e)}")
        return False

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
                logger.info(f"[Resilient Call] Attempting report with {model} (Attempt {attempts + 1}/{max_attempts})")
                
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
                    logger.info(f"[Resilient Call] Content generation succeeded using {model}")
                    return response.text
                
                raise RuntimeError("Empty response received from API.")
                
            except Exception as e:
                attempts += 1
                last_error = e
                err_msg = str(e).lower()
                logger.error(f"[Resilient Call] Error with model {model} on attempt {attempts}: {e}")

                # If the error is clearly an invalid API key, do not retry
                if "key_invalid" in err_msg or "unauthorized" in err_msg or "api key not valid" in err_msg:
                    raise e

                # Delay before retry
                if attempts < max_attempts:
                    logger.info(f"[Resilient Call] Backing off for {current_delay}s...")
                    time.sleep(current_delay)
                    current_delay *= 2.0

        logger.warn(f"[Resilient Call] Model {model} failed all attempts. Falling back to next model...")

    raise last_error or RuntimeError("All vision intelligence models failed to generate content.")

@app.route('/')
def index():
    """
    Renders the primary cybernetic Liquid Glass control dashboard.
    """
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def scan_intelligence():
    """
    Core API route to orchestrate Gemini Vision intelligence scan.
    Receives API key, license key and image upload, validates them, builds the intelligence prompt,
    triggers GenAI, and returns structured Arab tactical arbitrage diagnostics.
    """
    try:
        # 0. Gumroad License Validation Gate
        license_key = request.form.get('license_key', '').strip()
        if not verify_gumroad_license(license_key):
            logger.warning(f"[Gumroad Licence] Invalid License Key attempted: {license_key}")
            return jsonify({
                'success': False,
                'error': 'LICENSE_INVALID',
                'message': 'عذراً، رمز تفعيل الرخصة غير صالح أو تم استخدامه على أجهزة متعددة. يرجى تفعيل الأداة عبر متجر SiteSec الرسمي للتشغيل.'
            }), 403

        # 1. Extraction of User-Supplied Credentials
        api_key = request.form.get('api_key', '').strip()
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'الرجاء إدخال رمز واجهة برمجة التطبيقات (API Key) الخاص بـ Google AI Studio للمتابعة.'
            }), 400

        # 2. Extraction & Validation of competitor screenshot
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'الرجاء إرفاق لقطة شاشة (Screenshot) لصفحة المنتج أو المخزون الخاص بالمنافس.'
            }), 400

        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({
                'success': False,
                'error': 'لم يتم تحديد ملف صالح للمسح.'
            }), 400

        # Read file details
        image_bytes = image_file.read()
        mime_type = image_file.content_type or 'image/png'

        # 3. Instantiate robust Google GenAI Client with the user's secure API Key
        client = genai.Client(api_key=api_key)

        # 4. Formulate the Strategic Arbitrage Intelligence System Prompt (in Arabic)
        system_instruction = (
            "أنت خبير محترف في ذكاء الأعمال (BI)، ومحلل تسعير، ومستشار سلاسل التوريد والتحكيم التجاري الإلكتروني (Arbitrage).\n"
            "مهمتك هي إجراء تحليل بصري عميق للصورة المرفقة وصياغة تقرير استراتيجي باللغة العربية الفصحى يهدف لتمكين التاجر من كسر حصة المنافس في السوق وإعادة السيطرة بهامش ربح فائق.\n\n"
            "يجب أن يسير التحليل والتقرير وفق الهيكلية والمراحل التالية بدقة وثبات:\n"
            "1. كشف المنتجات وتحديد الأسعار (Object Detection & Price Extraction):\n"
            "   - تحديد وتدوين كل منتج تجاري ظاهر في لقطة الشاشة بشكل فردي.\n"
            "   - استخراج السعر المسجل للمنافس بدقة بالعملة الظاهر (الافتراض والأساس هو الدرهم المغربي 'dh/MAD' إلا إن ظهرت عملة أخرى في الصورة).\n\n"
            "2. مصفوفة مقارنة الفوارق السعرية والأرباح (Market Comparison Matrix):\n"
            "   - احسب 'التكلفة التقديرية الواصلة' (Estimated Landed Cost) من خلال إضافة فارق شحن وتخليص جمركي شحن بقيمة 25% إلى 35% فوق سعر التصنيع الافتراضي للجملة، شاملاً الضريبة على القيمة المضافة المحلية 20% TVA في المغرب.\n"
            "   - قم بصياغة جدول مقارنة مالي يحتوي على الأعمدة التالية:\n"
            "     * اسم المنتج كـ رابط نشط مباشر يبحث في شبكة علي بابا بالجملة بالصيغة التالية تماماً: [اسم المنتج](https://www.alibaba.com/trade/search?SearchText=Product+Name) مع استبدال اسم المنتج بالأنسب بالإنجليزية للبحث الفوري.\n"
            "     * سعر المنافس الحالي (dh/MAD)\n"
            "     * التكلفة التقديرية الواصلة (Landed Cost) (dh/MAD)\n"
            "     * صافي الفجوة السعرية (Net Price Gap) (dh/MAD)\n"
            "     * هامش الأرباح الصافي المتوقع (Net Margin %)\n\n"
            "3. مصفوفة تقييم مخاطر السلسلة والتوريد (Quality & Sourcing Risk Assessment Matrix):\n"
            "   - قم بتحليل المخاطر والمصادر البديلة. للسلع الكهربائية أو المعاد تجديدها أو ذات العلامات الكبرى، يرجى تزويد تنبيهات صارمة حول:\n"
            "     * مخاطر المنتخبات المقلدة (Clone Risks).\n"
            "     * قيود شحن البطاريات والليثيوم كبضائع خطرة (DG Cargo).\n"
            "     * اشتراطات المصادقة التنظيمية المحلية في المغرب (مثل شهادة ANRT للأجهزة السلكية واللاسلكية والاتصالات).\n\n"
            "4. خطة العمل اللوجستية والتسعيرية التكتيكية (Tactical Arbitrage Action Plan):\n"
            "   - خطة واقعية ومفصلة لشحن وتخزين المنتج وتجاوز العقبات اللوجستية والمستندية الاعتيادية في الموانئ المغربية (الدار البيضاء، طنجة المتوسط).\n"
            "   - تكتيك التسعير الهجومي لضرب وتفتيت السوق للمنافس (تقديم خصم اختراق يضمن ريادة السوق مع الاحتفاظ بأعلى ربحية ممكنة).\n"
            "   - صغ التقرير العسكري الاستخباراتي بلهجة جادة، مِهنية، عريضة الخطوط ومقنعة للغاية."
        )

        user_content_prompt = "قم بإجراء المسح الاستخباراتي البصري الكامل فوراً وصوغ تقرير التحكيم التجاري الشامل طبقاً للتعليمات والبروتوكول."

        # 5. Call resilient generator
        report_markdown = generate_report_resiliently(
            client=client,
            image_bytes=image_bytes,
            mime_type=mime_type,
            system_instruction=system_instruction,
            user_prompt=user_content_prompt
        )

        logger.info("Scan completed successfully. Dispatching compiled report.")
        return jsonify({
            'success': True,
            'report': report_markdown
        })

    except APIError as api_err:
        logger.error(f"Gemini API Error: {str(api_err)}")
        err_msg = str(api_err)
        friendly_error = "خطأ في الاتصال بخدمة Google AI: " + err_msg
        if "API_KEY_INVALID" in err_msg or "INVALID_ARGUMENT" in err_msg or "400" in err_msg:
            friendly_error = "رمز واجهة برمجة التطبيقات (API Key) غير صالح أو منتهي الصلاحية. يرجى التحقق منه والمحاولة مرة أخرى."
        return jsonify({
            'success': False,
            'error': friendly_error
        }), 401

    except Exception as e:
        logger.error(f"Internal Orchestration Failure: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"فشل غير متوقع في معالجة الطلب: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Local host binding at port 5000 as typical for local setups
    app.run(host='0.0.0.0', port=5000, debug=True)
