<?php
require_once '../blocks/date_base.php';

header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="purchases_export.json"');

$sql = "SELECT s.*, c.name as category_name, st.shop as store_name
        FROM shops s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN stores st ON s.store_id = st.id
        ORDER BY s.date DESC";

$result = $db->query($sql);
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode(['data' => $data], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>