# GitHub Actions Deploy Guide

هذا الدليل يشرح من الصفر كيف تجعل مشروع `Proj-Alshaib-Salon` يبني نفسه ويرفع نفسه تلقائيًا إلى السيرفر باستخدام `GitHub Actions` بدل الرفع اليدوي.

---

## الهدف

بعد إنهاء هذا الدليل سيكون عندك:

1. مشروع مربوط مع GitHub.
2. Workflow جاهز داخل:
   [`deploy.yml`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\.github\workflows\deploy.yml)
3. Secrets محفوظة بشكل آمن داخل GitHub.
4. كل `push` على الفرع الرئيسي يبني المشروع.
5. GitHub يتحقق من وجود ملفات `/_next/static`.
6. GitHub يجهز `deploy_combined`.
7. GitHub يرفع الملفات إلى السيرفر تلقائيًا.

---

## قبل أن تبدأ

تحتاج هذه الأشياء:

1. حساب GitHub.
2. Repository على GitHub لهذا المشروع.
3. بيانات FTP الخاصة بالسيرفر.
4. صلاحية الدخول إلى Hostinger أو لوحة الاستضافة.
5. المشروع موجود عندك محليًا على الجهاز.

---

## ملفات المشروع المهمة

هذه الملفات هي الأساس في عملية النشر:

- [`deploy.yml`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\.github\workflows\deploy.yml)
- [`DEPLOY-SECRETS.md`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\.github\DEPLOY-SECRETS.md)
- [`build.ps1`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\build.ps1)
- [`deploy.config.json`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\deploy.config.json)
- [`next.config.mjs`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\frontend\next.config.mjs)

---

## كيف تعمل العملية

الـ Workflow يفعل هذا:

1. يسحب الكود من GitHub.
2. يثبت حزم `frontend`.
3. يشغل `npm ci`.
4. يشغل `npm run build`.
5. يتأكد أن هذه الملفات موجودة:
   - `frontend/out`
   - `frontend/out/_next/static`
   - `frontend/out/book/index.html`
6. ينسخ ملفات الواجهة والباكند إلى `deploy_combined`.
7. يرفع الناتج كـ `artifact`.
8. يرفع محتويات `deploy_combined` إلى `/public_html/` على السيرفر.

---

## المرحلة 1: تجهيز بيانات السيرفر

تحتاج 4 Secrets داخل GitHub:

1. `FTP_HOST`
2. `FTP_USERNAME`
3. `FTP_PASSWORD`
4. `FTP_SERVER_DIR`

### من أين تجلبها

#### الخيار 1: من Hostinger

ادخل إلى لوحة Hostinger ثم:

1. `Websites`
2. اختر موقعك
3. `Manage`
4. `Files`
5. `FTP Accounts`

هناك ستجد غالبًا:

- اسم السيرفر أو `FTP Host`
- اسم المستخدم
- خيار تغيير كلمة المرور
- أحيانًا المسار الافتراضي للموقع

#### الخيار 2: من المشروع المحلي

من الملف:
[`deploy.config.json`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\deploy.config.json)

ستجد:

- `ftp.host` = قيمة `FTP_HOST`
- `ftp.user` = قيمة `FTP_USERNAME`
- `ftp.pass` = قيمة `FTP_PASSWORD`
- `ftp.root` = قيمة `FTP_SERVER_DIR`

### القيم الموجودة حاليًا في المشروع

حسب الملف الحالي:

- `FTP_HOST`: `145.223.77.220`
- `FTP_USERNAME`: `u778871816.maqas.site`
- `FTP_SERVER_DIR`: `/public_html/`

### مهم جدًا

بما أن كلمة مرور FTP كانت محفوظة محليًا في المشروع، الأفضل جدًا:

1. تغير كلمة مرور FTP من Hostinger الآن.
2. تستخدم كلمة المرور الجديدة فقط داخل GitHub Secrets.
3. لا تضعها داخل أي ملف في المشروع مرة أخرى.

---

## المرحلة 2: تغيير كلمة مرور FTP

هذه الخطوة أوصي بها بقوة قبل أي شيء.

1. ادخل Hostinger.
2. افتح `FTP Accounts`.
3. اختر حساب FTP المستخدم للموقع.
4. غيّر كلمة المرور.
5. انسخ الكلمة الجديدة واحتفظ بها مؤقتًا.
6. لا تحفظها داخل ملفات المشروع.

---

## المرحلة 3: رفع المشروع إلى GitHub

إذا لم يكن المشروع مربوطًا بعد مع GitHub:

### 1. أنشئ Repository جديد

مثال:

- اسم المستودع: `Proj-Alshaib-Salon`

### 2. تحقق من وضع Git محليًا

