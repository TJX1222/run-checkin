# 每日跑步签到打卡 App

一个面向 Android 的跑步打卡软件，支持账号登录、GPS 轨迹记录、跑步打卡、历史记录、连续签到和云端同步。

## 项目结构

```text
run-checkin/
├── docs/
│   └── spec.md              # 产品与技术规格说明
├── server/                  # Node.js 云端 API
│   ├── src/
│   ├── package.json
│   └── .env.example
└── mobile/                  # Expo React Native Android 客户端
    ├── App.js
    ├── app.json
    ├── eas.json
    ├── src/
    └── package.json
```

## 功能

- 用户注册、登录、JWT 鉴权
- 首页今日打卡状态、连续打卡天数、本月和累计统计
- GPS 实时定位与地图轨迹
- 跑步距离、时长、配速实时计算
- 暂停、继续、结束并保存打卡
- 跑步历史列表和详情轨迹
- 个人中心与退出登录
- 数据通过云端 API 同步

## 1. 启动云端服务

```bash
cd server
npm install
cp .env.example .env
npm start
```

服务默认运行在 `http://localhost:3000`。

开发环境数据保存在 `server/data/db.json`。生产环境建议替换为 PostgreSQL/MySQL。

### 主要接口

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/runs`
- `GET /api/runs`
- `GET /api/runs/:id`
- `GET /api/stats/summary`

## 2. 启动 Android 客户端

```bash
cd mobile
npm install
```

修改 `mobile/src/config.js`：

- Android 模拟器连接电脑本地服务：`http://10.0.2.2:3000`
- 真机调试：改成电脑局域网 IP，例如 `http://192.168.1.10:3000`
- 云端部署：改成你的 HTTPS 接口地址

然后运行：

```bash
npm run android
```

如果使用 Expo Go，可运行：

```bash
npm start
```

再用 Android 手机扫码打开。

## 3. 打包 Android APK

### 方式一：EAS Build（推荐）

```bash
cd mobile
npm install -g eas-cli
eas login
npm run build:android
```

构建完成后会得到可安装的 APK。

### 方式二：本地 Gradle 构建

需要本地安装 Android Studio / Android SDK。

```bash
cd mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK 输出路径通常为：

```text
mobile/android/app/build/outputs/apk/release/app-release.apk
```

## 4. 部署后端到公网（真机必须）

真机不能访问 `localhost` 或 `10.0.2.2`，也通常不能直接访问开发机的临时 IP。建议把 `server/` 部署到公网。

### Render

1. 把项目推到 GitHub。
2. 在 Render 选择 `New > Blueprint`，导入仓库。
3. 使用根目录 `render.yaml` 自动创建服务。
4. 部署后得到类似 `https://run-checkin-server.onrender.com` 的地址。
5. 在手机 App 的“服务器地址”里填写这个 HTTPS 地址。

### Railway

1. 把项目推到 GitHub。
2. 在 Railway 选择 `New > GitHub Repo`。
3. Railway 会读取根目录 `railway.json` 和 `server/Dockerfile`。
4. 部署后在 Settings 里生成 Public Domain。
5. 在手机 App 的“服务器地址”里填写这个 HTTPS 地址。

### 环境变量

- `PORT`：服务端口，默认 3000。
- `JWT_SECRET`：JWT 密钥，生产环境必须改成随机长字符串。
- `DATA_FILE`：JSON 数据文件路径，默认 `./data/db.json`。

注意：当前后端使用 JSON 文件存储，容器重启或重新部署后数据可能丢失。正式使用建议迁移到 PostgreSQL/MySQL，并挂载持久化存储。

## 5. 权限说明

Android 需要以下权限：

- `ACCESS_FINE_LOCATION`：精确定位，用于记录跑步轨迹
- `ACCESS_COARSE_LOCATION`：粗略定位，用于辅助定位

第一版以前台轨迹记录为主。如果需要后台持续跑步记录，后续可增加前台服务和 `ACCESS_BACKGROUND_LOCATION`。

## 6. 后续可扩展

- 后台跑步轨迹记录
- 月度日历热力图
- 跑步目标与提醒
- 朋友圈/社交分享
- 云端数据库部署
- 图片打卡和天气信息
