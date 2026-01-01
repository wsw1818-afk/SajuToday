# SajuToday 사주 계산 데이터 명세

## 1. 천간 (天干, 10개)

```json
{
  "heavenlyStems": [
    { "order": 1,  "korean": "갑", "hanja": "甲", "element": "wood",  "yinYang": "yang", "meaning": "큰 나무, 시작" },
    { "order": 2,  "korean": "을", "hanja": "乙", "element": "wood",  "yinYang": "yin",  "meaning": "작은 나무, 유연함" },
    { "order": 3,  "korean": "병", "hanja": "丙", "element": "fire",  "yinYang": "yang", "meaning": "태양, 밝음" },
    { "order": 4,  "korean": "정", "hanja": "丁", "element": "fire",  "yinYang": "yin",  "meaning": "촛불, 따뜻함" },
    { "order": 5,  "korean": "무", "hanja": "戊", "element": "earth", "yinYang": "yang", "meaning": "산, 중심" },
    { "order": 6,  "korean": "기", "hanja": "己", "element": "earth", "yinYang": "yin",  "meaning": "논밭, 포용" },
    { "order": 7,  "korean": "경", "hanja": "庚", "element": "metal", "yinYang": "yang", "meaning": "쇠, 결단력" },
    { "order": 8,  "korean": "신", "hanja": "辛", "element": "metal", "yinYang": "yin",  "meaning": "보석, 섬세함" },
    { "order": 9,  "korean": "임", "hanja": "壬", "element": "water", "yinYang": "yang", "meaning": "바다, 지혜" },
    { "order": 10, "korean": "계", "hanja": "癸", "element": "water", "yinYang": "yin",  "meaning": "비, 감성" }
  ]
}
```

## 2. 지지 (地支, 12개)

```json
{
  "earthlyBranches": [
    { "order": 1,  "korean": "자", "hanja": "子", "element": "water", "yinYang": "yang", "animal": "쥐",    "time": "23:00-01:00", "month": 11 },
    { "order": 2,  "korean": "축", "hanja": "丑", "element": "earth", "yinYang": "yin",  "animal": "소",    "time": "01:00-03:00", "month": 12 },
    { "order": 3,  "korean": "인", "hanja": "寅", "element": "wood",  "yinYang": "yang", "animal": "호랑이", "time": "03:00-05:00", "month": 1 },
    { "order": 4,  "korean": "묘", "hanja": "卯", "element": "wood",  "yinYang": "yin",  "animal": "토끼",  "time": "05:00-07:00", "month": 2 },
    { "order": 5,  "korean": "진", "hanja": "辰", "element": "earth", "yinYang": "yang", "animal": "용",    "time": "07:00-09:00", "month": 3 },
    { "order": 6,  "korean": "사", "hanja": "巳", "element": "fire",  "yinYang": "yin",  "animal": "뱀",    "time": "09:00-11:00", "month": 4 },
    { "order": 7,  "korean": "오", "hanja": "午", "element": "fire",  "yinYang": "yang", "animal": "말",    "time": "11:00-13:00", "month": 5 },
    { "order": 8,  "korean": "미", "hanja": "未", "element": "earth", "yinYang": "yin",  "animal": "양",    "time": "13:00-15:00", "month": 6 },
    { "order": 9,  "korean": "신", "hanja": "申", "element": "metal", "yinYang": "yang", "animal": "원숭이", "time": "15:00-17:00", "month": 7 },
    { "order": 10, "korean": "유", "hanja": "酉", "element": "metal", "yinYang": "yin",  "animal": "닭",    "time": "17:00-19:00", "month": 8 },
    { "order": 11, "korean": "술", "hanja": "戌", "element": "earth", "yinYang": "yang", "animal": "개",    "time": "19:00-21:00", "month": 9 },
    { "order": 12, "korean": "해", "hanja": "亥", "element": "water", "yinYang": "yin",  "animal": "돼지",  "time": "21:00-23:00", "month": 10 }
  ]
}
```

## 3. 60갑자 (六十甲子)

