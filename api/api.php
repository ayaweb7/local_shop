<?php
// api/api.php
require_once '../blocks/date_base.php';

// Разрешаем CORS для локальной разработки
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Обрабатываем OPTIONS запросы (для CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Получаем метод и путь запроса
$method = $_SERVER['REQUEST_METHOD'];
$request = $_GET['request'] ?? '';
$endpoint = explode('/', $request);

// Основной маршрутизатор
// В существующий маршрутизатор в api.php ДОБАВЬТЕ:
switch ($endpoint[0]) {
    case 'purchases':
        handlePurchases($method, $endpoint, $db);
        break;
    case 'stores':
        handleStores($method, $endpoint, $db);  // ← ДОРАБОТАЕМ
        break;
    case 'cities':
        handleCities($method, $endpoint, $db);  // ← ДОРАБОТАЕМ
        break;
	case 'categories':
        handleCategories($method, $endpoint, $db);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found'], JSON_UNESCAPED_UNICODE);
        break;
}

// ==================== ОБРАБОТЧИКИ КОНКРЕТНЫХ ЭНДПОИНТОВ ====================

// ОБРАБОТКА ПОКУПОК
function handlePurchases($method, $endpoint, $db) {
    switch ($method) {
        case 'GET':
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
                // Форматируем данные для фронтенда
                $purchases[] = [
                    'id' => (int)$row['id'],
                    'date' => $row['date'],
                    'name' => $row['name'],
					'category_id' => (int)$row['category_id'],
					'category_name' => $row['category_name'],
					'category_icon' => $row['category_icon'],
					'category_color' => $row['category_color'],
                    'price' => (float)$row['price'],
                    'quantity' => (float)$row['quantity'],
                    'item' => $row['item'],
                    'amount' => (float)$row['amount'],
                    'characteristic' => $row['characteristic'],
                    'store_id' => (int)$row['store_id'],
                    'store' => [
                        'shop' => $row['store_name'],
                        'street' => $row['street'],
                        'house' => $row['house'],
                        'locality' => ['town_ru' => $row['city_name']]
                    ],
                    'full_address' => formatAddress($row)
                ];
            }
            
            echo json_encode(['data' => $purchases], JSON_UNESCAPED_UNICODE);
            break;

        
        case 'POST':
			// Получаем и валидируем JSON
			$inputJson = file_get_contents('php://input');
			$input = json_decode($inputJson, true);
			
			if (json_last_error() !== JSON_ERROR_NONE) {
				http_response_code(400);
				echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()], JSON_UNESCAPED_UNICODE);
				return;
			}
			
			// Проверяем обязательные поля
			$required = ['date', 'store_id', 'name', 'category_id', 'price', 'quantity', 'item', 'amount'];
			foreach ($required as $field) {
				if (!isset($input[$field]) || $input[$field] === '') {
					http_response_code(400);
					echo json_encode(['error' => "Missing required field: $field"], JSON_UNESCAPED_UNICODE);
					return;
				}
			}
			
			// ПРЕДВАРИТЕЛЬНО ПРИСВАИВАЕМ ЗНАЧЕНИЯ ПЕРЕМЕННЫМ
			$date = $input['date'];
			$store_id = (int)$input['store_id'];
			$name = $input['name'];
			$category_id = isset($input['category_id']) ? (int)$input['category_id'] : null; // ← НОВОЕ
			$characteristic = $input['characteristic'] ?? '';
			$quantity = (float)$input['quantity'];
			$item = $input['item'];
			$price = (float)$input['price'];
			$amount = (float)$input['amount'];
			
			// Подготавливаем запрос
			$stmt = $db->prepare("
				INSERT INTO shops (date, store_id, name, category_id, characteristic, quantity, item, price, amount)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			");
			
			if (!$stmt) {
				http_response_code(500);
				echo json_encode(['error' => 'Prepare failed: ' . $db->error], JSON_UNESCAPED_UNICODE);
				return;
			}
			
			// Привязываем параметры (теперь через переменные)
			$stmt->bind_param(
				'sisssdsdd',
				$date,
				$store_id,
				$name,
				$category_id,
				$characteristic,
				$quantity,
				$item,
				$price,
				$amount
			);
			
			if ($stmt->execute()) {
				echo json_encode([
					'success' => true,
					'id' => $stmt->insert_id,
					'message' => 'Purchase added successfully'
				], JSON_UNESCAPED_UNICODE);
			} else {
				http_response_code(500);
				echo json_encode(['error' => 'Execute failed: ' . $stmt->error], JSON_UNESCAPED_UNICODE);
			}
			break;
            
        case 'DELETE':
            // Удаление покупки
            $id = $endpoint[1] ?? 0;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Purchase ID required']);
                return;
            }
            
            $stmt = $db->prepare("DELETE FROM shops WHERE id = ?");
            $stmt->bind_param('i', $id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Purchase deleted']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $stmt->error]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
			
		// В функции handlePurchases ДОБАВЬТЕ case 'PUT':
		case 'PUT':
			// Проверяем ID
			if (!isset($endpoint[1]) || !is_numeric($endpoint[1])) {
				http_response_code(400);
				echo json_encode(['error' => 'Invalid purchase ID'], JSON_UNESCAPED_UNICODE);
				return;
			}
			
			$id = (int)$endpoint[1];
			$input = json_decode(file_get_contents('php://input'), true);
			
			if (json_last_error() !== JSON_ERROR_NONE) {
				http_response_code(400);
				echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()], JSON_UNESCAPED_UNICODE);
				return;
			}
			
			// ПРЕДВАРИТЕЛЬНО ПРИСВАИВАЕМ ЗНАЧЕНИЯ ПЕРЕМЕННЫМ
			$date = $input['date'];
			$store_id = (int)$input['store_id'];
			$name = $input['name'];
			$category_id = isset($input['category_id']) ? (int)$input['category_id'] : null; // ← НОВОЕ
			$characteristic = $input['characteristic'] ?? '';
			$quantity = (float)$input['quantity'];
			$item = $input['item'];
			$price = (float)$input['price'];
			$amount = (float)$input['amount'];
			
			try {
				$stmt = $db->prepare("
					UPDATE shops 
					SET date = ?, store_id = ?, name = ?, category_id = ?, 
						characteristic = ?, quantity = ?, item = ?, price = ?, amount = ?
					WHERE id = ?
				");
				
				if (!$stmt) {
					throw new Exception('Prepare failed: ' . $db->error);
				}
				
				// Привязываем параметры через переменные
				$stmt->bind_param(
					'sisssdsddi',
					$date,
					$store_id,
					$name,
					$category_id,
					$characteristic,
					$quantity,
					$item,
					$price,
					$amount,
					$id
				);
				
				if ($stmt->execute()) {
					echo json_encode([
						'success' => true,
						'message' => 'Purchase updated successfully'
					], JSON_UNESCAPED_UNICODE);
				} else {
					throw new Exception('Execute failed: ' . $stmt->error);
				}
				
			} catch (Exception $e) {
				http_response_code(500);
				echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
			}
			break;
    }
}

