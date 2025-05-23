# Decentra RTMP Server

A simple RTMP streaming server built with Node.js and FFmpeg for Decentra.

## Features

- RTMP streaming server on port 1935
- HTTP API for managing test streams on port 8001
- FFmpeg integration for generating test patterns

## English Documentation

### Requirements

- Node.js
- FFmpeg

### Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```
   or
   ```
   ./start.sh
   ```

### API Endpoints

The HTTP API is available at `http://localhost:8001`:

- `GET /streams` - List all active test streams
- `POST /streams` - Create a new test stream
  - Request body: `{ "name": "stream_name", "path": "live/mystream" }`
  - Both fields are optional - defaults will be generated
- `DELETE /streams/:id` - Stop a specific test stream

### RTMP URLs

- Publish to: `rtmp://localhost:1935/live/streamname`
- Play from: `rtmp://localhost:1935/live/streamname`

### Testing

You can create a test stream by running:

```
npm run test-stream
```

This will create a test pattern stream at `rtmp://localhost:1935/live/test`.

You can play this stream using tools like FFplay:

```
ffplay rtmp://localhost:1935/live/test
```

### Example Usage with cURL

Create a new test stream:

```
curl -X POST "http://localhost:8001/streams" -H "Content-Type: application/json" -d '{"name": "mystream"}'
```

List all streams:

```
curl -X GET "http://localhost:8001/streams"
```

Stop a stream:

```
curl -X DELETE "http://localhost:8001/streams/stream_id"
```

## Русская документация

### Требования

- Node.js
- FFmpeg

### Начало работы

1. Установите зависимости:
   ```
   npm install
   ```

2. Запустите сервер:
   ```
   npm start
   ```
   или
   ```
   ./start.sh
   ```

### API эндпоинты

HTTP API доступен по адресу `http://localhost:8001`:

- `GET /streams` - список всех активных тестовых стримов
- `POST /streams` - создать новый тестовый стрим
  - тело запроса: `{ "name": "название_стрима", "path": "live/мойстрим" }`
  - оба поля необязательны - значения по умолчанию будут сгенерированы
- `DELETE /streams/:id` - остановить конкретный тестовый стрим

### RTMP url адреса

- публикация на: `rtmp://localhost:1935/live/streamname`
- воспроизведение с: `rtmp://localhost:1935/live/streamname`

### тестирование

вы можете создать тестовый стрим, выполнив:

```
npm run test-stream
```

это создаст тестовый стрим по адресу `rtmp://localhost:1935/live/test`.

вы можете воспроизвести этот стрим с помощью таких инструментов, как ffplay:

```
ffplay rtmp://localhost:1935/live/test
```

### примеры использования с curl

создать новый тестовый стрим:

```
curl -X POST "http://localhost:8001/streams" -H "Content-Type: application/json" -d '{"name": "мойстрим"}'
```

список всех стримов:

```
curl -X GET "http://localhost:8001/streams"
```

остановить стрим:

```
curl -X DELETE "http://localhost:8001/streams/id_стрима"
``` 