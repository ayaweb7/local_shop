<?php
require_once '../blocks/date_base.php';

// 1. Связывание старых категорий (gruppa) с новыми
$db->query("
    UPDATE shops s
    LEFT JOIN categories c ON s.gruppa = c.name
    SET s.category_id = c.id
    WHERE s.category_id IS NULL AND s.gruppa IS NOT NULL
");

// 2. Обработка покупок без категорий
$db->query("
    UPDATE shops 
    SET category_id = (SELECT id FROM categories WHERE name = 'Продукты' LIMIT 1)
    WHERE category_id IS NULL
");

// 3. Статистика миграции
$result = $db->query("
    SELECT 
        (SELECT COUNT(*) FROM shops WHERE category_id IS NOT NULL) as with_category,
        (SELECT COUNT(*) FROM shops WHERE category_id IS NULL) as without_category,
        (SELECT COUNT(DISTINCT gruppa) FROM shops WHERE gruppa IS NOT NULL) as unique_old_categories
");

$stats = $result->fetch_assoc();

echo json_encode([
    'success' => true,
    'stats' => $stats,
    'message' => 'Миграция выполнена'
], JSON_UNESCAPED_UNICODE);
?>