```json
{
  "sexagenaryCycle": [
    { "order": 1,  "stem": "갑", "branch": "자", "korean": "갑자", "hanja": "甲子" },
    { "order": 2,  "stem": "을", "branch": "축", "korean": "을축", "hanja": "乙丑" },
    { "order": 3,  "stem": "병", "branch": "인", "korean": "병인", "hanja": "丙寅" },
    { "order": 4,  "stem": "정", "branch": "묘", "korean": "정묘", "hanja": "丁卯" },
    { "order": 5,  "stem": "무", "branch": "진", "korean": "무진", "hanja": "戊辰" },
    { "order": 6,  "stem": "기", "branch": "사", "korean": "기사", "hanja": "己巳" },
    { "order": 7,  "stem": "경", "branch": "오", "korean": "경오", "hanja": "庚午" },
    { "order": 8,  "stem": "신", "branch": "미", "korean": "신미", "hanja": "辛未" },
    { "order": 9,  "stem": "임", "branch": "신", "korean": "임신", "hanja": "壬申" },
    { "order": 10, "stem": "계", "branch": "유", "korean": "계유", "hanja": "癸酉" },
    { "order": 11, "stem": "갑", "branch": "술", "korean": "갑술", "hanja": "甲戌" },
    { "order": 12, "stem": "을", "branch": "해", "korean": "을해", "hanja": "乙亥" },
    { "order": 13, "stem": "병", "branch": "자", "korean": "병자", "hanja": "丙子" },
    { "order": 14, "stem": "정", "branch": "축", "korean": "정축", "hanja": "丁丑" },
    { "order": 15, "stem": "무", "branch": "인", "korean": "무인", "hanja": "戊寅" },
    { "order": 16, "stem": "기", "branch": "묘", "korean": "기묘", "hanja": "己卯" },
    { "order": 17, "stem": "경", "branch": "진", "korean": "경진", "hanja": "庚辰" },
    { "order": 18, "stem": "신", "branch": "사", "korean": "신사", "hanja": "辛巳" },
    { "order": 19, "stem": "임", "branch": "오", "korean": "임오", "hanja": "壬午" },
    { "order": 20, "stem": "계", "branch": "미", "korean": "계미", "hanja": "癸未" },
    { "order": 21, "stem": "갑", "branch": "신", "korean": "갑신", "hanja": "甲申" },
    { "order": 22, "stem": "을", "branch": "유", "korean": "을유", "hanja": "乙酉" },
    { "order": 23, "stem": "병", "branch": "술", "korean": "병술", "hanja": "丙戌" },
    { "order": 24, "stem": "정", "branch": "해", "korean": "정해", "hanja": "丁亥" },
    { "order": 25, "stem": "무", "branch": "자", "korean": "무자", "hanja": "戊子" },
    { "order": 26, "stem": "기", "branch": "축", "korean": "기축", "hanja": "己丑" },
    { "order": 27, "stem": "경", "branch": "인", "korean": "경인", "hanja": "庚寅" },
    { "order": 28, "stem": "신", "branch": "묘", "korean": "신묘", "hanja": "辛卯" },
    { "order": 29, "stem": "임", "branch": "진", "korean": "임진", "hanja": "壬辰" },
    { "order": 30, "stem": "계", "branch": "사", "korean": "계사", "hanja": "癸巳" },
    { "order": 31, "stem": "갑", "branch": "오", "korean": "갑오", "hanja": "甲午" },
    { "order": 32, "stem": "을", "branch": "미", "korean": "을미", "hanja": "乙未" },
    { "order": 33, "stem": "병", "branch": "신", "korean": "병신", "hanja": "丙申" },
    { "order": 34, "stem": "정", "branch": "유", "korean": "정유", "hanja": "丁酉" },
    { "order": 35, "stem": "무", "branch": "술", "korean": "무술", "hanja": "戊戌" },
    { "order": 36, "stem": "기", "branch": "해", "korean": "기해", "hanja": "己亥" },
    { "order": 37, "stem": "경", "branch": "자", "korean": "경자", "hanja": "庚子" },
    { "order": 38, "stem": "신", "branch": "축", "korean": "신축", "hanja": "辛丑" },
    { "order": 39, "stem": "임", "branch": "인", "korean": "임인", "hanja": "壬寅" },
    { "order": 40, "stem": "계", "branch": "묘", "korean": "계묘", "hanja": "癸卯" },
    { "order": 41, "stem": "갑", "branch": "진", "korean": "갑진", "hanja": "甲辰" },
    { "order": 42, "stem": "을", "branch": "사", "korean": "을사", "hanja": "乙巳" },
    { "order": 43, "stem": "병", "branch": "오", "korean": "병오", "hanja": "丙午" },
    { "order": 44, "stem": "정", "branch": "미", "korean": "정미", "hanja": "丁未" },
    { "order": 45, "stem": "무", "branch": "신", "korean": "무신", "hanja": "戊申" },
    { "order": 46, "stem": "기", "branch": "유", "korean": "기유", "hanja": "己酉" },
    { "order": 47, "stem": "경", "branch": "술", "korean": "경술", "hanja": "庚戌" },
    { "order": 48, "stem": "신", "branch": "해", "korean": "신해", "hanja": "辛亥" },
    { "order": 49, "stem": "임", "branch": "자", "korean": "임자", "hanja": "壬子" },
    { "order": 50, "stem": "계", "branch": "축", "korean": "계축", "hanja": "癸丑" },
    { "order": 51, "stem": "갑", "branch": "인", "korean": "갑인", "hanja": "甲寅" },
    { "order": 52, "stem": "을", "branch": "묘", "korean": "을묘", "hanja": "乙卯" },
    { "order": 53, "stem": "병", "branch": "진", "korean": "병진", "hanja": "丙辰" },
    { "order": 54, "stem": "정", "branch": "사", "korean": "정사", "hanja": "丁巳" },
    { "order": 55, "stem": "무", "branch": "오", "korean": "무오", "hanja": "戊午" },
    { "order": 56, "stem": "기", "branch": "미", "korean": "기미", "hanja": "己未" },
    { "order": 57, "stem": "경", "branch": "신", "korean": "경신", "hanja": "庚申" },
    { "order": 58, "stem": "신", "branch": "유", "korean": "신유", "hanja": "辛酉" },
    { "order": 59, "stem": "임", "branch": "술", "korean": "임술", "hanja": "壬戌" },
    { "order": 60, "stem": "계", "branch": "해", "korean": "계해", "hanja": "癸亥" }
  ]
}
```

