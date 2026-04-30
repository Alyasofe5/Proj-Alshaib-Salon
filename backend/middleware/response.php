<?php
/**
 * JSON Response Helpers
 * دوال موحدة لإرجاع الردود
 */

/**
 * إرجاع استجابة ناجحة
 */
function sendSuccess($data = null, int $code = 200, string $message = 'تمت العملية بنجاح'): void
{
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * إرجاع استجابة خطأ
 */
function sendError(string $message, int $code = 400, $errors = null): void
{
    http_response_code($code);
    $response = [
        'success' => false,
        'message' => $message,
    ];
    if ($errors !== null) {
        $response['errors'] = $errors;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * الحصول على بيانات JSON من الـ Request Body
 */
function getRequestBody(): array
{
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    return is_array($data) ? $data : [];
}

/**
 * الحصول على HTTP Method
 */
function getMethod(): string
{
    return $_SERVER['REQUEST_METHOD'];
}

/**
 * الحصول على ID من الـ Query String
 */
function getResourceId(): ?int
{
    $id = $_GET['id'] ?? null;
    return $id !== null ? (int) $id : null;
}

/**
 * تنسيق المبلغ
 */
function formatAmount($amount): string
{
    return number_format((float) ($amount ?? 0), 3) . ' د.أ';
}

/**
 * حساب العمولة
 */
function calcCommission($total, $rate): float
{
    return ((float) ($total ?? 0) * (float) ($rate ?? 0)) / 100;
}

/**
 * تنظيف المدخلات
 */
function clean($str): string
{
    return htmlspecialchars(trim((string) ($str ?? '')), ENT_QUOTES, 'UTF-8');
}

/**
 * ترجمة طريقة الدفع
 */
function paymentMethodLabel($method): string
{
    $labels = ['cash' => 'نقداً', 'transfer' => 'تحويل بنكي'];
    return $labels[$method] ?? $method;
}

/**
 * ترجمة نوع المصروف
 */
function expenseTypeLabel($type): string
{
    $labels = [
        'rent' => 'إيجار',
        'salary' => 'رواتب',
        'supplies' => 'مستلزمات',
        'utilities' => 'خدمات (كهرباء/ماء)',
        'other' => 'أخرى',
    ];
    return $labels[$type] ?? $type;
}

/**
 * ترجمة نوع الراتب
 */
function salaryTypeLabel($type): string
{
    return ($type ?? '') === 'fixed' ? 'راتب ثابت' : 'عمولة %';
}

/**
 * Split a bilingual "Arabic||English" string into separate ar/en fields.
 * Returns ['ar' => string, 'en' => ?string]. Use across all INSERT/UPDATE
 * statements writing to *_ar / *_en columns.
 *
 * Usage:
 *   ['ar' => $nameAr, 'en' => $nameEn] = splitBilingual($data['name'] ?? '');
 *   // Or: $parts = splitBilingual($input);  $parts['ar'], $parts['en']
 */
function splitBilingual($value): array
{
    $value = trim((string) ($value ?? ''));
    if ($value === '') return ['ar' => '', 'en' => null];
    if (strpos($value, '||') === false) return ['ar' => $value, 'en' => null];
    $parts = array_map('trim', explode('||', $value, 2));
    $ar = $parts[0] ?? '';
    $en = $parts[1] ?? '';
    return ['ar' => $ar !== '' ? $ar : $value, 'en' => $en !== '' ? $en : null];
}
