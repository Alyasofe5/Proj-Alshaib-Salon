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