نفذ داخل المشروع:

```powershell
git remote -v
```

### 3. إذا لم يوجد `origin`

أضف المستودع:

```powershell
git remote add origin https://github.com/USERNAME/REPO.git
```

استبدل:

- `USERNAME` باسم حسابك
- `REPO` باسم المستودع

### 4. ارفع المشروع

```powershell
git add .
git commit -m "Add GitHub Actions deploy workflow"
git branch -M main
git push -u origin main
```

إذا كان المشروع مربوطًا أصلًا:

```powershell
git add .
git commit -m "Add GitHub Actions deploy workflow"
git push origin main
```

---

## المرحلة 4: إضافة Secrets داخل GitHub

بعد رفع المشروع:

1. افتح Repository على GitHub.
2. ادخل إلى `Settings`.
3. افتح `Secrets and variables`.
4. افتح `Actions`.
5. اضغط `New repository secret`.

أضف هذه القيم واحدة واحدة:

### Secret 1

Name:

```text
FTP_HOST
```

Value:

```text
145.223.77.220
```

أو القيمة الجديدة من لوحة Hostinger إذا كانت مختلفة.

### Secret 2

Name:

```text
FTP_USERNAME
```

Value:

```text
u778871816.maqas.site
```

### Secret 3

Name:

```text
FTP_PASSWORD
```

Value:

ضع كلمة المرور الجديدة التي أنشأتها من Hostinger.

### Secret 4

Name:

```text
FTP_SERVER_DIR
```

Value:

```text
/public_html/
```

---

## المرحلة 5: التأكد من الفرع الرئيسي

الملف:
[`deploy.yml`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\.github\workflows\deploy.yml)

يعمل حاليًا على الفرع:

```yml
branches:
  - main
```

إذا كنت تستخدم فرعًا آخر مثل `master`:

غيّر هذا السطر إلى:

```yml
branches:
  - master
```

إذا لم تكن متأكدًا من اسم الفرع:

نفذ:

```powershell
git branch --show-current
```

---

## المرحلة 6: تشغيل أول Deploy يدويًا

بعد رفع الكود وإضافة Secrets:

1. افتح GitHub.
2. افتح تبويب `Actions`.
3. اختر:
   `Build And Deploy`
4. اضغط:
   `Run workflow`
5. اختر الفرع `main`
6. تأكد أن:
   `deploy = true`
7. اضغط تشغيل

---

## المرحلة 7: كيف تتابع التنفيذ

بعد بدء التشغيل ستشاهد Jobs وخطوات.

الخطوات المهمة:

1. `Checkout repository`
2. `Setup Node.js`
3. `Install frontend dependencies`
4. `Build frontend export`
5. `Verify exported assets exist`
6. `Prepare deploy package`
7. `Archive deploy package`
8. `Upload to FTP`

### متى نعتبر التشغيل ناجحًا

إذا أصبحت كل الخطوات خضراء فالنشر نجح.

---

## المرحلة 8: كيف تتأكد أن الموقع فعلاً تحدّث

بعد نجاح الـ Workflow:

1. افتح الموقع.
2. اعمل:
   - `Ctrl + F5`
   - أو افتح نافذة خاصة `Incognito`
3. افتح الصفحة:
   `https://maqas.site/book/?s=alshaib`
4. تأكد من:
   - ظهور آخر الخدمات
   - ظهور آخر الصور والفيديوهات
   - عدم وجود 404 لملفات `/_next`

---

## المرحلة 9: كيف يعمل النشر اليومي بعد ذلك

بعد الإعداد لأول مرة، كل ما عليك عادة:

1. تعدل الكود محليًا
2. تحفظ الملفات
3. تنفذ:

```powershell
git add .
git commit -m "Describe your change"
git push origin main
```

ثم GitHub Actions سيتولى:

- build
- verify
- package
- upload

بدون FileZilla وبدون رفع يدوي

---

## المرحلة 10: كيف تشغله بدون رفع

إذا أردت فقط تجربة البناء بدون رفع إلى السيرفر:

1. افتح `Actions`
2. `Build And Deploy`
3. `Run workflow`
4. اجعل:

```text
deploy = false
```

بهذه الحالة:

- سيتم build
- سيتم تجهيز artifact
- لن يتم رفعه إلى السيرفر

هذا مفيد جدًا لاختبار البناء قبل النشر.

---

## المرحلة 11: كيف تحصل على الـ Artifact

إذا شغلت build فقط أو أردت تنزيل الناتج:

1. افتح run داخل `Actions`
2. في الأسفل ستجد `Artifacts`
3. نزّل:
   `deploy_combined`

هذا مفيد إذا أردت فحص الملفات الناتجة قبل رفعها.

