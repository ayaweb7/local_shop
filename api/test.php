<?php
// test.php - чистый тест API
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once '../blocks/date_base.php';

// Простой тест - добавить покупку
$testData = [
    'date' => '2025-12-05',
    'store_id' => 1,
    'name' => 'Тестовый товар',
    'gruppa' => 'Продукты',
    'price' => 100,
    'quantity' => 2,
    'item' => 'шт.',
    'amount' => 200,
    'characteristic' => 'Тестовая характеристика'
];

$stmt = $db->prepare("
    INSERT INTO shops (date, store_id, name, gruppa, characteristic, quantity, item, price, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    'sisssdsdd',
    $testData['date'],
    $testData['store_id'],
    $testData['name'],
    $testData['gruppa'],
    $testData['characteristic'],
    $testData['quantity'],
    $testData['item'],
    $testData['price'],
    $testData['amount']
);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
} else {
    echo json_encode(['error' => $stmt->error]);
}
?>