## 4. 오행 상생상극 (五行 相生相剋)

```json
{
  "fiveElements": {
    "wood":  { "korean": "목", "hanja": "木", "color": "#4CAF50", "generates": "fire",  "controls": "earth" },
    "fire":  { "korean": "화", "hanja": "火", "color": "#F44336", "generates": "earth", "controls": "metal" },
    "earth": { "korean": "토", "hanja": "土", "color": "#FFC107", "generates": "metal", "controls": "water" },
    "metal": { "korean": "금", "hanja": "金", "color": "#9E9E9E", "generates": "water", "controls": "wood" },
    "water": { "korean": "수", "hanja": "水", "color": "#2196F3", "generates": "wood",  "controls": "fire" }
  },
  "relations": {
    "generating": ["목생화", "화생토", "토생금", "금생수", "수생목"],
    "controlling": ["목극토", "토극수", "수극화", "화극금", "금극목"]
  }
}
```

## 5. 십신 (十神)

```json
{
  "tenGods": [
    { "id": "bijeon",    "korean": "비견", "hanja": "比肩",   "relation": "same_element_same_yinyang",     "meaning": "동료, 경쟁자" },
    { "id": "geobje",    "korean": "겁재", "hanja": "劫財",   "relation": "same_element_diff_yinyang",     "meaning": "형제, 경쟁" },
    { "id": "sikshin",   "korean": "식신", "hanja": "食神",   "relation": "generated_same_yinyang",        "meaning": "표현, 재능" },
    { "id": "sangkwan",  "korean": "상관", "hanja": "傷官",   "relation": "generated_diff_yinyang",        "meaning": "자유, 반항" },
    { "id": "pyeonjae",  "korean": "편재", "hanja": "偏財",   "relation": "controlled_same_yinyang",       "meaning": "투기, 유동자산" },
    { "id": "jeongjae",  "korean": "정재", "hanja": "正財",   "relation": "controlled_diff_yinyang",       "meaning": "안정, 고정자산" },
    { "id": "pyeongwan", "korean": "편관", "hanja": "偏官",   "relation": "controlling_same_yinyang",      "meaning": "권력, 통제" },
    { "id": "jeongkwan", "korean": "정관", "hanja": "正官",   "relation": "controlling_diff_yinyang",      "meaning": "명예, 직장" },
    { "id": "pyeonin",   "korean": "편인", "hanja": "偏印",   "relation": "generating_same_yinyang",       "meaning": "학문, 영감" },
    { "id": "jeongin",   "korean": "정인", "hanja": "正印",   "relation": "generating_diff_yinyang",       "meaning": "어머니, 학업" }
  ]
}
```

