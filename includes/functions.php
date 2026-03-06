<?php
/**
 * دوال مساعدة عامة
 */

/**
 * تنسيق المبلغ بالدينار الأردني
 */
function formatAmount($amount)
{
    return number_format((float) ($amount ?? 0), 3) . ' د.أ';
}

/**
 * تنسيق التاريخ بالعربي
 */
function formatDate($date)
{
    if (!$date)
        return '-';
    $ts = strtotime($date);
    return $ts ? date('Y/m/d', $ts) : '-';
}

/**
 * تنسيق التاريخ والوقت - 12 ساعة
 */
function formatDateTime($date)
{
    if (!$date)
        return '-';
    $ts = strtotime($date);
    return $ts ? date('Y/m/d h:i A', $ts) : '-';
}

/**
 * ترجمة طريقة الدفع
 */
function paymentMethodLabel($method)
{
    $method = (string) ($method ?? '');
    $labels = [
        'cash' => 'نقداً',
        'transfer' => 'تحويل بنكي',
    ];
    return $labels[$method] ?? $method;
}

/**
 * ترجمة نوع المصروف
 */
function expenseTypeLabel($type)
{
    $type = (string) ($type ?? '');
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
function salaryTypeLabel($type)
{
    return ($type ?? '') === 'fixed' ? 'راتب ثابت' : 'عمولة %';
}

/**
 * حساب عمولة الموظف
 */
function calcCommission($total, $rate)
{
    return ((float) ($total ?? 0) * (float) ($rate ?? 0)) / 100;
}

/**
 * تنظيف المدخلات
 */
function clean($str)
{
    return htmlspecialchars(trim((string) ($str ?? '')), ENT_QUOTES, 'UTF-8');
}

/**
 * رسالة نجاح/خطأ في الجلسة
 */
function setFlash($type, $message)
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash()
{
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

function showFlash()
{
    $flash = getFlash();
    if ($flash) {
        $cls = $flash['type'] === 'success' ? 'success' : 'danger';
        $icon = $flash['type'] === 'success' ? 'check-circle' : 'exclamation-circle';
        echo "<div class='alert alert-{$cls} alert-dismissible fade show' role='alert'>
                <i class='fas fa-{$icon} me-2'></i>{$flash['message']}
                <button type='button' class='btn-close' data-bs-dismiss='alert'></button>
              </div>";
    }
}