---

## المرحلة 12: ماذا تفعل إذا فشل الـ Build

إذا فشل عند:

### `Install frontend dependencies`

المشكلة غالبًا:

- `package-lock.json`
- dependency conflict

### `Build frontend export`

المشكلة غالبًا:

- خطأ Next.js
- import broken
- page build issue

### `Verify exported assets exist`

هذا يعني أن `frontend/out` لم يتم إنشاؤه بشكل صحيح.

### `Upload to FTP`

هذا يعني أن:

- `FTP_HOST` أو `FTP_USERNAME` أو `FTP_PASSWORD` خطأ
- أو المسار `FTP_SERVER_DIR` خطأ

---

## المرحلة 13: أكثر المشاكل الشائعة

### المشكلة 1: الموقع لم يتحدث رغم نجاح Workflow

التحقق:

1. افتح `Actions`
2. تأكد أن `Upload to FTP` نجح
3. امسح كاش المتصفح
4. افتح الصفحة في نافذة خاصة
5. افحص وجود ملفات `/_next`

### المشكلة 2: يرفع لكن الموقع يبقى قديمًا

غالبًا السبب:

- كاش متصفح
- كاش CDN
- أو أن المسار ليس `/public_html/`

### المشكلة 3: ظهور 404 لملفات `_next`

غالبًا السبب:

- `frontend/out` لم يُنسخ بشكل صحيح
- أو `/_next` لم يُرفع
- أو المسار النهائي في السيرفر خطأ

### المشكلة 4: فشل رفع FTP

غالبًا السبب:

- كلمة مرور خاطئة
- المستخدم خاطئ
- `FTP_SERVER_DIR` غير صحيح

---

## المرحلة 14: إعدادات الأمان الموصى بها

### لا تفعل

- لا تحفظ كلمة مرور FTP داخل المشروع
- لا ترفع `deploy.config.json`
- لا تشارك Secrets في المحادثات أو الصور

### افعل

- استخدم GitHub Secrets فقط
- غيّر كلمة المرور القديمة
- استخدم حساب FTP مخصص للموقع إن أمكن

---

## المرحلة 15: التحقق النهائي 100%

قبل أن تقول إن النظام أصبح جاهزًا نهائيًا، تأكد من هذه القائمة:

- المشروع موجود على GitHub
- يوجد ملف:
  [`deploy.yml`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\.github\workflows\deploy.yml)
- تمت إضافة Secrets الأربعة
- تم تشغيل workflow يدويًا مرة واحدة على الأقل
- الـ build نجح
- رفع FTP نجح
- الموقع فتح بدون 404
- التعديلات ظهرت فعلاً على الموقع

---

## أسرع Checklist عملية

1. غيّر كلمة مرور FTP من Hostinger.
2. ارفع المشروع إلى GitHub.
3. أضف Secrets الأربعة.
4. تأكد أن الفرع هو `main`.
5. نفّذ `Run workflow`.
6. تأكد أن `Upload to FTP` نجح.
7. افتح الموقع مع `Ctrl + F5`.

---

## القيم التي عندك الآن من المشروع

من الملف:
[`deploy.config.json`](c:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\deploy.config.json)

القيم الحالية:

- `FTP_HOST`: `145.223.77.220`
- `FTP_USERNAME`: `u778871816.maqas.site`
- `FTP_SERVER_DIR`: `/public_html/`

أما `FTP_PASSWORD`:

- لا تستخدم القديمة
- غيّرها من Hostinger ثم ضع الجديدة فقط داخل GitHub Secrets

---

## إذا أردت المسار الاحترافي الكامل لاحقًا

بعد أن يعمل هذا النظام بشكل ثابت، يمكن تطويره إلى:

1. `build-only` workflow
2. `deploy-production` workflow
3. `staging` environment
4. deploy عند `manual approval`
5. rollback artifact

لكن لا تبدأ بذلك الآن. الأفضل أولًا أن نجعل هذا المسار يعمل بنجاح من أول تشغيل.

---

## ملاحظتي النهائية

في حالتك، هذا المسار أفضل من الرفع اليدوي بكثير لأنه:

- يزيل أخطاء النسيان
- يثبت البناء
- يعطيك سجلًا واضحًا لكل Deploy
- ويمنع مشكلة أن ترفع مجلدًا قديمًا دون أن تنتبه

إذا أردت، الخطوة التالية أستطيع أن أجهزها لك أيضًا:

- ملف `MD` ثاني خاص فقط بالـ troubleshooting
- أو نسخة workflow فيها `manual deploy only`
- أو أراجع معك خطوة GitHub نفسها سطرًا بسطرًا حسب حالتك الحالية