### 십신 계산 규칙

일간(日干)을 기준으로 다른 천간과의 관계:

| 일간 기준 | 같은 오행 | 내가 생하는 | 내가 극하는 | 나를 극하는 | 나를 생하는 |
|-----------|-----------|-------------|-------------|-------------|-------------|
| 같은 음양 | 비견 | 식신 | 편재 | 편관 | 편인 |
| 다른 음양 | 겁재 | 상관 | 정재 | 정관 | 정인 |

## 6. 지지 합충 (地支 合沖)

### 6.1 육합 (六合)
```json
{
  "sixCombines": [
    { "pair": ["자", "축"], "result": "토", "meaning": "자축합토" },
    { "pair": ["인", "해"], "result": "목", "meaning": "인해합목" },
    { "pair": ["묘", "술"], "result": "화", "meaning": "묘술합화" },
    { "pair": ["진", "유"], "result": "금", "meaning": "진유합금" },
    { "pair": ["사", "신"], "result": "수", "meaning": "사신합수" },
    { "pair": ["오", "미"], "result": "토", "meaning": "오미합토" }
  ]
}
```

### 6.2 육충 (六沖)
```json
{
  "sixClashes": [
    { "pair": ["자", "오"], "meaning": "자오충" },
    { "pair": ["축", "미"], "meaning": "축미충" },
    { "pair": ["인", "신"], "meaning": "인신충" },
    { "pair": ["묘", "유"], "meaning": "묘유충" },
    { "pair": ["진", "술"], "meaning": "진술충" },
    { "pair": ["사", "해"], "meaning": "사해충" }
  ]
}
```

### 6.3 삼합 (三合) - MVP 이후
```json
{
  "threeCombines": [
    { "branches": ["신", "자", "진"], "result": "water", "meaning": "신자진 수국" },
    { "branches": ["해", "묘", "미"], "result": "wood",  "meaning": "해묘미 목국" },
    { "branches": ["인", "오", "술"], "result": "fire",  "meaning": "인오술 화국" },
    { "branches": ["사", "유", "축"], "result": "metal", "meaning": "사유축 금국" }
  ]
}
```

## 7. 지장간 (地藏干)

각 지지에 숨어있는 천간:

```json
{
  "hiddenStems": {
    "자": { "main": "계", "middle": null, "residue": null },
    "축": { "main": "기", "middle": "계", "residue": "신" },
    "인": { "main": "갑", "middle": "병", "residue": "무" },
    "묘": { "main": "을", "middle": null, "residue": null },
    "진": { "main": "무", "middle": "을", "residue": "계" },
    "사": { "main": "병", "middle": "무", "residue": "경" },
    "오": { "main": "정", "middle": "기", "residue": null },
    "미": { "main": "기", "middle": "정", "residue": "을" },
    "신": { "main": "경", "middle": "임", "residue": "무" },
    "유": { "main": "신", "middle": null, "residue": null },
    "술": { "main": "무", "middle": "신", "residue": "정" },
    "해": { "main": "임", "middle": "갑", "residue": null }
  }
}
```

