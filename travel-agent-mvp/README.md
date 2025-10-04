# Travel Agent MVP (HTML/JS + Vercel + Amadeus + Hotelbeds)

## Features
- 자연어 → 항공/호텔 검색
- 항공 Top 3: 최저가 / 최단시간 / 최저환승
- 장바구니 합산 금액
- `/api/mock-pay` 모의 결제

## Structure
- `public/`: 프런트 (index.html, app.js, nl.js)
- `api/`: Vercel Serverless (Amadeus/Hotelbeds/Locations/MockPay)
- `vercel.json`: 정적 + 서버리스 라우팅
- `mcp-server/`(선택): MCP 도구 서버 예시

## Env (Vercel Project Settings → Environment Variables)
```
AMAD_CLIENT_ID=xxxx
AMAD_CLIENT_SECRET=xxxx
AMAD_ENV=test
HOTELBEDS_API_KEY=xxxx
HOTELBEDS_SECRET=xxxx
HOTELBEDS_BASE=https://api.test.hotelbeds.com/hotel-api/1.0
ORIGIN_ALLOWED=https://your-github-username.github.io
```
