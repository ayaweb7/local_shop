## Мой проект - Local Shop.

## 📁 Структура проекта

shopping_tracker/		# Корень проекта (корневая директория)
│
├── api/
│   └── api.php			# REST API - Главный скрипт (расширенный)
│
├── blocks/
│   └── date_base.php	# Подключение к БД (как у вас уже есть)
│
├── js/
│   ├── app.js			# Основное приложение (упрощённое)
	├── admin.js		# Админ приложение
│   ├── charts.js		# Класс ChartManager + UnifiedChart
│   ├── stats.js		# Табличная статистика
│   ├── filters.js		# Общие фильтры
│   ├── api.js			# API клиент для работы с PHP API
│   └── chart.min.js	# Локальная Chart.js
│
│
├── css/
│   └── styles.css		# Общие стили + стили графиков
│
├── app.html			# Главное приложение - Основная таблица покупок
├── stats.html			# Табличная статистика
├── charts.html			# Графики и визуализация
├── admin.html			# Админ-панель
├── index.html			# Вход
│
├── .gitignore			# Файл, для инструкций отслеживания файлов Git
├── requirements.txt	# Список зависимостей (библиотек) проекта
└── README.md			# Главное описание проекта (видно на GitHub)


## 🚀 Быстрый старт

1. Клонируйте репозиторий:
```bash
git clone https://github.com/ВАШ_НИКНЕЙМ/local_shop.git
cd glasspen_bot
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/Scripts/activate  # Windows (Git Bash)
# или: source venv/bin/activate  # macOS/Linux
```