## 8. 24절기 (二十四節氣)

```json
{
  "solarTerms": [
    { "order": 1,  "korean": "입춘", "hanja": "立春", "month": 2,  "approxDay": 4,  "type": "절", "description": "봄의 시작" },
    { "order": 2,  "korean": "우수", "hanja": "雨水", "month": 2,  "approxDay": 19, "type": "기", "description": "봄비 내림" },
    { "order": 3,  "korean": "경칩", "hanja": "驚蟄", "month": 3,  "approxDay": 6,  "type": "절", "description": "개구리 깸" },
    { "order": 4,  "korean": "춘분", "hanja": "春分", "month": 3,  "approxDay": 21, "type": "기", "description": "낮밤 같음" },
    { "order": 5,  "korean": "청명", "hanja": "清明", "month": 4,  "approxDay": 5,  "type": "절", "description": "맑고 밝음" },
    { "order": 6,  "korean": "곡우", "hanja": "穀雨", "month": 4,  "approxDay": 20, "type": "기", "description": "곡식 비" },
    { "order": 7,  "korean": "입하", "hanja": "立夏", "month": 5,  "approxDay": 6,  "type": "절", "description": "여름 시작" },
    { "order": 8,  "korean": "소만", "hanja": "小滿", "month": 5,  "approxDay": 21, "type": "기", "description": "만물 성장" },
    { "order": 9,  "korean": "망종", "hanja": "芒種", "month": 6,  "approxDay": 6,  "type": "절", "description": "씨뿌림" },
    { "order": 10, "korean": "하지", "hanja": "夏至", "month": 6,  "approxDay": 21, "type": "기", "description": "낮 가장 김" },
    { "order": 11, "korean": "소서", "hanja": "小暑", "month": 7,  "approxDay": 7,  "type": "절", "description": "작은 더위" },
    { "order": 12, "korean": "대서", "hanja": "大暑", "month": 7,  "approxDay": 23, "type": "기", "description": "큰 더위" },
    { "order": 13, "korean": "입추", "hanja": "立秋", "month": 8,  "approxDay": 8,  "type": "절", "description": "가을 시작" },
    { "order": 14, "korean": "처서", "hanja": "處暑", "month": 8,  "approxDay": 23, "type": "기", "description": "더위 끝" },
    { "order": 15, "korean": "백로", "hanja": "白露", "month": 9,  "approxDay": 8,  "type": "절", "description": "흰 이슬" },
    { "order": 16, "korean": "추분", "hanja": "秋分", "month": 9,  "approxDay": 23, "type": "기", "description": "낮밤 같음" },
    { "order": 17, "korean": "한로", "hanja": "寒露", "month": 10, "approxDay": 8,  "type": "절", "description": "찬 이슬" },
    { "order": 18, "korean": "상강", "hanja": "霜降", "month": 10, "approxDay": 23, "type": "기", "description": "서리 내림" },
    { "order": 19, "korean": "입동", "hanja": "立冬", "month": 11, "approxDay": 7,  "type": "절", "description": "겨울 시작" },
    { "order": 20, "korean": "소설", "hanja": "小雪", "month": 11, "approxDay": 22, "type": "기", "description": "작은 눈" },
    { "order": 21, "korean": "대설", "hanja": "大雪", "month": 12, "approxDay": 7,  "type": "절", "description": "큰 눈" },
    { "order": 22, "korean": "동지", "hanja": "冬至", "month": 12, "approxDay": 22, "type": "기", "description": "밤 가장 김" },
    { "order": 23, "korean": "소한", "hanja": "小寒", "month": 1,  "approxDay": 6,  "type": "절", "description": "작은 추위" },
    { "order": 24, "korean": "대한", "hanja": "大寒", "month": 1,  "approxDay": 20, "type": "기", "description": "큰 추위" }
  ]
}
```

## 9. 월주 계산용 절기-월 매핑

년주는 **입춘**을 기준으로 바뀌고, 월주는 **절기**를 기준으로 바뀜:

