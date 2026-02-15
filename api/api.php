<?php
// api/api.php - ЕДИНЫЙ РОУТИНГ ДЛЯ ВСЕХ ЭНДПОИНТОВ
require_once '../blocks/date_base.php';

// --- ВРЕМЕННО: для отладки ---
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// Логируем все запросы
// file_put_contents('api_debug.log', date('Y-m-d H:i:s') . ' - ' . $_SERVER['REQUEST_URI'] . "\n", FILE_APPEND);
// --- ВРЕМЕННО: для отладки ---

// Разрешаем CORS для локальной разработки
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

// Обрабатываем OPTIONS запросы (для CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Получаем запрос
// $method = $_SERVER['REQUEST_METHOD'];
$request = $_GET['request'] ?? '';

// ==================== ЕДИНЫЙ МАРШРУТИЗАТОР ====================
switch ($request) {
	// --- Существующие эндпоинты ---
	// Товары
    case 'purchases':
        handlePurchases($db);
        break;
    // Магазины    
    case 'stores':
        handleStores($db);
        break;
    // Города    
    case 'cities':
        handleCities($db);
        break;
    // Категории    
    case 'categories':
        handleCategories($db);
        break;
    // Статистика    
    case 'stats-categories':
        handleStatsCategories($db);
        break;
    // --- НОВЫЙ ЭНДПОИНТ для анализа цен ---
    case 'product-prices':
        getProductPrices($db);
        break;
    // --- Если ничего не найдено ---
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found: ' . $request], JSON_UNESCAPED_UNICODE);
        break;
}

// ==================== ОБРАБОТЧИКИ КОНКРЕТНЫХ ЭНДПОИНТОВ ====================

// ==================== ОБРАБОТЧИК ПОКУПОК (MySQLi) ====================
function handlePurchases($db) {
    // Получение всех покупок с JOIN магазинов и городов
	$sql = "SELECT s.*, 
				   st.shop as store_name, st.street, st.house,
				   l.town_ru as city_name,
				   c.name as category_name, c.icon as category_icon, c.color as category_color
			FROM shops s
			LEFT JOIN stores st ON s.store_id = st.id
			LEFT JOIN locality l ON st.locality_id = l.id
			LEFT JOIN categories c ON s.category_id = c.id
			ORDER BY s.date DESC";
            
	$result = $db->query($sql);
	if (!$result) {
		http_response_code(500);
		echo json_encode(['error' => $db->error]);
		return;
	}
            
	$purchases = [];
	while ($row = $result->fetch_assoc()) {
        $purchases[] = $row;
    }
    
    echo json_encode(['data' => $purchases], JSON_UNESCAPED_UNICODE);
}

// ==================== ОБРАБОТЧИК МАГАЗИНОВ (MySQLi) ====================
function handleStores($db) {
    $sql = "SELECT s.*, l.town_ru as city_name 
            FROM stores s 
            LEFT JOIN locality l ON s.locality_id = l.id 
            ORDER BY s.shop";
    
    $result = $db->query($sql);
    
    $stores = [];
    while ($row = $result->fetch_assoc()) {
		$stores[] = $row;
	}
    
    echo json_encode(['data' => $stores], JSON_UNESCAPED_UNICODE);
}

// ==================== ОБРАБОТЧИК ГОРОДОВ (MySQLi) ====================
function handleCities($db) {
    // Получение всех городов
	$sql = "SELECT * FROM locality ORDER BY town_ru";
	$result = $db->query($sql);
            
	if (!$result) {
		http_response_code(500);
		echo json_encode(['error' => $db->error], JSON_UNESCAPED_UNICODE);
		return;
	}
            
	$cities = [];
	while ($row = $result->fetch_assoc()) {
		$cities[] = $row;
	}
	
	echo json_encode(['data' => $cities], JSON_UNESCAPED_UNICODE);
}

// ==================== ОБРАБОТЧИК КАТЕГОРИЙ (MySQLi) ====================
function handleCategories($db) {
	$sql = "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name";
    $result = $db->query($sql);
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    
    echo json_encode(['data' => $categories], JSON_UNESCAPED_UNICODE);
}

// ОБРАБОТКА СТАТИСТИКИ ПО КАТЕГОРИЯМ с поддержкой фильтров:
function handleStatsCategories($method, $db) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    // Получаем параметры фильтрации
    $year = $_GET['year'] ?? null;
    $month = $_GET['month'] ?? null;
    
    // Базовый запрос
    $sql = "SELECT 
                c.id,
                c.name,
                c.icon,
                c.color,
                COUNT(s.id) as purchase_count,
                SUM(s.amount) as total_amount
            FROM categories c
            LEFT JOIN shops s ON c.id = s.category_id";
    
    // Условия фильтрации
    $conditions = ["c.is_active = TRUE"];
    
    if ($year) {
        $conditions[] = "YEAR(s.date) = " . intval($year);
    }
    
    if ($month) {
        $conditions[] = "MONTH(s.date) = " . intval($month);
    }
    
    if (count($conditions) > 1) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    } else {
        $sql .= " WHERE " . $conditions[0];
    }
    
    $sql .= " GROUP BY c.id ORDER BY total_amount DESC";
    
    $result = $db->query($sql);
    $stats = [];
    
    while ($row = $result->fetch_assoc()) {
        $stats[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'icon' => $row['icon'],
            'color' => $row['color'],
            'count' => (int)$row['purchase_count'],
            'amount' => (float)$row['total_amount'] ?: 0
        ];
    }
    
	$data = $result->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['data' => $stats], JSON_UNESCAPED_UNICODE);
}

// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ФОРМАТИРОВАНИЯ АДРЕСА
function formatAddress($row) {
    $parts = [];
    if (!empty($row['city'])) $parts[] = $row['city'];
    if (!empty($row['street']) && $row['street'] !== 'Empty') {
        $parts[] = "ул. " . $row['street'];
    }
    if (!empty($row['house']) && $row['house'] !== 'Empty') {
        $parts[] = "д. " . $row['house'];
    }
    
    return $parts ? implode(', ', $parts) : 'Адрес не указан';
}

// ==================== ГЛАВНЫЙ ОБРАБОТЧИК ДЛЯ АНАЛИЗА ЦЕН (MySQLi) =================
/**
 * ПОЛУЧЕНИЕ ДАННЫХ ДЛЯ АНАЛИЗА ЦЕН ТОВАРА
 * Параметры: 
 *   - category_id (int) - ID категории
 *   - product_name (string) - название товара
 *   - characteristic (string, optional) - характеристика
 *   - date_from (string, optional) - дата начала
 *   - date_to (string, optional) - дата окончания
 */
function getProductPrices($db) {
    try {
        // Получаем параметры
        $categoryId = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;
        $productName = isset($_GET['product_name']) ? $db->real_escape_string($_GET['product_name']) : '';
        $characteristic = isset($_GET['characteristic']) ? $db->real_escape_string($_GET['characteristic']) : null;
        $dateFrom = isset($_GET['date_from']) ? $db->real_escape_string($_GET['date_from']) : null;
        $dateTo = isset($_GET['date_to']) ? $db->real_escape_string($_GET['date_to']) : null;
        
        // Валидация
        if (!$categoryId || !$productName) {
            http_response_code(400);
            echo json_encode(['error' => 'Не указаны категория или название товара'], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        // --- 1. ПОЛУЧАЕМ ПОКУПКИ ---
        $sql = "
            SELECT 
                s.id,
                s.date,
                s.name,
                s.characteristic,
                s.quantity,
                s.item,
                s.price,
                s.amount,
                s.store_id,
                s.category_id,
                st.shop as store_name,
                c.name as category_name,
                c.icon as category_icon
            FROM shops s
            LEFT JOIN stores st ON s.store_id = st.id
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.category_id = $categoryId 
                AND s.name = '$productName'
        ";
        
        // Добавляем фильтры
        if ($characteristic && $characteristic !== '') {
            $sql .= " AND s.characteristic LIKE '%$characteristic%'";
        }
        
        if ($dateFrom) {
            $sql .= " AND s.date >= '$dateFrom'";
        }
        
        if ($dateTo) {
            $sql .= " AND s.date <= '$dateTo'";
        }
        
        $sql .= " ORDER BY s.date ASC";
        
        $result = $db->query($sql);
        
        if (!$result) {
            throw new Exception("Ошибка запроса: " . $db->error);
        }
        
        $purchases = [];
        while ($row = $result->fetch_assoc()) {
            $purchases[] = $row;
        }
        
        // --- 2. ПОЛУЧАЕМ УНИКАЛЬНЫЕ ХАРАКТЕРИСТИКИ ---
        $charSql = "
            SELECT DISTINCT characteristic
            FROM shops
            WHERE category_id = $categoryId 
                AND name = '$productName'
                AND characteristic IS NOT NULL
                AND characteristic != ''
            ORDER BY characteristic
            LIMIT 50
        ";
        
        $charResult = $db->query($charSql);
        $characteristics = [];
        if ($charResult) {
            while ($row = $charResult->fetch_assoc()) {
                $characteristics[] = $row['characteristic'];
            }
        }
        
        // --- 3. ИНФОРМАЦИЯ О КАТЕГОРИИ ---
        $catResult = $db->query("SELECT name, icon, color FROM categories WHERE id = $categoryId");
        $category = $catResult ? $catResult->fetch_assoc() : null;
        
        // --- 4. РАСЧЕТ СТАТИСТИКИ ---
        $stats = calculatePriceStatsMysqli($purchases);
        
        // --- 5. ОТВЕТ ---
        echo json_encode([
            'success' => true,
            'data' => [
                'product' => [
                    'name' => $productName,
                    'category_id' => $categoryId,
                    'category_name' => $category['name'] ?? '',
                    'category_icon' => $category['icon'] ?? '📦',
                    'category_color' => $category['color'] ?? '#007bff',
                    'total_purchases' => count($purchases),
                    'first_purchase' => !empty($purchases) ? $purchases[0]['date'] : null,
                    'last_purchase' => !empty($purchases) ? $purchases[count($purchases)-1]['date'] : null,
                    'characteristics' => $characteristics
                ],
                'purchases' => $purchases,
                'statistics' => $stats
            ]
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}

/**
 * Получение информации о категории товара
 */
function getProductInfo($db, $categoryId, $productName) {
    try {
        $sql = "
            SELECT 
                c.name as category_name,
                c.icon as category_icon,
                c.color as category_color
            FROM categories c
            WHERE c.id = :category_id
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([':category_id' => $categoryId]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Получаем все характеристики этого товара
        $sql = "
            SELECT DISTINCT characteristic
            FROM shops
            WHERE category_id = :category_id 
                AND name = :product_name
                AND characteristic IS NOT NULL
                AND characteristic != ''
            ORDER BY characteristic
            LIMIT 50
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':category_id' => $categoryId,
            ':product_name' => $productName
        ]);
        $characteristics = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        return [
            'category_name' => $category['category_name'] ?? null,
            'category_icon' => $category['category_icon'] ?? '📦',
            'category_color' => $category['category_color'] ?? '#007bff',
            'characteristics' => $characteristics
        ];
        
    } catch (Exception $e) {
        return null;
    }
}

// ==================== СТАТИСТИКА ДЛЯ MySQLi ====================
function calculatePriceStatsMysqli($purchases) {
    if (empty($purchases)) {
        return [
            'count' => 0,
            'min_price' => 0,
            'max_price' => 0,
            'avg_price' => 0,
            'first_price' => 0,
            'last_price' => 0,
            'change_amount' => 0,
            'change_percent' => 0,
            'trend' => 'stable',
            'trend_emoji' => '➡️',
            'total_amount' => 0,
            'total_quantity' => 0,
            'has_normalized' => false
        ];
    }
    
    $prices = [];
    $quantities = [];
    $amounts = [];
    
    foreach ($purchases as $p) {
        $prices[] = floatval($p['price']);
        $quantities[] = floatval($p['quantity']);
        $amounts[] = floatval($p['amount']);
    }
    
    $min_price = min($prices);
    $max_price = max($prices);
    $avg_price = array_sum($prices) / count($prices);
    $first_price = $prices[0];
    $last_price = $prices[count($prices) - 1];
    
    $change_amount = $last_price - $first_price;
    $change_percent = $first_price > 0 ? ($change_amount / $first_price) * 100 : 0;
    
    // Тренд
    if ($change_percent > 5) {
        $trend = 'rising';
        $trend_emoji = '📈';
    } elseif ($change_percent < -5) {
        $trend = 'falling';
        $trend_emoji = '📉';
    } else {
        $trend = 'stable';
        $trend_emoji = '➡️';
    }
    
    // Проверка на нормализацию
    $has_normalized = false;
    $normalized_prices = [];
    $normalized_unit = null;
    
    foreach ($purchases as $p) {
        if (in_array($p['item'], ['г', 'мл', 'см'])) {
            $has_normalized = true;
            $normalized = normalizePriceMysqli($p['price'], $p['quantity'], $p['item']);
            if ($normalized['normalized']) {
                $normalized_prices[] = $normalized['price_per_unit'];
                $normalized_unit = $normalized['normalized_unit'];
            }
        }
    }
    
    return [
        'count' => count($purchases),
        'min_price' => round($min_price, 2),
        'max_price' => round($max_price, 2),
        'avg_price' => round($avg_price, 2),
        'first_price' => round($first_price, 2),
        'last_price' => round($last_price, 2),
        'change_amount' => round($change_amount, 2),
        'change_percent' => round($change_percent, 1),
        'trend' => $trend,
        'trend_emoji' => $trend_emoji,
        'total_amount' => round(array_sum($amounts), 2),
        'total_quantity' => round(array_sum($quantities), 3),
        'has_normalized' => $has_normalized,
        'normalized_avg' => !empty($normalized_prices) ? round(array_sum($normalized_prices) / count($normalized_prices), 2) : null,
        'normalized_unit' => $normalized_unit
    ];
}

// ==================== НОРМАЛИЗАЦИЯ ЦЕН ДЛЯ MySQLi ====================
function normalizePriceMysqli($price, $quantity, $unit) {
    $result = [
        'original_price' => $price,
        'original_quantity' => $quantity,
        'original_unit' => $unit,
        'price_per_unit' => $price,
        'normalized_unit' => $unit,
        'normalized' => false
    ];
    
    switch ($unit) {
        case 'г':
            $result['price_per_unit'] = ($price * 1000) / $quantity;
            $result['normalized_unit'] = 'кг';
            $result['normalized'] = true;
            break;
        case 'мл':
            $result['price_per_unit'] = ($price * 1000) / $quantity;
            $result['normalized_unit'] = 'л';
            $result['normalized'] = true;
            break;
        case 'см':
            $result['price_per_unit'] = ($price * 100) / $quantity;
            $result['normalized_unit'] = 'м';
            $result['normalized'] = true;
            break;
    }
    
    return $result;
}
?>