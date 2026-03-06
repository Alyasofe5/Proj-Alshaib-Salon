<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>
        <?= $pageTitle ?? 'AL SHAYEB' ?>
    </title>
    <link
        href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=Cinzel:wght@700&display=swap"
        rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
    <style>
        :root {
            --gold: #C9A84C;
            --gold-light: #e8c96a;
            --gold-dark: #a07c30;
            --black: #1A1A1A;
            --dark: #111111;
            --dark2: #161616;
            --dark3: #1c1c1c;
            --dark4: #222222;
            --sidebar-w: 260px;
            --text-muted-custom: #888;
        }

        * {
            font-family: 'Tajawal', sans-serif;
            box-sizing: border-box;
        }

        body {
            background: #0f0f0f;
            color: #e0e0e0;
            margin: 0;
        }

        /* ===== SIDEBAR ===== */
        .sidebar {
            position: fixed;
            top: 0;
            right: 0;
            width: var(--sidebar-w);
            height: 100vh;
            background: var(--dark3);
            border-left: 1px solid rgba(201, 168, 76, 0.15);
            display: flex;
            flex-direction: column;
            z-index: 1000;
            overflow-y: auto;
        }

        .sidebar-logo {
            padding: 24px 20px;
            border-bottom: 1px solid rgba(201, 168, 76, 0.1);
            text-align: center;
        }

        .sidebar-logo .logo-icon {
            width: 80px;
            height: 80px;
            background: transparent;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0;
        }

        .as-logo-svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
        }
        
        .as-logo-svg text {
            text-anchor: middle;
        }

        .sidebar-logo .salon-name {
            font-size: 14px;
            font-weight: 800;
            color: #fff;
            letter-spacing: 1px;
        }

        .sidebar-logo .salon-name span {
            color: var(--gold);
        }

        .sidebar-logo .salon-sub {
            font-size: 9px;
            color: var(--gold);
            letter-spacing: 2px;
            margin-top: 2px;
        }

        .sidebar-nav {
            flex: 1;
            padding: 16px 12px;
        }

        .nav-section-title {
            font-size: 10px;
            color: #555;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: 12px 12px 6px;
            font-weight: 600;
        }

        .nav-link-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 16px;
            border-radius: 8px;
            color: #aaa;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            margin-bottom: 4px;
        }

        .nav-link-item:hover {
            background: rgba(201, 168, 76, 0.08);
            color: var(--gold);
            padding-right: 20px;
        }

        .nav-link-item.active {
            background: rgba(201, 168, 76, 0.15);
            color: var(--gold);
            border-right: 4px solid var(--gold);
        }

        .nav-link-item .nav-icon {
            width: 24px;
            text-align: center;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .sidebar-footer {
            padding: 16px 12px;
            border-top: 1px solid rgba(201, 168, 76, 0.1);
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            margin-bottom: 8px;
        }

        .user-avatar {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--gold), var(--gold-light));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: var(--black);
            font-weight: 700;
            flex-shrink: 0;
        }

        .user-name {
            font-size: 13px;
            color: #ddd;
            font-weight: 600;
        }

        .user-role {
            font-size: 11px;
            color: var(--gold);
        }

        .btn-logout {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 9px 14px;
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid rgba(220, 53, 69, 0.2);
            border-radius: 8px;
            color: #ff6b7a;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.2s;
        }

        .btn-logout:hover {
            background: rgba(220, 53, 69, 0.2);
            color: #ff6b7a;
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
            margin-right: var(--sidebar-w);
            min-height: 100vh;
            padding: 0;
        }

        .topbar {
            background: var(--dark3);
            border-bottom: 1px solid rgba(201, 168, 76, 0.1);
            padding: 16px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .topbar-title {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
        }

        .topbar-title span {
            color: var(--gold);
        }

        .topbar-date {
            font-size: 12px;
            color: #666;
        }

        .content-area {
            padding: 28px;
        }

        /* ===== CARDS ===== */
        .stat-card {
            background: var(--dark3);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            padding: 22px;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s;
        }

        .stat-card:hover {
            transform: translateY(-2px);
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
        }

        .stat-card.gold::before {
            background: linear-gradient(90deg, var(--gold), var(--gold-light));
        }

        .stat-card.green::before {
            background: linear-gradient(90deg, #2ecc71, #27ae60);
        }

        .stat-card.blue::before {
            background: linear-gradient(90deg, #3498db, #2980b9);
        }

        .stat-card.red::before {
            background: linear-gradient(90deg, #e74c3c, #c0392b);
        }

        .stat-card.purple::before {
            background: linear-gradient(90deg, #9b59b6, #8e44ad);
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            margin-bottom: 14px;
        }

        .stat-icon.gold {
            background: rgba(201, 168, 76, 0.15);
            color: var(--gold);
        }

        .stat-icon.green {
            background: rgba(46, 204, 113, 0.15);
            color: #2ecc71;
        }

        .stat-icon.blue {
            background: rgba(52, 152, 219, 0.15);
            color: #3498db;
        }

        .stat-icon.red {
            background: rgba(231, 76, 60, 0.15);
            color: #e74c3c;
        }

        .stat-icon.purple {
            background: rgba(155, 89, 182, 0.15);
            color: #9b59b6;
        }

        .stat-value {
            font-size: 26px;
            font-weight: 800;
            color: #fff;
            margin-bottom: 4px;
        }

        .stat-label {
            font-size: 12px;
            color: #888;
            font-weight: 500;
        }

        .stat-sub {
            font-size: 11px;
            color: #555;
            margin-top: 6px;
        }

        /* ===== TABLE ===== */
        .custom-table {
            background: var(--dark3);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .custom-table table {
            margin: 0;
        }

        .custom-table thead th {
            background: rgba(201, 168, 76, 0.08) !important;
            color: var(--gold) !important;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1px;
            border-bottom: 1px solid rgba(201, 168, 76, 0.15) !important;
            padding: 14px 16px;
        }

        .custom-table tbody tr {
            background-color: var(--dark3) !important;
        }

        .custom-table tbody tr:nth-child(even) {
            background-color: rgba(255, 255, 255, 0.02) !important;
        }

        .custom-table tbody td {
            background-color: transparent !important;
            border-color: rgba(255, 255, 255, 0.04) !important;
            color: #ccc !important;
            font-size: 14px;
            padding: 12px 16px;
            vertical-align: middle;
        }

        .custom-table tbody tr:hover td {
            background-color: rgba(201, 168, 76, 0.05) !important;
        }

        /* Override Bootstrap table defaults globally */
        .table {
            --bs-table-bg: transparent;
            --bs-table-striped-bg: transparent;
            --bs-table-hover-bg: transparent;
            --bs-table-color: #ccc;
            color: #ccc;
        }

        .table> :not(caption)>*>* {
            background-color: transparent !important;
            color: inherit;
        }

        /* ===== BADGE ===== */
        .badge-gold {
            background: rgba(201, 168, 76, 0.15);
            color: var(--gold);
            border: 1px solid rgba(201, 168, 76, 0.3);
        }

        .badge-green {
            background: rgba(46, 204, 113, 0.15);
            color: #2ecc71;
            border: 1px solid rgba(46, 204, 113, 0.3);
        }

        .badge-red {
            background: rgba(231, 76, 60, 0.15);
            color: #e74c3c;
            border: 1px solid rgba(231, 76, 60, 0.3);
        }

        .badge-blue {
            background: rgba(52, 152, 219, 0.15);
            color: #3498db;
            border: 1px solid rgba(52, 152, 219, 0.3);
        }

        /* ===== FORM ===== */
        .form-control,
        .form-select,
        input[type="date"],
        input[type="month"],
        input[type="text"],
        input[type="number"],
        input[type="email"],
        input[type="password"],
        textarea,
        select {
            background: #252525 !important;
            border: 1px solid #333 !important;
            color: #fff !important;
            border-radius: 8px;
            font-family: 'Tajawal', sans-serif;
        }

        .form-control:focus,
        .form-select:focus,
        input[type="date"]:focus,
        input[type="month"]:focus,
        select:focus {
            background: #2a2a2a !important;
            border-color: var(--gold) !important;
            color: #fff !important;
            box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
            outline: none;
        }

        .form-control::placeholder,
        input::placeholder,
        textarea::placeholder {
            color: #555 !important;
        }

        /* تخصيص أيقونة التقويم في date input */
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="month"]::-webkit-calendar-picker-indicator {
            filter: invert(1) opacity(0.5);
            cursor: pointer;
        }

        .form-select option,
        select option {
            background: #252525;
            color: #fff;
        }

        .form-label {
            color: #aaa;
            font-size: 13px;
            font-weight: 500;
        }

        /* ===== BUTTONS ===== */
        .btn-gold {
            background: linear-gradient(135deg, var(--gold), var(--gold-light));
            border: none;
            color: var(--black);
            font-weight: 700;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .btn-gold:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(201, 168, 76, 0.35);
            color: var(--black);
        }

        .btn-outline-gold {
            border: 1px solid var(--gold);
            color: var(--gold);
            background: transparent;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .btn-outline-gold:hover {
            background: rgba(201, 168, 76, 0.1);
            color: var(--gold);
        }

        /* ===== MODAL ===== */
        .modal-content {
            background: var(--dark3);
            border: 1px solid rgba(201, 168, 76, 0.2);
            border-radius: 12px;
        }

        .modal-header {
            border-bottom: 1px solid rgba(201, 168, 76, 0.15);
            padding: 20px 24px;
        }

        .modal-title {
            color: #fff;
            font-weight: 700;
        }

        .modal-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .btn-close {
            filter: invert(1);
        }

        /* ===== CHART CARD ===== */
        .chart-card {
            background: var(--dark3);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            padding: 22px;
        }

        .chart-card-title {
            font-size: 14px;
            font-weight: 700;
            color: #ddd;
            margin-bottom: 16px;
        }

        .chart-card-title span {
            color: var(--gold);
        }

        /* ===== ALERTS ===== */
        .alert-success {
            background: rgba(46, 204, 113, 0.1);
            border: 1px solid rgba(46, 204, 113, 0.3);
            color: #2ecc71;
            border-radius: 8px;
        }

        .alert-danger {
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid rgba(231, 76, 60, 0.3);
            color: #e74c3c;
            border-radius: 8px;
        }

        /* ===== SCROLLBAR ===== */
        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: #111;
        }

        ::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--gold);
        }

        /* ===== MOBILE OVERLAY ===== */
        .sidebar-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 999;
            backdrop-filter: blur(2px);
        }

        .sidebar-overlay.active {
            display: block;
        }

        /* ===== HAMBURGER BUTTON ===== */
        .hamburger-btn {
            display: none;
            background: rgba(201, 168, 76, 0.1);
            border: 1px solid rgba(201, 168, 76, 0.3);
            border-radius: 8px;
            color: var(--gold);
            width: 38px;
            height: 38px;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            flex-shrink: 0;
        }

        @media (max-width: 768px) {
            .sidebar {
                position: fixed;
                top: 0;
                right: -280px;
                width: 260px;
                height: 100vh;
                z-index: 1000;
                transition: right 0.3s ease;
            }

            .sidebar.open {
                right: 0;
            }

            .main-content {
                margin-right: 0;
            }

            .hamburger-btn {
                display: flex;
            }

            .topbar {
                padding: 12px 16px;
                flex-wrap: wrap;
                gap: 8px;
            }

            .topbar-title {
                font-size: 15px;
            }

            .content-area {
                padding: 16px;
            }

            .stat-card {
                padding: 16px;
            }

            .stat-value {
                font-size: 20px;
            }

            .custom-table {
                overflow-x: auto;
            }

            .custom-table table {
                min-width: 550px;
            }

            .chart-card {
                padding: 16px;
            }

            .modal-dialog {
                margin: 10px;
            }
        }

        @media (max-width: 480px) {
            .content-area {
                padding: 12px;
            }

            .stat-value {
                font-size: 18px;
            }

            .topbar-title {
                font-size: 14px;
            }
        }
    </style>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const topbar = document.querySelector('.topbar');
            if (!topbar || topbar.querySelector('.hamburger-btn')) return;
            const btn = document.createElement('button');
            btn.className = 'hamburger-btn';
            btn.setAttribute('aria-label', 'القائمة');
            btn.innerHTML = '<i class="fas fa-bars"></i>';
            btn.onclick = function () { if (typeof openSidebar === 'function') openSidebar(); };
            topbar.insertBefore(btn, topbar.firstChild);
        });
    </script>