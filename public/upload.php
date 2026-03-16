<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Файлы не были загружены']);
        exit;
    }

    $uploadDir = __DIR__ . '/uploads/';
    
    // Создаем папку uploads если её нет
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $uploadedFiles = [];
    $files = $_FILES['file'];

    // Обрабатываем один или несколько файлов
    if (is_array($files['name'])) {
        // Несколько файлов
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $fileName = $files['name'][$i];
                $fileTmpName = $files['tmp_name'][$i];
                $fileSize = $files['size'][$i];
                
                // Проверяем размер файла (10MB)
                if ($fileSize > 10 * 1024 * 1024) {
                    continue;
                }
                
                // Генерируем уникальное имя файла
                $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
                $uniqueName = 'file-' . time() . '-' . rand(1000, 9999) . '.' . $fileExtension;
                $filePath = $uploadDir . $uniqueName;
                
                if (move_uploaded_file($fileTmpName, $filePath)) {
                    $uploadedFiles[] = '/uploads/' . $uniqueName;
                }
            }
        }
    } else {
        // Один файл
        if ($files['error'] === UPLOAD_ERR_OK) {
            $fileName = $files['name'];
            $fileTmpName = $files['tmp_name'];
            $fileSize = $files['size'];
            
            // Проверяем размер файла (10MB)
            if ($fileSize <= 10 * 1024 * 1024) {
                // Генерируем уникальное имя файла
                $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
                $uniqueName = 'file-' . time() . '-' . rand(1000, 9999) . '.' . $fileExtension;
                $filePath = $uploadDir . $uniqueName;
                
                if (move_uploaded_file($fileTmpName, $filePath)) {
                    $uploadedFiles[] = '/uploads/' . $uniqueName;
                }
            }
        }
    }

    if (empty($uploadedFiles)) {
        http_response_code(400);
        echo json_encode(['error' => 'Не удалось загрузить файлы']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'files' => $uploadedFiles,
        'message' => 'Загружено ' . count($uploadedFiles) . ' файлов'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при загрузке файлов: ' . $e->getMessage()]);
}
?> 