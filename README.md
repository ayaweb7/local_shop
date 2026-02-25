## Мой проект - Local Shop.

## 📁 Структура проекта

shopping_tracker/				# Корень проекта (корневая директория)
│
├── api/
│   └── api.php					# Единый REST API (MySQLi) - Главный скрипт
│
├── blocks/
│   └── date_base.php			# Подключение к БД (MySQLi)
│
├── js/
│   ├── api.js					# API клиент для работы с PHP API
│   ├── app.js					# Главное приложение (таблица)
│	├── admin.js				# Админ приложение
│   ├── stats.js				# Табличная статистика
│   ├── filters.js				# Общие фильтры
│   │
│   ├── charts.js				# ОСНОВНАЯ СИСТЕМА ГРАФИКОВ (классы)
│   │   ├── ChartUtils
│   │   ├── ChartThemes
│   │   ├── BaseChart
│   │   ├── BarChart/PieChart/LineChart
│   │   ├── UnifiedDataProcessor
│   │   ├── ChartPair
│   │   └── ChartManager
│   │
│   ├── price-analyzer.js		# Анализ цен
│   ├── price-charts.js			# Графики для цен
│   ├── data-exporter.js		# Экспорт данных
│   ├── chart-settings.js		# Сохранение настроек
│   ├── chart-animations.js		# Анимации
│   ├── chart-performance.js	# Оптимизация
│   │
│   └── chart.min.js			# Локальная Chart.js библиотека
│
├── css/
│   └── styles.css		# Общие стили + стили графиков + адаптивность
│
├── index.html			# Страница входа
├── app.html			# Главное приложение - Основная таблица покупок
├── admin.html			# Админ-панель (управление справочниками)
├── stats.html			# Табличная статистика
├── charts.html			# Графики и визуализация
├── price-analysis.html	# Анализ цен (графики)
│
├── .gitignore			# Файл, для инструкций отслеживания файлов Git
├── requirements.txt	# Список зависимостей (библиотек) проекта
└── README.md			# Главное описание проекта (видно на GitHub)


## 📈 Улучшенная структура файлов для графиков

js/charts/
├── ChartManager.js      # Основной класс управления графиками
├── BaseChart.js         # Базовый класс для всех графиков
├── chartTypes/          # Конкретные типы графиков
│   ├── BarChart.js
│   ├── PieChart.js
│   ├── LineChart.js
│   └── ...
├── plugins/             # Кастомизированные плагины
│   ├── DataLabels.js
│   └── TooltipCustom.js
├── themes/              # Цветовые темы
│   ├── DefaultTheme.js
│   └── ContrastTheme.js
└── utils/               # Утилиты
    ├── Formatters.js
    └── DataProcessors.js

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