// ОБРАБОТКА МАГАЗИНОВ (ПОЛНЫЙ CRUD)
function handleStores($method, $endpoint, $db) {
    switch ($method) {
        case 'GET':
            // Получение всех магазинов с городами
            $sql = "SELECT s.*, l.town_ru as city_name 
                    FROM stores s 
                    LEFT JOIN locality l ON s.locality_id = l.id 
                    ORDER BY s.shop";
            
            $result = $db->query($sql);
            if (!$result) {
                http_response_code(500);
                echo json_encode(['error' => $db->error], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $stores = [];
            while ($row = $result->fetch_assoc()) {
                $stores[] = [
                    'id' => (int)$row['id'],
                    'shop' => $row['shop'],
                    'street' => $row['street'],
                    'house' => $row['house'],
                    'phone' => $row['phone'],
                    'locality_id' => (int)$row['locality_id'],
                    'city_name' => $row['city_name']
                ];
            }
            
            echo json_encode(['data' => $stores], JSON_UNESCAPED_UNICODE);
            break;
            
        case 'POST':
            // Добавление нового магазина
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Проверка обязательных полей
            $required = ['shop', 'street', 'house', 'locality_id'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing field: $field"], JSON_UNESCAPED_UNICODE);
                    return;
                }
            }
            
            // Присваиваем переменные
            $shop = $input['shop'];
            $street = $input['street'];
            $house = $input['house'];
            $phone = $input['phone'] ?? '';
            $locality_id = (int)$input['locality_id'];
            
            $stmt = $db->prepare("
                INSERT INTO stores (shop, street, house, phone, locality_id) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Prepare failed'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $stmt->bind_param('ssssi', $shop, $street, $house, $phone, $locality_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'id' => $stmt->insert_id,
                    'message' => 'Store added successfully'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        case 'PUT':
            // Обновление магазина
            if (!isset($endpoint[1]) || !is_numeric($endpoint[1])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid store ID'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $id = (int)$endpoint[1];
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Присваиваем переменные
            $shop = $input['shop'];
            $street = $input['street'];
            $house = $input['house'];
            $phone = $input['phone'] ?? '';
            $locality_id = (int)$input['locality_id'];
            
            $stmt = $db->prepare("
                UPDATE stores 
                SET shop = ?, street = ?, house = ?, phone = ?, locality_id = ?
                WHERE id = ?
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Prepare failed'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $stmt->bind_param('ssssii', $shop, $street, $house, $phone, $locality_id, $id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Store updated successfully'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        case 'DELETE':
            // Удаление магазина
            if (!isset($endpoint[1]) || !is_numeric($endpoint[1])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid store ID'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $id = (int)$endpoint[1];
            
            // Проверяем, нет ли покупок в этом магазине
            $checkStmt = $db->prepare("SELECT COUNT(*) as count FROM shops WHERE store_id = ?");
            $checkStmt->bind_param('i', $id);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            $row = $result->fetch_assoc();
            
            if ($row['count'] > 0) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Cannot delete store with existing purchases. Delete purchases first.'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $stmt = $db->prepare("DELETE FROM stores WHERE id = ?");
            $stmt->bind_param('i', $id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Store deleted successfully'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
            break;
    }
}

// ОБРАБОТКА ГОРОДОВ (ПОЛНЫЙ CRUD)
function handleCities($method, $endpoint, $db) {
    switch ($method) {
        case 'GET':
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
                $cities[] = [
                    'id' => (int)$row['id'],
                    'town_ru' => $row['town_ru'],
                    'town_en' => $row['town_en'] ?? '',
                    'code' => $row['code']
                ];
            }
            
            echo json_encode(['data' => $cities], JSON_UNESCAPED_UNICODE);
            break;
            
        case 'POST':
            // Добавление нового города
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Проверка обязательных полей
            if (empty($input['town_ru']) || empty($input['code'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Присваиваем переменные
            $town_ru = $input['town_ru'];
            $town_en = $input['town_en'] ?? '';
            $code = $input['code'];
            
            $stmt = $db->prepare("
                INSERT INTO locality (town_ru, town_en, code) 
                VALUES (?, ?, ?)
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Prepare failed'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $stmt->bind_param('sss', $town_ru, $town_en, $code);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'id' => $stmt->insert_id,
                    'message' => 'City added successfully'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        case 'PUT':
            // Обновление города
            if (!isset($endpoint[1]) || !is_numeric($endpoint[1])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid city ID'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $id = (int)$endpoint[1];
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Присваиваем переменные
            $town_ru = $input['town_ru'];
            $town_en = $input['town_en'] ?? '';
            $code = $input['code'];
            
            $stmt = $db->prepare("
                UPDATE locality 
                SET town_ru = ?, town_en = ?, code = ?
                WHERE id = ?
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Prepare failed'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $stmt->bind_param('sssi', $town_ru, $town_en, $code, $id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'City updated successfully'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        case 'DELETE':
            // Удаление города
            if (!isset($endpoint[1]) || !is_numeric($endpoint[1])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid city ID'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $id = (int)$endpoint[1];
            
            // Проверяем, нет ли магазинов в этом городе
            $checkStmt = $db->prepare("SELECT COUNT(*) as count FROM stores WHERE locality_id = ?");
            $checkStmt->bind_param('i', $id);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            $row = $result->fetch_assoc();
            
            if ($row['count'] > 0) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Cannot delete city with existing stores. Delete stores first.'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $stmt = $db->prepare("DELETE FROM locality WHERE id = ?");
            $stmt->bind_param('i', $id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'City deleted successfully'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
            break;
    }
}

// ОБРАБОТКА КАТЕГОРИЙ (ПОЛНЫЙ CRUD)
function handleCategories($method, $endpoint, $db) {
    switch ($method) {
        case 'GET':
            // Получение всех категорий
            $sql = "SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order, name";
            $result = $db->query($sql);
            
            if (!$result) {
                http_response_code(500);
                echo json_encode(['error' => $db->error], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $categories = [];
            while ($row = $result->fetch_assoc()) {
                $categories[] = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'icon' => $row['icon'],
                    'color' => $row['color'],
                    'sort_order' => (int)$row['sort_order']
                ];
            }
            
            echo json_encode(['data' => $categories], JSON_UNESCAPED_UNICODE);
            break;
            
        case 'POST':
            // Добавление новой категории
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            if (empty($input['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Category name is required'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Присваиваем переменные
            $name = $input['name'];
            $description = $input['description'] ?? '';
            $icon = $input['icon'] ?? '📦';
            $color = $input['color'] ?? '#007bff';
            $sort_order = isset($input['sort_order']) ? (int)$input['sort_order'] : 100;
            
            $stmt = $db->prepare("
                INSERT INTO categories (name, description, icon, color, sort_order) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Prepare failed: ' . $db->error], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $stmt->bind_param('ssssi', $name, $description, $icon, $color, $sort_order);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'id' => $stmt->insert_id,
                    'message' => 'Category added successfully'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        case 'PUT':
            // Обновление категории
            if (!isset($endpoint[1]) || !is_numeric($endpoint[1])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid category ID'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $id = (int)$endpoint[1];
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Присваиваем переменные
            $name = $input['name'];
            $description = $input['description'] ?? '';
            $icon = $input['icon'] ?? '📦';
            $color = $input['color'] ?? '#007bff';
            $sort_order = isset($input['sort_order']) ? (int)$input['sort_order'] : 100;
            $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 1;
            
            $stmt = $db->prepare("
                UPDATE categories 
                SET name = ?, description = ?, icon = ?, color = ?, 
                    sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Prepare failed: ' . $db->error], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $stmt->bind_param('ssssiii', $name, $description, $icon, $color, $sort_order, $is_active, $id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Category updated successfully'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        case 'DELETE':
            // Удаление категории (мягкое удаление - деактивация)
            if (!isset($endpoint[1]) || !is_numeric($endpoint[1])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid category ID'], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            $id = (int)$endpoint[1];
            
            // Проверяем, нет ли покупок в этой категории
            $checkStmt = $db->prepare("SELECT COUNT(*) as count FROM shops WHERE category_id = ?");
            $checkStmt->bind_param('i', $id);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            $row = $result->fetch_assoc();
            
            if ($row['count'] > 0) {
                // Не удаляем, а деактивируем
                $stmt = $db->prepare("UPDATE categories SET is_active = FALSE WHERE id = ?");
                $stmt->bind_param('i', $id);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Category deactivated (has existing purchases)'
                    ], JSON_UNESCAPED_UNICODE);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
                }
            } else {
                // Удаляем полностью, если нет покупок
                $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
                $stmt->bind_param('i', $id);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Category deleted successfully'
                    ], JSON_UNESCAPED_UNICODE);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => $stmt->error], JSON_UNESCAPED_UNICODE);
                }
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
            break;
    }
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
?>