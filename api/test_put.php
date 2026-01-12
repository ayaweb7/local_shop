<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once '../blocks/date_base.php';

// Тестовые данные для обновления
$testData = [
    'date' => '2025-12-06',
    'store_id' => 1,
    'name' => 'Обновленный товар',
    'gruppa' => 'Тест',
    'price' => 150,
    'quantity' => 3,
    'item' => 'шт.',
    'amount' => 450,
    'characteristic' => 'Обновленная характеристика'
];

// Берём ID существующей записи
$id = 5; // ID тестового товара

$stmt = $db->prepare("
    UPDATE shops 
    SET date = ?, store_id = ?, name = ?, gruppa = ?, 
        characteristic = ?, quantity = ?, item = ?, price = ?, amount = ?
    WHERE id = ?
");

if (!$stmt) {
    echo json_encode(['error' => 'Prepare failed: ' . $db->error], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt->bind_param(
    'sisssdsddi',
    $testData['date'],
    $testData['store_id'],
    $testData['name'],
    $testData['gruppa'],
    $testData['characteristic'],
    $testData['quantity'],
    $testData['item'],
    $testData['price'],
    $testData['amount'],
    $id
);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'affected_rows' => $stmt->affected_rows,
        'message' => 'Test update successful'
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
}
?>