| 절기 | 시작 월 (음력 기준) | 월지 |
|------|---------------------|------|
| 입춘 | 1월 | 인(寅) |
| 경칩 | 2월 | 묘(卯) |
| 청명 | 3월 | 진(辰) |
| 입하 | 4월 | 사(巳) |
| 망종 | 5월 | 오(午) |
| 소서 | 6월 | 미(未) |
| 입추 | 7월 | 신(申) |
| 백로 | 8월 | 유(酉) |
| 한로 | 9월 | 술(戌) |
| 입동 | 10월 | 해(亥) |
| 대설 | 11월 | 자(子) |
| 소한 | 12월 | 축(丑) |

## 10. 일간별 성격 키워드 (해석용)

```json
{
  "dayMasterTraits": {
    "갑": {
      "keywords": ["리더십", "진취적", "정직", "고집"],
      "strengths": ["결단력", "추진력", "책임감"],
      "weaknesses": ["고집", "융통성 부족"],
      "career": ["경영", "정치", "교육"]
    },
    "을": {
      "keywords": ["유연함", "적응력", "협조", "섬세"],
      "strengths": ["적응력", "인내심", "협동"],
      "weaknesses": ["우유부단", "의존적"],
      "career": ["예술", "서비스", "상담"]
    },
    "병": {
      "keywords": ["열정", "명랑", "솔직", "급함"],
      "strengths": ["열정", "표현력", "긍정"],
      "weaknesses": ["급함", "산만함"],
      "career": ["연예", "마케팅", "외교"]
    },
    "정": {
      "keywords": ["따뜻함", "세심", "예민", "소심"],
      "strengths": ["배려심", "꼼꼼함", "예술성"],
      "weaknesses": ["걱정 많음", "소심함"],
      "career": ["디자인", "요리", "간호"]
    },
    "무": {
      "keywords": ["안정", "신뢰", "보수", "느림"],
      "strengths": ["신뢰감", "포용력", "안정감"],
      "weaknesses": ["변화 싫어함", "느림"],
      "career": ["금융", "부동산", "농업"]
    },
    "기": {
      "keywords": ["현실적", "실용", "검소", "소극"],
      "strengths": ["현실감각", "절약정신"],
      "weaknesses": ["소극적", "걱정 많음"],
      "career": ["회계", "행정", "관리"]
    },
    "경": {
      "keywords": ["결단", "정의", "냉정", "외로움"],
      "strengths": ["결단력", "정의감", "실행력"],
      "weaknesses": ["고집", "냉정함"],
      "career": ["법률", "군인", "스포츠"]
    },
    "신": {
      "keywords": ["섬세", "완벽", "예민", "까다로움"],
      "strengths": ["섬세함", "심미안", "분석력"],
      "weaknesses": ["까다로움", "비관적"],
      "career": ["보석", "IT", "연구"]
    },
    "임": {
      "keywords": ["지혜", "포용", "변화", "게으름"],
      "strengths": ["지혜", "적응력", "인맥"],
      "weaknesses": ["게으름", "산만함"],
      "career": ["무역", "외교", "컨설팅"]
    },
    "계": {
      "keywords": ["감성", "직관", "조용", "내성적"],
      "strengths": ["직관력", "창의성", "감성"],
      "weaknesses": ["내성적", "걱정 많음"],
      "career": ["심리", "예술", "작가"]
    }
  }
}
```

---

## 부록: 계산 알고리즘 개요

### A. 년주 계산
1. 입춘 이전 생일이면 전년도 간지 사용
2. (양력연도 - 4) % 60 = 60갑자 인덱스

### B. 월주 계산
1. 해당 월의 절기 시작일 확인
2. 절기 이전이면 전월 간지
3. 년간 × 2 + 월지 인덱스로 월간 계산 (공식 적용)

### C. 일주 계산
1. 기준일(1900년 1월 1일 = 갑자)로부터 일수 계산
2. 일수 % 60 = 60갑자 인덱스

### D. 시주 계산
1. 시간대 → 지지 매핑 (2시간 단위)
2. 일간에 따른 시간 계산 공식 적용
3. 자시(23:00-01:00)는 익일 간지 주의
