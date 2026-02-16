/**
 * Data Exporter
 * Экспорт данных в различные форматы
 */

class DataExporter {
    constructor() {
        this.supportedFormats = ['csv', 'json', 'sql', 'xls'];
        console.log('DataExporter инициализирован');
    }
    
    /**
     * Основной метод экспорта
     */
    export(data, options = {}) {
        const format = options.format || 'csv';
        const filename = options.filename || this.generateFilename(options.prefix);
        
        switch(format) {
            case 'csv':
                return this.exportToCSV(data, options);
            case 'json':
                return this.exportToJSON(data, options);
            case 'sql':
                return this.exportToSQL(data, options);
            case 'xls':
                return this.exportToXLS(data, options);
            default:
                throw new Error(`Неподдерживаемый формат: ${format}`);
        }
    }
    
    /**
     * Экспорт в CSV
     */
    exportToCSV(data, options = {}) {
        const separator = options.separator || ';';
        const includeHeaders = options.headers !== false;
        const decimalSeparator = options.decimalSeparator || '.';
        
        if (!data || data.length === 0) {
            this.showNotification('Нет данных для экспорта', 'warning');
            return null;
        }
        
        // Получаем заголовки
        const headers = includeHeaders ? Object.keys(data[0]) : [];
        
        // Формируем строки CSV
        let csv = '';
        
        // Заголовки
        if (includeHeaders) {
            csv += headers.map(h => this.escapeCSV(h)).join(separator) + '\n';
        }
        
        // Данные
        data.forEach(row => {
            const rowData = headers.map(header => {
                let value = row[header];
                
                // Форматирование значений
                if (value === null || value === undefined) {
                    return '';
                }
                
                if (typeof value === 'number') {
                    // Замена десятичного разделителя
                    if (decimalSeparator !== '.') {
                        value = value.toString().replace('.', decimalSeparator);
                    }
                    return value;
                }
                
                if (value instanceof Date) {
                    return value.toISOString().split('T')[0];
                }
                
                return this.escapeCSV(value.toString());
            });
            
            csv += rowData.join(separator) + '\n';
        });
        
        // Добавляем BOM для UTF-8 (для Excel)
        if (options.addBOM !== false) {
            csv = '\uFEFF' + csv;
        }
        
        // Скачиваем файл
        this.downloadFile(csv, `${options.filename || 'export'}.csv`, 'text/csv;charset=utf-8;');
        
        this.showNotification(`Экспортировано ${data.length} записей в CSV`, 'success');
        
        return csv;
    }
    
    /**
     * Экспорт в JSON
     */
    exportToJSON(data, options = {}) {
        if (!data || data.length === 0) {
            this.showNotification('Нет данных для экспорта', 'warning');
            return null;
        }
        
        const pretty = options.pretty !== false;
        const json = pretty 
            ? JSON.stringify(data, null, 2)
            : JSON.stringify(data);
        
        this.downloadFile(json, `${options.filename || 'export'}.json`, 'application/json');
        
        this.showNotification(`Экспортировано ${data.length} записей в JSON`, 'success');
        
        return json;
    }
    
    /**
     * Экспорт в SQL (INSERT запросы)
     */
    exportToSQL(data, options = {}) {
        if (!data || data.length === 0) {
            this.showNotification('Нет данных для экспорта', 'warning');
            return null;
        }
        
        const tableName = options.tableName || 'shops';
        const batchSize = options.batchSize || 100;
        
        let sql = `-- Экспорт данных: ${new Date().toLocaleString()}\n`;
        sql += `-- Таблица: ${tableName}\n`;
        sql += `-- Записей: ${data.length}\n\n`;
        
        // Начало транзакции
        sql += 'START TRANSACTION;\n\n';
        
        // Очистка таблицы (опционально)
        if (options.truncateFirst) {
            sql += `TRUNCATE TABLE ${tableName};\n\n`;
        }
        
        // Получаем список полей из первой записи
        const fields = Object.keys(data[0]);
        
        // Генерируем INSERT запросы батчами
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            
            sql += `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES\n`;
            
            const values = batch.map(row => {
                return '(' + fields.map(field => {
                    const value = row[field];
                    
                    if (value === null || value === undefined) {
                        return 'NULL';
                    }
                    
                    if (typeof value === 'number') {
                        return value;
                    }
                    
                    if (value instanceof Date) {
                        return `'${value.toISOString().split('T')[0]}'`;
                    }
                    
                    // Экранирование для SQL
                    return `'${value.toString().replace(/'/g, "''")}'`;
                }).join(', ') + ')';
            });
            
            sql += values.join(',\n');
            
            if (i + batchSize < data.length) {
                sql += ';\n\n';
            } else {
                sql += ';\n\n';
            }
        }
        
        // Завершение транзакции
        sql += 'COMMIT;\n';
        
        this.downloadFile(sql, `${options.filename || 'export'}.sql`, 'application/sql');
        
        this.showNotification(`Экспортировано ${data.length} записей в SQL`, 'success');
        
        return sql;
    }
    
    /**
     * Экспорт в XLS (через CSV)
     */
    exportToXLS(data, options = {}) {
        // XLS по сути тот же CSV, но с другим расширением
        options.filename = options.filename || 'export';
        options.separator = options.separator || '\t'; // Табуляция для Excel
        
        const csv = this.exportToCSV(data, options);
        if (csv) {
            this.downloadFile(csv, `${options.filename}.xls`, 'application/vnd.ms-excel');
            this.showNotification(`Экспортировано ${data.length} записей в XLS`, 'success');
        }
        
        return csv;
    }
    
    /**
     * Экранирование для CSV
     */
    escapeCSV(value) {
        if (value.includes('"') || value.includes(',') || value.includes(';') || value.includes('\n')) {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
    }
    
    /**
     * Скачивание файла
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
    }
    
    /**
     * Генерация имени файла
     */
    generateFilename(prefix = 'export') {
        const date = new Date();
        const timestamp = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
        return `${prefix}_${timestamp}`;
    }
    
    /**
     * Показ уведомления
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `export-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
                ${message}
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Создаем глобальный экземпляр
window.dataExporter = new DataExporter();