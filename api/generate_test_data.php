<?php
require_once '../blocks/date_base.php';

// Генерация 100+ тестовых покупок за последний год
$stores = [1, 2, 3, 4];
$categories = range(1, 20); // Все наши категории
$products = [
    'Молоко', 'Хлеб', 'Яйца', 'Сахар', 'Масло', 'Сыр', 'Колбаса',
    'Порошок', 'Мыло', 'Шампунь', 'Губки', 'Салфетки', 'Пакеты',
    'Гвозди', 'Шурупы', 'Краска', 'Кисть', 'Провод', 'Лампа', 'Розетка'
];

// Очистка старых тестовых данных (опционально)
// $db->query("DELETE FROM shops WHERE id > 100");

// Генерация 50-150 покупок
$count = rand(50, 150);
$inserted = 0;

for ($i = 0; $i < $count; $i++) {
    $date = date('Y-m-d', strtotime('-' . rand(0, 365) . ' days'));
    $store_id = $stores[array_rand($stores)];
    $category_id = $categories[array_rand($categories)];
    $product = $products[array_rand($products)];
    $price = round(rand(50, 5000) / 10, 2); // 5.00 - 500.00
    $quantity = round(rand(1, 100) / 10, 2); // 0.1 - 10.0
    $item = ['шт.', 'кг', 'л', 'м', 'упак.'][array_rand([0,1,2,3,4])];
    $amount = round($price * $quantity, 2);
    
    $stmt = $db->prepare("
        INSERT INTO shops (date, store_id, name, category_id, price, quantity, item, amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param('sisiddsd', $date, $store_id, $product, $category_id, $price, $quantity, $item, $amount);
    
    if ($stmt->execute()) {
        $inserted++;
    }
}

echo json_encode([
    'success' => true,
    'message' => "Сгенерировано $inserted тестовых покупок",
    'total_purchases' => $inserted
], JSON_UNESCAPED_UNICODE);
?>