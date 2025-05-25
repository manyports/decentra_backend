# RTMP to RTSP Conversion System

[English](#english) | [Русский](#russian)

<a name="english"></a>
## English

## 🚀 Quick Start Guide (5 Minutes)

Want to get up and running as quickly as possible? Make sure you have FFMPEG, then follow these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/manyports/decentra_backend
   cd decentra_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start server** 
   ```bash
   npm start
   ```
   You should see: `INF MediaMTX v1.5.0` and `INF [RTMP] listener opened on :1936`,  `Starting test RTMP stream with name: `

That's it! You now have your backend server running on your localhost

## 📖 Complete Setup Guide

### What is this?

This tool allows you to convert video streams from RTMP format (used by many streaming platforms) to RTSP format (used by many security and surveillance systems). This is particularly useful for:

- Connecting RTMP-based cameras to RTSP-only systems
- Streaming from drones or other devices that output RTMP
- Creating compatibility between different video systems

### Prerequisites

Before starting, make sure you have:

- **Node.js** (version 12.0 or higher)
  ```bash
  # Check your version
  node --version
  
  # Install on macOS with Homebrew
  brew install node
  
  # Install on Ubuntu
  sudo apt update
  sudo apt install nodejs npm
  ```

- **FFmpeg** (required for video processing)
  ```bash
  # Check if installed
  ffmpeg -version
  
  # Install on macOS
  brew install ffmpeg
  
  # Install on Ubuntu
  sudo apt update
  sudo apt install ffmpeg
  ```

### Step 1: Get the Code

Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/manyports/decentra_backend
cd decentra_backend
```

### Step 2: Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

This will install all the dependencies listed in `package.json`.

### Step 3: Make Scripts Executable

Make sure all the scripts have execution permissions:

```bash
# Make all shell scripts executable
chmod +x *.sh
chmod +x mediamtx/*.sh
```

### Step 4: Understand the Components

This system consists of several components:

1. **MediaMTX Server**: The core component that handles both RTMP input and RTSP output
2. **RTMP Source**: Either your own RTMP stream or the test pattern generator
3. **RTSP Client**: Any software that can consume RTSP streams (like VLC or FFplay)

Key files in the project:
- `mediamtx/mediamtx`: The MediaMTX server binary
- `mediamtx/mediamtx.yml`: Configuration for the MediaMTX server
- `mediamtx/test_conversion.sh`: Script to generate a test RTMP stream
- `rtmp_to_rtsp.js`: Node.js script for advanced RTMP to RTSP conversion
- `simple_rtmp_to_rtsp.sh`: Simple shell script for basic conversion

### Step 5: Start the MediaMTX Server

The MediaMTX server is the heart of this system. It receives RTMP streams and makes them available as RTSP streams.

```bash
cd mediamtx
./mediamtx mediamtx.yml
```

You should see output like this:
```
INF MediaMTX v1.5.0
INF configuration loaded from /path/to/mediamtx.yml
INF [RTSP] listener opened on :8554 (TCP), :8000 (UDP/RTP), :8001 (UDP/RTCP)
INF [RTMP] listener opened on :1936
INF [HLS] listener opened on :8888
INF [WebRTC] listener opened on :8889 (HTTP), :8189 (ICE/UDP)
INF [SRT] listener opened on :8890 (UDP)
INF [API] listener opened on 127.0.0.1:9997
```

**Important**: Keep this terminal window open. The MediaMTX server will run in the foreground.

### Step 6: Test with a Sample Stream

Let's create a test RTMP stream to confirm everything is working.

Open a new terminal window and run:

```bash
cd decentra_backend/mediamtx
./test_conversion.sh
```

This script uses FFmpeg to generate a test pattern video and publish it as an RTMP stream to the MediaMTX server.

You should see output similar to:
```
Starting test RTMP stream with name: test
Using ffmpeg to generate a test pattern and send it to the server...
RTMP URL: rtmp://localhost:1936/test
RTSP URL: rtsp://localhost:8554/test
To view the RTSP stream, run in another terminal:
ffplay -rtsp_transport tcp rtsp://localhost:8554/test
To stop the test stream, press Ctrl+C
```

**Important**: Keep this terminal window open as well. The test stream will continue to run until you stop it.

### Step 7: Access the RTSP Stream

Now that the MediaMTX server is running and a test RTMP stream is being published, you can access the converted RTSP stream.

Open a third terminal window and run:

```bash
ffplay -rtsp_transport tcp rtsp://localhost:8554/test
```

If everything is working correctly, a window should open showing the test pattern video.

Congratulations! You now have a working RTMP to RTSP conversion setup.

## 🔧 Using Your Own RTMP Source

Instead of the test pattern, you can use your own RTMP source:

### Option 1: Direct Connection to MediaMTX

Configure your RTMP source (camera, streaming software, etc.) to publish to:
```
rtmp://localhost:1936/your-stream-name
```

Replace `localhost` with your server's IP address if not running locally, and choose any name for `your-stream-name`.

Then access the RTSP stream at:
```
rtsp://localhost:8554/your-stream-name
```

### Option 2: Using OBS Studio

If you're using OBS Studio:

1. Go to Settings > Stream
2. Select "Custom..." as the service
3. Set the URL to `rtmp://localhost:1936/your-stream-name`
4. Click "Start Streaming"

### Option 3: Using FFmpeg

You can use FFmpeg to push a video file as an RTMP stream:

```bash
ffmpeg -re -i your-video-file.mp4 -c copy -f flv rtmp://localhost:1936/your-stream-name
```

## 🛠️ Common Issues and Solutions

### Problem: "Connection refused" Error

**Symptoms:**
- Error message: "Connection refused" when trying to connect to RTMP or RTSP

**Solutions:**
1. Make sure the MediaMTX server is running
   ```bash
   # Check if MediaMTX is running
   ps aux | grep mediamtx
   ```

2. Verify the ports are available
   ```bash
   # Check if something else is using the RTMP port
   lsof -i :1936
   
   # Check if something else is using the RTSP port
   lsof -i :8554
   ```

3. Try restarting the MediaMTX server
   ```bash
   # Kill any existing MediaMTX processes
   pkill -f mediamtx
   
   # Start it again
   cd mediamtx
   ./mediamtx mediamtx.yml
   ```

### Problem: No Video or Black Screen

**Symptoms:**
- RTSP connection successful but no video appears

**Solutions:**
1. Verify an RTMP stream is actually being published
   - Check the MediaMTX server logs for messages like: 
     `INF [RTMP] [conn X.X.X.X:XXXXX] is publishing to path 'test'`

2. Try a different player
   ```bash
   # If ffplay doesn't work, try VLC
   vlc rtsp://localhost:8554/test
   ```

3. Increase buffer size in ffplay
   ```bash
   ffplay -rtsp_transport tcp -buffer_size 1024K rtsp://localhost:8554/test
   ```

### Problem: High Latency

**Symptoms:**
- Video plays but with significant delay

**Solutions:**
1. Use TCP for RTSP transport (already in our examples)
   
2. Add low-latency flags to ffplay
   ```bash
   ffplay -rtsp_transport tcp -fflags nobuffer -flags low_delay -framedrop rtsp://localhost:8554/test
   ```

3. Reduce video quality in your RTMP source if possible

## 📡 Advanced Usage

### Custom Stream Names

When using the test stream, you can specify a custom stream name:

```bash
cd mediamtx
./test_conversion.sh mycustomstream
```

Затем получите к нему доступ с помощью:
```bash
ffplay -rtsp_transport tcp rtsp://localhost:8554/mycustomstream
```

### Multiple Simultaneous Streams

You can run multiple streams at once - the system will handle them automatically:

```bash
# In terminal 1
cd mediamtx
./test_conversion.sh stream1

# In terminal 2
cd mediamtx
./test_conversion.sh stream2
```

Затем получите к ним доступ отдельно:
```bash
ffplay -rtsp_transport tcp rtsp://localhost:8554/stream1
ffplay -rtsp_transport tcp rtsp://localhost:8554/stream2
```

### Recording Streams

To record streams to disk, modify `mediamtx/mediamtx.yml`:

```yaml
paths:
  all:
    record: yes
    recordPath: ./recordings
```

### Remote Access

To make your streams accessible from other devices:

1. Find your IP address
   ```bash
   # On macOS/Linux
   ifconfig
   
   # On Windows
   ipconfig
   ```

2. Use your IP instead of localhost
   ```
   RTMP input: rtmp://192.168.1.x:1936/streamname
   RTSP output: rtsp://192.168.1.x:8554/streamname
   ```

3. Ensure ports 1936 and 8554 are open in your firewall

## 🔍 Understanding How It Works

### Architecture Overview

```
+----------------+      +------------------+      +----------------+
|                |      |                  |      |                |
|  RTMP Source   +----->+  MediaMTX Server +----->+  RTSP Client   |
| (OBS, Camera)  |      | (Protocol Bridge)|      | (VLC, FFplay)  |
|                |      |                  |      |                |
+----------------+      +------------------+      +----------------+
     port 1936                                         port 8554
```

1. **RTMP Source** publishes a video stream to the MediaMTX server on port 1936
2. **MediaMTX Server** receives the RTMP stream and makes it available as RTSP without transcoding
3. **RTSP Client** connects to the MediaMTX server on port 8554 to view the stream

### Key Files Explained

- `mediamtx/mediamtx`: The main server binary
- `mediamtx/mediamtx.yml`: Configuration file for the server
- `mediamtx/test_conversion.sh`: Script to generate a test pattern stream
- `rtmp_to_rtsp.js`: Node.js implementation of RTMP to RTSP conversion
- `simple_rtmp_to_rtsp.sh`: Simplified shell script for conversion
- `start.sh`: Convenience script to start the main service

### Configuration Options

The main config file is `mediamtx/mediamtx.yml`. Some important settings:

```yaml
# Network settings
rtmpAddress: :1936  # RTMP listening address
rtspAddress: :8554  # RTSP listening address

# Path settings
paths:
  all:
    # Authentication (disabled by default)
    readUser: ""
    readPass: ""
    publishUser: ""
    publishPass: ""
    
    # Performance settings
    publishReadyTime: 2s
```

## 🚢 Production Deployment Tips

### Running as a Background Service

For production use, you might want to run the MediaMTX server as a background service:

#### Using systemd (Linux)

Create a service file at `/etc/systemd/system/mediamtx.service`:

```ini
[Unit]
Description=MediaMTX RTMP to RTSP converter
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/decentra_backend/mediamtx
ExecStart=/path/to/decentra_backend/mediamtx/mediamtx /path/to/decentra_backend/mediamtx/mediamtx.yml
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then enable and start the service:
```bash
sudo systemctl enable mediamtx
sudo systemctl start mediamtx
```

#### Using PM2 (Cross-platform)

Install PM2:
```bash
npm install -g pm2
```

Start MediaMTX with PM2:
```bash
cd decentra_backend/mediamtx
pm2 start ./mediamtx -- mediamtx.yml
pm2 save
pm2 startup
```

### Security Considerations

For production use, consider:

1. Adding authentication in `mediamtx.yml`:
   ```yaml
   paths:
     all:
       readUser: "viewuser"
       readPass: "viewpassword"
       publishUser: "publishuser"
       publishPass: "publishpassword"
   ```

2. Using HTTPS/TLS:
   ```yaml
   # RTMPS (secure RTMP)
   rtmpsAddress: :1937
   rtmpsCert: path/to/cert.pem
   rtmpsKey: path/to/key.pem
   
   # RTSPS (secure RTSP)
   rtspsAddress: :8322
   rtspsCert: path/to/cert.pem
   rtspsKey: path/to/key.pem
   ```

3. Limiting access with a firewall

## 📝 Commands Reference

### MediaMTX Server

| Command | Description |
|---------|-------------|
| `./mediamtx/mediamtx mediamtx/mediamtx.yml` | Start the MediaMTX server with the configuration file |
| `pkill -f mediamtx` | Stop the MediaMTX server |

### Test Streams

| Command | Description |
|---------|-------------|
| `./mediamtx/test_conversion.sh` | Start a test stream named "test" |
| `./mediamtx/test_conversion.sh customname` | Start a test stream with a custom name |

### Viewing Streams

| Command | Description |
|---------|-------------|
| `ffplay -rtsp_transport tcp rtsp://localhost:8554/streamname` | View a stream using FFplay |
| `ffplay -rtsp_transport tcp -fflags nobuffer rtsp://localhost:8554/streamname` | View with lower latency |

## 🌐 External Resources

- [MediaMTX GitHub Repository](https://github.com/bluenviron/mediamtx)
- [RTMP Specification](https://www.adobe.com/devnet/rtmp.html)
- [RTSP Specification](https://tools.ietf.org/html/rfc7826)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

---

<a name="russian"></a>
## Русский

## 🚀 Краткое руководство по запуску (5 минут)

Хотите быстро начать работу? Удостоверьтесь, что у вас есть FFMPEG, а затем выполните следующие шаги:

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/manyports/decentra_backend
   cd decentra_backend
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Запустите сервер** 
   ```bash
   npm start
   ```
   Вы должны увидеть: `INF MediaMTX v1.5.0` и `INF [RTMP] listener opened on :1936`, `Starting test RTMP stream with name: `

Готово! Теперь у вас есть бэкенд-сервер, который готов работать с фронтом!

## 📖 Полное руководство по настройке

### Что это такое?

Этот инструмент позволяет конвертировать видеопотоки из формата RTMP (используемого многими стриминговыми платформами) в формат RTSP (используемый многими системами безопасности и видеонаблюдения). Это особенно полезно для:

- Подключения RTMP-камер к системам, поддерживающим только RTSP
- Потоковой передачи с дронов или других устройств, выводящих RTMP
- Создания совместимости между различными видеосистемами

### Предварительные требования

Перед началом убедитесь, что у вас установлены:

- **Node.js** (версия 12.0 или выше)
  ```bash
  # Проверьте вашу версию
  node --version
  
  # Установка на macOS с Homebrew
  brew install node
  
  # Установка на Ubuntu
  sudo apt update
  sudo apt install nodejs npm
  ```

- **FFmpeg** (необходим для обработки видео)
  ```bash
  # Проверьте, установлен ли
  ffmpeg -version
  
  # Установка на macOS
  brew install ffmpeg
  
  # Установка на Ubuntu
  sudo apt update
  sudo apt install ffmpeg
  ```

### Шаг 1: Получите код

Клонируйте репозиторий и перейдите в директорию проекта:

```bash
git clone https://github.com/manyports/decentra_backend
cd decentra_backend
```

### Шаг 2: Установите зависимости

Установите необходимые пакеты Node.js:

```bash
npm install
```

Это установит все зависимости, перечисленные в `package.json`.

### Шаг 3: Сделайте скрипты исполняемыми

Убедитесь, что все скрипты имеют права на выполнение:

```bash
# Сделайте все shell-скрипты исполняемыми
chmod +x *.sh
chmod +x mediamtx/*.sh
```

### Шаг 4: Поймите компоненты

Эта система состоит из нескольких компонентов:

1. **Сервер MediaMTX**: Основной компонент, который обрабатывает как RTMP ввод, так и RTSP вывод
2. **RTMP источник**: Либо ваш собственный RTMP поток, либо генератор тестового шаблона
3. **RTSP клиент**: Любое программное обеспечение, которое может потреблять RTSP потоки (например, VLC или FFplay)

Ключевые файлы в проекте:
- `mediamtx/mediamtx`: Бинарный файл сервера MediaMTX
- `mediamtx/mediamtx.yml`: Конфигурация для сервера MediaMTX
- `mediamtx/test_conversion.sh`: Скрипт для генерации тестового RTMP потока
- `rtmp_to_rtsp.js`: Node.js скрипт для расширенного преобразования RTMP в RTSP
- `simple_rtmp_to_rtsp.sh`: Простой shell-скрипт для базового преобразования

### Шаг 5: Запустите сервер MediaMTX

Сервер MediaMTX - сердце этой системы. Он получает RTMP потоки и делает их доступными как RTSP потоки.

```bash
cd mediamtx
./mediamtx mediamtx.yml
```

Вы должны увидеть вывод, подобный этому:
```
INF MediaMTX v1.5.0
INF configuration loaded from /path/to/mediamtx.yml
INF [RTSP] listener opened on :8554 (TCP), :8000 (UDP/RTP), :8001 (UDP/RTCP)
INF [RTMP] listener opened on :1936
INF [HLS] listener opened on :8888
INF [WebRTC] listener opened on :8889 (HTTP), :8189 (ICE/UDP)
INF [SRT] listener opened on :8890 (UDP)
INF [API] listener opened on 127.0.0.1:9997
```

**Важно**: Держите это окно терминала открытым. Сервер MediaMTX будет работать на переднем плане.

### Шаг 6: Тестирование с помощью примера потока

Давайте создадим тестовый RTMP поток, чтобы проверить, что все работает.

Откройте новое окно терминала и выполните:

```bash
cd decentra_backend/mediamtx
./test_conversion.sh
```

Этот скрипт использует FFmpeg для генерации видео с тестовым шаблоном и публикации его как RTMP потока на сервер MediaMTX.

Вы должны увидеть вывод, похожий на:
```
Starting test RTMP stream with name: test
Using ffmpeg to generate a test pattern and send it to the server...
RTMP URL: rtmp://localhost:1936/test
RTSP URL: rtsp://localhost:8554/test
To view the RTSP stream, run in another terminal:
ffplay -rtsp_transport tcp rtsp://localhost:8554/test
To stop the test stream, press Ctrl+C
```

**Важно**: Также держите это окно терминала открытым. Тестовый поток будет продолжать работать, пока вы его не остановите.

### Шаг 7: Доступ к RTSP потоку

Теперь, когда сервер MediaMTX работает и тестовый RTMP поток публикуется, вы можете получить доступ к преобразованному RTSP потоку.

Откройте третье окно терминала и выполните:

```bash
ffplay -rtsp_transport tcp rtsp://localhost:8554/test
```

Если все работает правильно, должно открыться окно, показывающее видео с тестовым шаблоном.

Поздравляем! У вас теперь есть работающая настройка преобразования RTMP в RTSP.

## 🔧 Использование собственного RTMP источника

Вместо тестового шаблона вы можете использовать свой собственный RTMP источник:

### Вариант 1: Прямое подключение к MediaMTX

Настройте ваш RTMP источник (камеру, стриминговое ПО и т.д.) для публикации на:
```
rtmp://localhost:1936/your-stream-name
```

Замените `localhost` на IP-адрес вашего сервера, если не запускаете локально, и выберите любое имя для `your-stream-name`.

Затем получите доступ к RTSP потоку по адресу:
```
rtsp://localhost:8554/your-stream-name
```

### Вариант 2: Использование OBS Studio

Если вы используете OBS Studio:

1. Перейдите в Настройки > Вещание
2. Выберите "Настраиваемый..." как сервис
3. Установите URL как `rtmp://localhost:1936/your-stream-name`
4. Нажмите "Начать вещание"

### Вариант 3: Использование FFmpeg

Вы можете использовать FFmpeg для отправки видеофайла как RTMP потока:

```bash
ffmpeg -re -i ваш-видеофайл.mp4 -c copy -f flv rtmp://localhost:1936/your-stream-name
```

## 🛠️ Общие проблемы и решения

### Проблема: Ошибка "Connection refused"

**Симптомы:**
- Сообщение об ошибке: "Connection refused" при попытке подключения к RTMP или RTSP

**Решения:**
1. Убедитесь, что сервер MediaMTX запущен
   ```bash
   # Проверьте, запущен ли MediaMTX
   ps aux | grep mediamtx
   ```

2. Проверьте, доступны ли порты
   ```bash
   # Проверьте, не использует ли что-то еще порт RTMP
   lsof -i :1936
   
   # Проверьте, не использует ли что-то еще порт RTSP
   lsof -i :8554
   ```

3. Попробуйте перезапустить сервер MediaMTX
   ```bash
   # Убейте все существующие процессы MediaMTX
   pkill -f mediamtx
   
   # Запустите снова
   cd mediamtx
   ./mediamtx mediamtx.yml
   ```

### Проблема: Нет видео или черный экран

**Симптомы:**
- RTSP подключение успешно, но видео не появляется

**Решения:**
1. Проверьте, действительно ли публикуется RTMP поток
   - Проверьте логи сервера MediaMTX на наличие сообщений типа: 
     `INF [RTMP] [conn X.X.X.X:XXXXX] is publishing to path 'test'`

2. Попробуйте другой плеер
   ```bash
   # Если ffplay не работает, попробуйте VLC
   vlc rtsp://localhost:8554/test
   ```

3. Увеличьте размер буфера в ffplay
   ```bash
   ffplay -rtsp_transport tcp -buffer_size 1024K rtsp://localhost:8554/test
   ```

### Проблема: Высокая задержка

**Симптомы:**
- Видео воспроизводится, но со значительной задержкой

**Решения:**
1. Используйте TCP для RTSP транспорта (уже в наших примерах)
   
2. Добавьте флаги низкой задержки к ffplay
   ```bash
   ffplay -rtsp_transport tcp -fflags nobuffer -flags low_delay -framedrop rtsp://localhost:8554/test
   ```

3. Уменьшите качество видео в вашем RTMP источнике, если возможно

## 📡 Расширенное использование

### Пользовательские имена потоков

При использовании тестового потока вы можете указать пользовательское имя потока:

```bash
cd mediamtx
./test_conversion.sh mycustomstream
```

Затем получите к нему доступ с помощью:
```bash
ffplay -rtsp_transport tcp rtsp://localhost:8554/mycustomstream
```

### Несколько одновременных потоков

Вы можете запустить несколько потоков одновременно - система обработает их автоматически:

```bash
# В терминале 1
cd mediamtx
./test_conversion.sh stream1

# В терминале 2
cd mediamtx
./test_conversion.sh stream2
```

Затем получите к ним доступ отдельно:
```bash
ffplay -rtsp_transport tcp rtsp://localhost:8554/stream1
ffplay -rtsp_transport tcp rtsp://localhost:8554/stream2
```

### Запись потоков

Для записи потоков на диск измените `mediamtx/mediamtx.yml`:

```yaml
paths:
  all:
    record: yes
    recordPath: ./recordings
```

### Удаленный доступ

Чтобы сделать ваши потоки доступными с других устройств:

1. Найдите свой IP-адрес
   ```bash
   # На macOS/Linux
   ifconfig
   
   # На Windows
   ipconfig
   ```

2. Используйте свой IP вместо localhost
   ```
   RTMP вход: rtmp://192.168.1.x:1936/streamname
   RTSP выход: rtsp://192.168.1.x:8554/streamname
   ```

3. Убедитесь, что порты 1936 и 8554 открыты в вашем брандмауэре

## 🔍 Понимание принципа работы

### Обзор архитектуры

```
+----------------+      +------------------+      +----------------+
|                |      |                  |      |                |
|  RTMP источник +----->+  MediaMTX сервер +----->+  RTSP клиент   |
| (OBS, камера)  |      | (мост протоколов)|      | (VLC, FFplay)  |
|                |      |                  |      |                |
+----------------+      +------------------+      +----------------+
     порт 1936                                        порт 8554
```

1. **RTMP источник** публикует видеопоток на сервер MediaMTX на порт 1936
2. **MediaMTX сервер** получает RTMP поток и делает его доступным как RTSP без перекодирования
3. **RTSP клиент** подключается к серверу MediaMTX на порт 8554 для просмотра потока

### Объяснение ключевых файлов

- `mediamtx/mediamtx`: Основной бинарный файл сервера
- `mediamtx/mediamtx.yml`: Конфигурационный файл для сервера
- `mediamtx/test_conversion.sh`: Скрипт для генерации тестового потока
- `rtmp_to_rtsp.js`: Node.js-реализация преобразования RTMP в RTSP
- `simple_rtmp_to_rtsp.sh`: Упрощенный shell-скрипт для преобразования
- `start.sh`: Удобный скрипт для запуска основной службы

### Опции конфигурации

Основной конфигурационный файл - `mediamtx/mediamtx.yml`. Некоторые важные настройки:

```yaml
# Сетевые настройки
rtmpAddress: :1936  # RTMP адрес прослушивания
rtspAddress: :8554  # RTSP адрес прослушивания

# Настройки путей
paths:
  all:
    # Аутентификация (по умолчанию отключена)
    readUser: ""
    readPass: ""
    publishUser: ""
    publishPass: ""
    
    # Настройки производительности
    publishReadyTime: 2s
```

## 🚢 Советы по развертыванию в продакшне

### Запуск в качестве фоновой службы

Для использования в продакшне вы можете запустить сервер MediaMTX как фоновую службу:

#### Использование systemd (Linux)

Создайте файл службы в `/etc/systemd/system/mediamtx.service`:

```ini
[Unit]
Description=MediaMTX RTMP to RTSP converter
After=network.target

[Service]
Type=simple
User=вашеимяпользователя
WorkingDirectory=/путь/к/decentra_backend/mediamtx
ExecStart=/путь/к/decentra_backend/mediamtx/mediamtx /путь/к/decentra_backend/mediamtx/mediamtx.yml
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Затем включите и запустите службу:
```bash
sudo systemctl enable mediamtx
sudo systemctl start mediamtx
```

#### Использование PM2 (кросс-платформенно)

Установите PM2:
```bash
npm install -g pm2
```

Запустите MediaMTX с PM2:
```bash
cd decentra_backend/mediamtx
pm2 start ./mediamtx -- mediamtx.yml
pm2 save
pm2 startup
```

### Соображения безопасности

Для использования в продакшне рассмотрите:

1. Добавление аутентификации в `mediamtx.yml`:
   ```yaml
   paths:
     all:
       readUser: "viewuser"
       readPass: "viewpassword"
       publishUser: "publishuser"
       publishPass: "publishpassword"
   ```

2. Использование HTTPS/TLS:
   ```yaml
   # RTMPS (защищенный RTMP)
   rtmpsAddress: :1937
   rtmpsCert: путь/к/cert.pem
   rtmpsKey: путь/к/key.pem
   
   # RTSPS (защищенный RTSP)
   rtspsAddress: :8322
   rtspsCert: путь/к/cert.pem
   rtspsKey: путь/к/key.pem
   ```

3. Ограничение доступа с помощью брандмауэра

## 📝 Справочник команд

### Сервер MediaMTX

| Команда | Описание |
|---------|-------------|
| `./mediamtx/mediamtx mediamtx/mediamtx.yml` | Запустить сервер MediaMTX с конфигурационным файлом |
| `pkill -f mediamtx` | Остановить сервер MediaMTX |

### Тестовые потоки

| Команда | Описание |
|---------|-------------|
| `./mediamtx/test_conversion.sh` | Запустить тестовый поток с именем "test" |
| `./mediamtx/test_conversion.sh customname` | Запустить тестовый поток с пользовательским именем |

### Просмотр потоков

| Команда | Описание |
|---------|-------------|
| `ffplay -rtsp_transport tcp rtsp://localhost:8554/streamname` | Просмотреть поток с помощью FFplay |
| `ffplay -rtsp_transport tcp -fflags nobuffer rtsp://localhost:8554/streamname` | Просмотр с меньшей задержкой |

## 🌐 Внешние ресурсы

- [MediaMTX GitHub репозиторий](https://github.com/bluenviron/mediamtx)
- [RTMP спецификация](https://www.adobe.com/devnet/rtmp.html)
- [RTSP спецификация](https://tools.ietf.org/html/rfc7826)
- [FFmpeg документация](https://ffmpeg.org/documentation.html) 