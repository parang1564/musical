import { useState, useEffect, useRef, useMemo } from 'react';
import { openDB } from 'idb';
import html2canvas from 'html2canvas';
import './mahagonny.css';

// 🔗 외부 링크 설정
const FIRST_TICKET_LINK = "https://x.com/m_mahagonny/status/2102578699191394393?s=20";
const REVISIT_BENEFIT_LINK = "https://x.com/m_mahagonny/status/2100842809024823529?s=20";
const SEAT_MAP_NOTICE_LINK = "https://x.com/m_mahagonny/status/2100851762018337144?s=20";
const SEEYA_LINK = "https://musicalseeya.com/seeyatheater/62";

// 🎟️ 티켓 원가 및 할인 계산 데이터
const TICKET_ORIGIN_PRICE = 77000;
const TICKET_FEE = 2000;

const DISCOUNT_OPTIONS = {
  "오픈위크할인 40%": { rate: 0.4, label: "오픈위크할인 40%" },
  "재관람할인 30%": { rate: 0.3, label: "재관람할인 30%" },
  "40% 할인권": { rate: 0.4, label: "40% 할인권" },
};

const calcDiscountPriceNumber = (discountKey) => {
  const option = DISCOUNT_OPTIONS[discountKey] || DISCOUNT_OPTIONS["재관람할인 30%"];
  return TICKET_ORIGIN_PRICE * (1 - option.rate) + TICKET_FEE;
};

const calcDiscountPrice = (discountKey, useCoupon = false, useNaverCoupon = false) => {
  let finalPrice = calcDiscountPriceNumber(discountKey);
  if (useCoupon) finalPrice -= 10000;
  if (useNaverCoupon) finalPrice -= 2500;
  return `${Math.max(0, finalPrice).toLocaleString()}원`;
};

// 👥 출연진 이름 헬퍼
const getCleanCastString = (item) => {
  if (!item) return "";
  const filteredChorus = Array.isArray(item.chorus)
    ? item.chorus.filter(c => c && !['★', '♠', '♣', '♥', '◆'].includes(c.trim()))
    : [];
  return [item.actor1, item.actor2, ...filteredChorus].filter(Boolean).join(" ");
};

const getTimeOfDay = (timeStr) => {
  if (!timeStr) return "";
  const hour = parseInt(timeStr.split(":")[0], 10);
  return hour < 17 ? "낮" : "밤";
};

const formatTimeSimple = (timeStr) => {
  if (!timeStr) return "";
  const hour = parseInt(timeStr.split(":")[0], 10);
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}시`;
};

const getEventForDate = (dateStr) => null;

// 📅 마하고니 스케줄 데이터
const defaultInitialData = [
  { id: 1, month: 11, date: "11.03", day: "화", time: "20:00", actor1: "최재웅", actor2: "이율", chorus: ["김한결", "마이삭", "★", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 2, month: 11, date: "11.04", day: "수", time: "20:00", actor1: "이진혁", actor2: "이종석", chorus: ["♠", "마이삭", "한비", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 3, month: 11, date: "11.05", day: "목", time: "20:00", actor1: "최재웅", actor2: "이율", chorus: ["김한결", "♣", "한비", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 4, month: 11, date: "11.06", day: "금", time: "20:00", actor1: "김찬종", actor2: "온주완", chorus: ["♠", "마이삭", "한비", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 5, month: 11, date: "11.07", day: "토", time: "15:00", actor1: "최재웅", actor2: "이율", chorus: ["김한결", "마이삭", "★", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 6, month: 11, date: "11.07", day: "토", time: "19:00", actor1: "이진혁", actor2: "이종석", chorus: ["김한결", "마이삭", "★", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 7, month: 11, date: "11.08", day: "일", time: "14:00", actor1: "선한국", actor2: "정민", chorus: ["♠", "마이삭", "한비", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 8, month: 11, date: "11.08", day: "일", time: "18:00", actor1: "김찬종", actor2: "온주완", chorus: ["♠", "마이삭", "한비", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 9, month: 11, date: "11.10", day: "화", time: "20:00", actor1: "임예진", actor2: "이지연", chorus: ["김한결", "마이삭", "한비", "♥", "박민주"], seat: "", cardTarget: 1 },
  { id: 10, month: 11, date: "11.11", day: "수", time: "16:00", actor1: "김찬종", actor2: "온주완", chorus: ["김한결", "마이삭", "★", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 11, month: 11, date: "11.11", day: "수", time: "20:00", actor1: "선한국", actor2: "정민", chorus: ["김한결", "마이삭", "★", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 12, month: 11, date: "11.12", day: "목", time: "20:00", actor1: "이진혁", actor2: "이종석", chorus: ["김한결", "마이삭", "한비", "최민경", "◆"], seat: "", cardTarget: 1 },
  { id: 13, month: 11, date: "11.13", day: "금", time: "16:00", actor1: "선한국", actor2: "정민", chorus: ["김한결", "마이삭", "한비", "♥", "박민주"], seat: "", cardTarget: 1 },
  { id: 14, month: 11, date: "11.13", day: "금", time: "20:00", actor1: "임예진", actor2: "이지연", chorus: ["김한결", "마이삭", "한비", "최민경", "◆"], seat: "", cardTarget: 1 },
  { id: 15, month: 11, date: "11.14", day: "토", time: "15:00", actor1: "김찬종", actor2: "온주완", chorus: ["♠", "마이삭", "한비", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 16, month: 11, date: "11.14", day: "토", time: "19:00", actor1: "이진혁", actor2: "이종석", chorus: ["김한결", "♣", "한비", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 17, month: 11, date: "11.15", day: "일", time: "14:00", actor1: "임예진", actor2: "이지연", chorus: ["김한결", "마이삭", "★", "최민경", "박민주"], seat: "", cardTarget: 1 },
  { id: 18, month: 11, date: "11.15", day: "일", time: "18:00", actor1: "최재웅", actor2: "이율", chorus: ["김한결", "마이삭", "★", "최민경", "박민주"], seat: "", cardTarget: 1 }
];

// 🪑 링크아트센터 드림1관 실제 배치도 (A~S열 완벽 구현)
const mahagonnySeatingRows = {
  A: [null, null, 1, 2, 3, 4, null, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, null, 17, 18, 19, 20, 21, 22, null, null],
  B: [null, null, 1, 2, 3, 4, null, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, null, 17, 18, 19, 20, 21, 22, 23, null],
  C: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, 26],
  D: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, 26],
  E: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, 26],
  F: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, 26],
  G: [null, 1, 2, 3, 4, 5, null, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, 18, 19, 20, 21, 22, 23, 24, 25],
  H: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, 26],
  I: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, 26],
  J: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, null],
  K: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, null],
  L: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, 26],
  M: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, 19, 20, 21, 22, 23, 24, 25, 26],
  N: [null, 1, 2, 3, 4, 5, null, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, 18, 19, 20, 21, 22, 23, 24, 25],
  O: [null, 1, 2, 3, 4, 5, null, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, 18, 19, 20, 21, 22, 23, 24, 25],
  P: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, 18, 19, 20, 21, 22, 23, 24, 25],
  Q: [1, 2, 3, 4, 5, null, null, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, 18, 19, 20, 21, 22, 23, 24, 25],
  R: [null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, 18, 19, 20, 21, 22, 23, 24, 25],
  S: [1, 2, null, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, null]
};

const DB_NAME = 'MusicalSchedulerDB_Mahagonny_Production_V3';
const STORE_NAME = 'schedules';
const SETTING_STORE = 'settings';
const DB_VERSION = 1;

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTING_STORE)) {
        db.createObjectStore(SETTING_STORE, { keyPath: 'key' });
      }
    },
  });
};

export default function Mahagonny() {
  const [schedules, setSchedules] = useState([]);
  const fileInputRef = useRef(null);
  const captureAreaRef = useRef(null); // 📸 [캡처 시작 기준점]
  const [isCapturing, setIsCapturing] = useState(false);

  const [searchActor, setSearchActor] = useState('이진혁');

  const [cardBonuses, setCardBonuses] = useState({});
  const [extraCards, setExtraCards] = useState(0);
  const [cardCollapsedMap, setCardCollapsedMap] = useState({});
  const [monthCollapsedMap, setMonthCollapsedMap] = useState({});
  const [calendarCollapsedMap, setCalendarCollapsedMap] = useState({ 11: false });

  // 📋 양도 모달
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [useCoupon, setUseCoupon] = useState(false);
  const [useNaverCoupon, setUseNaverCoupon] = useState(false);
  const [modalInputs, setModalInputs] = useState({
    musicalName: '뮤지컬 마하고니',
    transferSeat: '',
    discountType: '오픈위크할인 40%',
    price: calcDiscountPrice('오픈위크할인 40%', false, false),
    notice: '증빙 필요, 찾아드릴 수 없습니다',
    twitterTag: '@YeonMyuticket'
  });

  // 🔄 교환 모달
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeItem, setExchangeItem] = useState(null);
  const [selectedTargetScheduleId, setSelectedTargetScheduleId] = useState('');
  const [exchangeInputs, setExchangeInputs] = useState({
    musicalName: '뮤지컬 마하고니',
    myDateInfo: '',
    mySeat: '',
    targetDates: '',
    targetSeats: '',
    bottomNote: '맘찍 후 디엠 주세요'
  });

  // 🪑 좌석 포맷팅 (D12 -> D-12)
  const formatSeatInput = (val) => {
    let clean = val.toUpperCase().trim().replace(/\s+/g, '').replace(/-/g, '');
    if (!clean) return '';
    const match = clean.match(/^([A-S])(\d+)$/);
    if (match) return `${match[1]}-${match[2]}`;
    return clean;
  };

  const loadInitialData = async () => {
    const db = await initDB();
    const savedData = await db.getAll(STORE_NAME);

    if (savedData.length === 0) {
      for (const item of defaultInitialData) {
        await db.put(STORE_NAME, item);
      }
      setSchedules(defaultInitialData);
    } else {
      setSchedules(savedData.sort((a, b) => a.id - b.id));
    }

    const savedBonuses = await db.get(SETTING_STORE, 'cardBonuses');
    if (savedBonuses) setCardBonuses(savedBonuses.value || {});

    const savedCards = await db.get(SETTING_STORE, 'extraCards');
    if (savedCards) setExtraCards(savedCards.value || 0);

    const savedCardCollapsed = await db.get(SETTING_STORE, 'cardCollapsedMap');
    if (savedCardCollapsed) setCardCollapsedMap(savedCardCollapsed.value || {});

    const savedMonthCollapsed = await db.get(SETTING_STORE, 'monthCollapsedMap');
    if (savedMonthCollapsed) setMonthCollapsedMap(savedMonthCollapsed.value || {});

    const savedCalendarCollapsed = await db.get(SETTING_STORE, 'calendarCollapsedMap');
    if (savedCalendarCollapsed) {
      setCalendarCollapsedMap(savedCalendarCollapsed.value || { 11: false });
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCardBonusChange = async (cardNum, changeAmount) => {
    const currentVal = cardBonuses[cardNum] || 0;
    const nextVal = Math.max(0, currentVal + changeAmount);
    const updatedBonuses = { ...cardBonuses, [cardNum]: nextVal };

    setCardBonuses(updatedBonuses);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'cardBonuses', value: updatedBonuses });
  };

  const toggleSingleCardCollapse = async (cardNum) => {
    const currentState = Boolean(cardCollapsedMap[cardNum]);
    const updatedMap = { ...cardCollapsedMap, [cardNum]: !currentState };

    setCardCollapsedMap(updatedMap);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'cardCollapsedMap', value: updatedMap });
  };

  const toggleMonthCollapse = async (monthNum) => {
    const currentState = Boolean(monthCollapsedMap[monthNum]);
    const updatedMap = { ...monthCollapsedMap, [monthNum]: !currentState };

    setMonthCollapsedMap(updatedMap);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'monthCollapsedMap', value: updatedMap });
  };

  const toggleCalendarCollapse = async (monthNum) => {
    const currentState = Boolean(calendarCollapsedMap[monthNum]);
    const updatedMap = { ...calendarCollapsedMap, [monthNum]: !currentState };

    setCalendarCollapsedMap(updatedMap);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'calendarCollapsedMap', value: updatedMap });
  };

  const handleAddExtraCard = async () => {
    const nextVal = extraCards + 1;
    setExtraCards(nextVal);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'extraCards', value: nextVal });
  };

  const handleRemoveExtraCard = async () => {
    if (extraCards <= 0) return;
    const nextVal = extraCards - 1;
    setExtraCards(nextVal);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'extraCards', value: nextVal });
  };

  const handleSeatChange = (id, value) => {
    setSchedules(prev =>
      prev.map(item => item.id === id ? { ...item, seat: formatSeatInput(value) } : item)
    );
  };

  const handleCardTargetChange = (targetId, value) => {
    const targetCardNum = Number(value);

    setSchedules(prev => {
      const targetIndex = prev.findIndex(item => item.id === targetId);
      if (targetIndex === -1) return prev;

      return prev.map((item, idx) => {
        if (item.id === targetId) return { ...item, cardTarget: targetCardNum };
        if (idx > targetIndex && (!item.seat || item.seat.trim() === "")) {
          return { ...item, cardTarget: targetCardNum };
        }
        return item;
      });
    });
  };

  const handleAllSave = async () => {
    const db = await initDB();
    for (const item of schedules) {
      await db.put(STORE_NAME, item);
    }
    await db.put(SETTING_STORE, { key: 'cardBonuses', value: cardBonuses });
    await db.put(SETTING_STORE, { key: 'extraCards', value: extraCards });
    await db.put(SETTING_STORE, { key: 'cardCollapsedMap', value: cardCollapsedMap });
    await db.put(SETTING_STORE, { key: 'monthCollapsedMap', value: monthCollapsedMap });
    await db.put(SETTING_STORE, { key: 'calendarCollapsedMap', value: calendarCollapsedMap });
    alert('뮤지컬 마하고니 스케줄 및 도장판 정보가 저장되었습니다! 💾');
  };

  const handleCastInfoClick = (item) => {
    const [monthStr, dayStr] = item.date.split('.');
    const formattedDate = `${parseInt(monthStr, 10)}/${parseInt(dayStr, 10)}`;
    const allActors = getCleanCastString(item);
    const copyText = `${formattedDate} ${allActors}`;

    navigator.clipboard.writeText(copyText)
      .then(() => alert(`클립보드 복사 완료: "${copyText}" 📋`))
      .catch(err => alert("복사 실패: " + err));
  };

  // 📸 [흰 패딩 완벽 제거 & 지정 영역만 100% 캡처]
  const handleCaptureImage = async () => {
    if (!captureAreaRef.current) return;
    try {
      setIsCapturing(true);

      const targetEl = captureAreaRef.current;

      const canvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#090614',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: targetEl.clientWidth,
        height: targetEl.clientHeight,
        onclone: (clonedDoc) => {
          // oklab / oklch 에러 방지
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const computedStyle = window.getComputedStyle(el);
            ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
              const val = computedStyle[prop];
              if (val && (val.includes('oklab') || val.includes('oklch'))) {
                el.style[prop] = prop === 'color' ? '#ede9fe' : 'transparent';
              }
            });
          });
        }
      });

      const imageURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageURL;
      link.download = `mahagonny_settlement_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('캡처 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExportFile = () => {
    if (schedules.length === 0) return alert('백업할 데이터가 없습니다.');
    const backupObject = {
      schedules,
      cardBonuses,
      extraCards,
      cardCollapsedMap,
      monthCollapsedMap,
      calendarCollapsedMap
    };
    const dataStr = JSON.stringify(backupObject, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mahagonny_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const scheduleList = Array.isArray(importedData) ? importedData : importedData.schedules;
        if (!Array.isArray(scheduleList)) throw new Error('형식이 올바르지 않습니다.');

        if (window.confirm('기존 기록을 덮어쓰고 복구하시겠습니까?')) {
          const db = await initDB();
          await db.clear(STORE_NAME);
          for (const item of scheduleList) {
            await db.put(STORE_NAME, { ...item, seat: formatSeatInput(item.seat), cardTarget: item.cardTarget || 1 });
          }

          if (importedData.cardBonuses) await db.put(SETTING_STORE, { key: 'cardBonuses', value: importedData.cardBonuses });
          if (importedData.extraCards !== undefined) await db.put(SETTING_STORE, { key: 'extraCards', value: importedData.extraCards });
          if (importedData.cardCollapsedMap) await db.put(SETTING_STORE, { key: 'cardCollapsedMap', value: importedData.cardCollapsedMap });
          if (importedData.monthCollapsedMap) await db.put(SETTING_STORE, { key: 'monthCollapsedMap', value: importedData.monthCollapsedMap });
          if (importedData.calendarCollapsedMap) await db.put(SETTING_STORE, { key: 'calendarCollapsedMap', value: importedData.calendarCollapsedMap });

          alert('복구가 완료되었습니다! 📂');
          loadInitialData();
        }
      } catch (error) {
        alert('파일 읽기 실패: ' + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    if (window.confirm('정말 최초 기본 상태로 초기화하시겠습니까?')) {
      const db = await initDB();
      await db.clear(STORE_NAME);
      await db.clear(SETTING_STORE);
      setCardBonuses({});
      setExtraCards(0);
      setCardCollapsedMap({});
      setMonthCollapsedMap({});
      setCalendarCollapsedMap({ 11: false });
      loadInitialData();
      alert('초기화되었습니다.');
    }
  };

  const handleOpenCopyModal = (item) => {
    setSelectedItem(item);
    setUseCoupon(false);
    setUseNaverCoupon(false);

    const defaultDiscount = (item.date >= "11.03" && item.date <= "11.15") 
      ? "오픈위크할인 40%" 
      : "재관람할인 30%";

    setModalInputs(prev => ({
      ...prev,
      transferSeat: item.seat || '',
      discountType: defaultDiscount,
      price: calcDiscountPrice(defaultDiscount, false, false),
      notice: '증빙 필요, 찾아드릴 수 없습니다',
      twitterTag: '@YeonMyuticket'
    }));
    setIsModalOpen(true);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleDiscountChange = (e) => {
    const selectedDiscount = e.target.value;
    setModalInputs(prev => ({
      ...prev,
      discountType: selectedDiscount,
      price: calcDiscountPrice(selectedDiscount, useCoupon, useNaverCoupon)
    }));
  };

  const updateNoticeWithTags = (baseNotice, isMan, isNaver) => {
    let clean = baseNotice
      .replace(/,\s*만쿠/g, '')
      .replace(/만쿠/g, '')
      .replace(/,\s*네쿠/g, '')
      .replace(/네쿠/g, '')
      .trim();

    const tags = [];
    if (isMan) tags.push('만쿠');
    if (isNaver) tags.push('네쿠');

    if (tags.length === 0) return clean;
    return clean ? `${clean}, ${tags.join(', ')}` : tags.join(', ');
  };

  const handleCouponToggle = (checked) => {
    setUseCoupon(checked);
    const updatedPrice = calcDiscountPrice(modalInputs.discountType, checked, useNaverCoupon);
    const updatedNotice = updateNoticeWithTags(modalInputs.notice, checked, useNaverCoupon);

    setModalInputs(prev => ({ ...prev, price: updatedPrice, notice: updatedNotice }));
  };

  const handleNaverCouponToggle = (checked) => {
    setUseNaverCoupon(checked);
    const updatedPrice = calcDiscountPrice(modalInputs.discountType, useCoupon, checked);
    const updatedNotice = updateNoticeWithTags(modalInputs.notice, useCoupon, checked);

    setModalInputs(prev => ({ ...prev, price: updatedPrice, notice: updatedNotice }));
  };

  const executeFinalCopy = () => {
    if (!selectedItem) return;
    const item = selectedItem;
    const finalSeat = modalInputs.transferSeat.trim() === "" ? "미입력 좌석" : modalInputs.transferSeat;

    const [monthStr, dayStr] = item.date.split('.');
    const formattedDate = `${parseInt(monthStr, 10)}/${parseInt(dayStr, 10)}`;
    const allActorsList = getCleanCastString(item);
    const noticeText = modalInputs.notice.trim() ? ` (${modalInputs.notice.trim()})` : '';

    const copyText = `${modalInputs.musicalName} 양도\n\n${formattedDate} ${item.time}\n${allActorsList}\n${finalSeat}\n${modalInputs.discountType} ${modalInputs.price}${noticeText}\n${modalInputs.twitterTag}`;

    navigator.clipboard.writeText(copyText)
      .then(() => {
        alert(`${item.date} 회차 양도 문구가 복사되었습니다! 📋`);
        setIsModalOpen(false);
      })
      .catch(err => alert("복사 실패: " + err));
  };

  const handleOpenExchangeModal = (item) => {
    setExchangeItem(item);
    const [monthStr, dayStr] = item.date.split('.');
    const formattedDate = `${parseInt(monthStr, 10)}/${parseInt(dayStr, 10)}`;
    const timeOfDay = getTimeOfDay(item.time);
    const allActors = getCleanCastString(item);

    setSelectedTargetScheduleId('');
    setExchangeInputs({
      musicalName: '뮤지컬 마하고니',
      myDateInfo: `${formattedDate} ${timeOfDay} ${allActors}`,
      mySeat: item.seat || '',
      targetDates: '',
      targetSeats: '',
      bottomNote: '맘찍 후 디엠 주세요'
    });
    setIsExchangeModalOpen(true);
  };

  const handleExchangeInputChange = (e) => {
    const { name, value } = e.target;
    setExchangeInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTargetSchedule = () => {
    if (!selectedTargetScheduleId) return;
    const targetObj = schedules.find(s => s.id === Number(selectedTargetScheduleId));
    if (!targetObj) return;

    const [monthStr, dayStr] = targetObj.date.split('.');
    const formattedDate = `${parseInt(monthStr, 10)}/${parseInt(dayStr, 10)}`;
    const timeSimple = formatTimeSimple(targetObj.time);
    const allActors = getCleanCastString(targetObj);

    const formattedLine = `${formattedDate} ${targetObj.day} ${timeSimple} ${allActors}`;

    setExchangeInputs(prev => ({
      ...prev,
      targetDates: prev.targetDates ? `${prev.targetDates}\n${formattedLine}` : formattedLine
    }));
  };

  const executeExchangeCopy = () => {
    if (!exchangeItem) return;
    const mySeatFinal = exchangeInputs.mySeat.trim() || '미입력 좌석';
    const targetDatesFinal = exchangeInputs.targetDates.trim() || '협의';
    const targetSeatsFinal = exchangeInputs.targetSeats.trim();

    let targetSection = `😇\n${targetDatesFinal}`;
    if (targetSeatsFinal) {
      targetSection += `\n${targetSeatsFinal}`;
    }

    const copyText = `${exchangeInputs.musicalName} 교환\n\n저\n${exchangeInputs.myDateInfo}\n${mySeatFinal}\n\n${targetSection}\n\n${exchangeInputs.bottomNote}`;

    navigator.clipboard.writeText(copyText)
      .then(() => {
        alert(`교환 문구가 클립보드에 복사되었습니다! 📋`);
        setIsExchangeModalOpen(false);
      })
      .catch(err => alert("복사 실패: " + err));
  };

  const watchedShows = schedules.filter(item => item.seat && item.seat.trim() !== "");
  const leeJinHyukCount = watchedShows.filter(item => item.actor1 === "이진혁" || item.actor2 === "이진혁").length;
  const totalLeeJinHyuk = schedules.filter(item => item.actor1 === "이진혁" || item.actor2 === "이진혁").length;

  const maxTargetedCard = useMemo(() => {
    return watchedShows.reduce((max, cur) => Math.max(max, cur.cardTarget || 1), 1);
  }, [watchedShows]);

  const totalCardBoards = useMemo(() => {
    return Math.max(1, maxTargetedCard, 1 + extraCards);
  }, [maxTargetedCard, extraCards]);

  const cardBoardStats = useMemo(() => {
    const cards = [];
    for (let c = 1; c <= totalCardBoards; c++) {
      const cardShows = watchedShows.filter(item => (item.cardTarget || 1) === c);
      const earnedStamps = cardShows.reduce((acc, item) => {
        const event = getEventForDate(item.date);
        return acc + (event && event.isTriple ? 3 : 1);
      }, 0);

      const thisBonus = cardBonuses[c] || 0;
      cards.push({
        cardNumber: c,
        shows: cardShows,
        stamps: earnedStamps + thisBonus,
        bonus: thisBonus,
        earnedStamps,
        isCollapsed: Boolean(cardCollapsedMap[c])
      });
    }
    return cards;
  }, [totalCardBoards, watchedShows, cardBonuses, cardCollapsedMap]);

  const pairStats = useMemo(() => {
    const map = {};
    schedules.forEach(item => {
      const pairKey = `${item.actor1} · ${item.actor2}`;
      if (!map[pairKey]) {
        map[pairKey] = { key: pairKey, actor1: item.actor1, actor2: item.actor2, total: 0, watched: 0 };
      }
      map[pairKey].total += 1;
      if (item.seat && item.seat.trim() !== '') map[pairKey].watched += 1;
    });

    const allPairs = Object.values(map);
    const query = searchActor.trim();
    if (!query) return allPairs.sort((a, b) => b.total - a.total);

    return allPairs
      .filter(p => p.actor1.includes(query) || p.actor2.includes(query))
      .sort((a, b) => b.total - a.total);
  }, [schedules, searchActor]);

  const filteredSchedules = schedules.filter(item => {
    if (!searchActor.trim()) return true;
    const query = searchActor.trim();
    const chorusStr = Array.isArray(item.chorus) ? item.chorus.join(' ') : '';
    const castString = `${item.actor1} ${item.actor2} ${chorusStr}`;

    if (query.includes('/')) {
      const keywords = query.split('/').map(k => k.trim()).filter(Boolean);
      return keywords.every(kw => castString.includes(kw));
    }
    return castString.includes(query);
  });

  const targetSelectSchedules = useMemo(() => {
    const query = searchActor.trim();
    if (!query) return schedules;

    return schedules.filter(item => {
      const chorusStr = Array.isArray(item.chorus) ? item.chorus.join(' ') : '';
      const castString = `${item.actor1} ${item.actor2} ${chorusStr}`;

      if (query.includes('/')) {
        const keywords = query.split('/').map(k => k.trim()).filter(Boolean);
        return keywords.every(kw => castString.includes(kw));
      }
      return castString.includes(query);
    });
  }, [schedules, searchActor]);

  // 🪑 좌석 블록 렌더러 (입력 형식이 D12, D-12, d 12 등 무엇이든 완벽 매칭)
  const renderMahagonnySeating = () => {
    return Object.keys(mahagonnySeatingRows).map(row => (
      <div key={row} className="flex items-center gap-0.5 md:gap-1 justify-center">
        <span className="w-4 md:w-5 font-black text-fuchsia-400 text-center mr-0.5 md:mr-1 text-[11px] font-mono">{row}</span>

        {mahagonnySeatingRows[row].map((seatNumber, index) => {
          if (seatNumber === null) {
            return <div key={`space-${row}-${index}`} className="w-[11px] md:w-[15px] h-[18px] md:h-[20px] flex-shrink-0 bg-transparent" />;
          }

          // 💡 입력된 좌석에서 열(알파벳)과 번호(숫자)를 추출하여 정확히 비교
          const matchingShows = schedules.filter(s => {
            if (!s.seat) return false;
            const clean = s.seat.toUpperCase().trim();
            const match = clean.match(/^([A-S])\D*(\d+)$/);
            if (!match) return false;
            return match[1] === row && parseInt(match[2], 10) === seatNumber;
          });
          const visitCount = matchingShows.length;

          let bgClass = "bg-[#181130] text-purple-300/60 border border-purple-900/40";
          if (visitCount === 1) bgClass = "bg-fuchsia-600 text-white font-black border border-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.7)]";
          else if (visitCount === 2) bgClass = "bg-emerald-500 text-white font-bold border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.7)]";
          else if (visitCount === 3) bgClass = "bg-amber-500 text-slate-950 font-bold border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.7)]";
          else if (visitCount >= 4) bgClass = "bg-rose-600 text-white font-black border border-rose-300 shadow-[0_0_10px_rgba(225,29,72,0.8)]";

          return (
            <div
              key={`seat-${row}-${seatNumber}-${index}`}
              className={`w-[17px] md:w-[20px] h-[17px] md:h-[20px] text-[8px] md:text-[9.5px] rounded flex items-center justify-center font-bold shadow-sm flex-shrink-0 cursor-default select-none transition-all ${bgClass}`}
              title={`${row}열 ${seatNumber}번 (${visitCount}회 관람)`}
            >
              <span className="leading-none text-center block w-full tabular-nums">{seatNumber}</span>
            </div>
          );
        })}

        <span className="w-4 md:w-5 font-black text-fuchsia-400 text-center ml-0.5 md:mr-1 text-[11px] font-mono">{row}</span>
      </div>
    ));
  };

  const generateCalendarDays = (year, month) => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push({ empty: true, key: `empty-${i}` });
    for (let d = 1; d <= lastDate; d++) {
      const formattedD = d < 10 ? `0${d}` : `${d}`;
      const formattedM = month < 10 ? `0${month}` : `${month}`;
      days.push({ empty: false, dayNum: d, dateStr: `${formattedM}.${formattedD}`, key: `day-${month}-${d}` });
    }
    return days;
  };

  return (
    <div className="mahagonny-wrapper p-3 md:p-6 lg:p-8 flex flex-col items-center max-w-4xl mx-auto pb-28 selection:bg-fuchsia-600 selection:text-white">

      {/* 🎡 상단 헤더 카드 */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center gap-3 mb-5 mahagonny-card p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-950/90 border border-fuchsia-400 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(217,70,239,0.35)]">
            🎡
          </div>
          <div>
            <span className="text-[10px] tracking-widest font-black text-fuchsia-400 uppercase block mb-0.5">MUSICAL MAHAGONNY</span>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter mahagonny-glow-text">
              마하고니
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a href={FIRST_TICKET_LINK} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 bg-purple-950/70 hover:bg-purple-900 text-fuchsia-200 rounded-xl text-xs font-bold border border-purple-600/40 transition-all active:scale-95 flex items-center gap-1">
            <span>🎟️</span> 1차
          </a>
          <a href={SEAT_MAP_NOTICE_LINK} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 mahagonny-btn-neon rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1">
            <span>🪑</span> 좌석
          </a>
          <a href={SEEYA_LINK} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 rounded-xl text-xs font-bold border border-indigo-600/40 transition-all active:scale-95 flex items-center gap-1">
            <span>🔭</span> 시야
          </a>
          <a href={REVISIT_BENEFIT_LINK} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 bg-fuchsia-950/80 hover:bg-fuchsia-900 text-fuchsia-300 rounded-xl text-xs font-bold border border-fuchsia-500/40 transition-all active:scale-95 flex items-center gap-1">
            <span>🎁</span> 재관
          </a>
        </div>
      </header>

      {/* 1️⃣ 배우 검색창 */}
      <div className="w-full relative mb-4">
        <input
          type="text"
          placeholder="🔍 배우 검색 (예: 이진혁 또는 이진혁/이종석 입력 시 동시 출연작만 조회)"
          value={searchActor}
          onChange={(e) => setSearchActor(e.target.value)}
          className="w-full p-3.5 text-xs rounded-2xl mahagonny-input-dark font-bold placeholder:text-purple-300/40 shadow-md"
        />
        {searchActor && (
          <button onClick={() => setSearchActor('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-purple-200 bg-purple-900/80 hover:bg-purple-800 rounded-full w-5 h-5 flex items-center justify-center pb-0.5">×</button>
        )}
      </div>

      {/* 2️⃣ 도장판별 적립 섹션 */}
      <section className="w-full mahagonny-card p-4 mb-5">
        <div className="flex items-center justify-between gap-2.5 mb-3 border-b border-purple-800/40 pb-3">
          <div>
            <h2 className="font-black text-xs md:text-sm text-fuchsia-300 flex items-center gap-1.5">
              <span>🎫</span> 도장판별 적립 & 혜택
            </h2>
            <p className="text-[10px] text-purple-300/60 font-medium mt-0.5">
              도장판별 개별 접기/펼치기가 가능하며 브라우저에 자동 기억됩니다.
            </p>
          </div>

          <button
            onClick={handleAddExtraCard}
            className="px-2.5 py-1.5 mahagonny-btn-neon text-[10.5px] font-black rounded-xl transition-all active:scale-95 flex-shrink-0"
          >
            ➕ 새 도장판 추가
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {cardBoardStats.map((board) => (
            <div key={`stamp-card-${board.cardNumber}`} className="mahagonny-subcard p-3 shadow-sm transition-all">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${board.isCollapsed ? '' : 'mb-2.5 pb-2 border-b border-purple-800/30'}`}>
                <div
                  onClick={() => toggleSingleCardCollapse(board.cardNumber)}
                  className="flex items-center gap-2 flex-wrap cursor-pointer select-none group"
                >
                  <span className="px-2 py-0.5 bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-300 text-[10.5px] font-black rounded-md">
                    {board.cardNumber}번
                  </span>
                  <span className="text-xs font-black text-purple-100 group-hover:text-fuchsia-300 transition-colors">
                    {board.cardNumber}번 도장판 ({board.stamps} / 7)
                  </span>
                  {board.bonus > 0 && (
                    <span className="text-[9.5px] font-bold text-fuchsia-300 bg-fuchsia-950 border border-fuchsia-500/40 px-1.5 py-0.2 rounded">
                      추가 +{board.bonus}
                    </span>
                  )}
                  <span className="text-[10px] text-purple-400/60 font-bold ml-1">
                    {board.isCollapsed ? '▶ 펼치기' : '▼ 접기'}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex items-center bg-[#150e2b] border border-purple-700/50 rounded-lg px-1.5 py-0.5 gap-1 text-xs">
                    <span className="text-[9.5px] font-bold text-purple-300/70">추가</span>
                    <button onClick={() => handleCardBonusChange(board.cardNumber, -1)} className="w-4 h-4 bg-purple-900/60 hover:bg-purple-800 text-white rounded font-black flex items-center justify-center text-[10px]">-</button>
                    <span className="font-black text-fuchsia-300 px-0.5 text-[11px]">{board.bonus}</span>
                    <button onClick={() => handleCardBonusChange(board.cardNumber, 1)} className="w-4 h-4 bg-fuchsia-700 hover:bg-fuchsia-600 text-white rounded font-black flex items-center justify-center text-[10px]">+</button>
                  </div>

                  {board.cardNumber > 1 && (
                    <button onClick={handleRemoveExtraCard} className="text-[9px] font-bold text-rose-400 hover:underline pl-1">
                      제거
                    </button>
                  )}
                </div>
              </div>

              {!board.isCollapsed && (
                <div className="animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[10px]">
                    <span className="font-black text-purple-300/70">배정된 회차:</span>
                    {board.shows.length === 0 ? (
                      <span className="text-purple-400/50">선택된 회차가 없습니다</span>
                    ) : (
                      board.shows.map(s => {
                        const event = getEventForDate(s.date);
                        return (
                          <span key={`mapped-tag-${s.id}`} className="bg-purple-950/60 text-purple-200 border border-purple-700/40 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            {s.date}
                            <span className={`font-black text-[9px] ${event && event.isTriple ? 'text-fuchsia-400' : 'text-purple-400'}`}>
                              ({event && event.isTriple ? '+3' : '+1'})
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    <div className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                      board.stamps >= 5
                        ? 'bg-fuchsia-950/60 border-fuchsia-500/80 shadow-[0_0_10px_rgba(217,70,239,0.25)]'
                        : 'bg-[#140f28]/70 border-purple-800/40 opacity-75'
                    }`}>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-purple-300/70 uppercase">STEP 1</span>
                        <span className="font-black text-white text-xs">5회 적립</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-purple-100 block text-[11px]">지정 폴라로이드 1매</span>
                        <span className={`text-[9px] font-extrabold ${board.stamps >= 5 ? 'text-emerald-400' : 'text-purple-400/60'}`}>
                          {board.stamps >= 5 ? '✓ 달성 완료' : `${5 - board.stamps}개 남음`}
                        </span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                      board.stamps >= 7
                        ? 'bg-fuchsia-950/60 border-fuchsia-500/80 shadow-[0_0_10px_rgba(217,70,239,0.25)]'
                        : 'bg-[#140f28]/70 border-purple-800/40 opacity-75'
                    }`}>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-purple-300/70 uppercase">STEP 2</span>
                        <span className="font-black text-white text-xs">7회 적립</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-purple-100 block text-[11px]">실황 OST</span>
                        <span className={`text-[9px] font-extrabold ${board.stamps >= 7 ? 'text-emerald-400' : 'text-purple-400/60'}`}>
                          {board.stamps >= 7 ? '✓ 달성 완료' : `${7 - board.stamps}개 남음`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3️⃣ [월별 회차 스케줄] (캡처 대상 제외) */}
      <main className="w-full flex flex-col gap-5 text-sm mb-5">
        {[11].map(m => {
          const monthSchedules = filteredSchedules.filter(item => item.month === m);
          if (monthSchedules.length === 0) return null;
          const isMonthCollapsed = Boolean(monthCollapsedMap[m]);

          return (
            <div key={m} className="mahagonny-card overflow-hidden transition-all">
              <div
                onClick={() => toggleMonthCollapse(m)}
                className="p-3 bg-[#130d29]/90 text-fuchsia-300 font-black text-center text-xs tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer select-none hover:bg-purple-950 border-b border-purple-800/40"
                title={`${m}월 스케줄 접기/펼치기`}
              >
                <span>✦</span>
                {m}월 회차 스케줄 ({monthSchedules.length}회)
                <span className="text-[10px] text-fuchsia-400 font-bold ml-1">
                  {isMonthCollapsed ? '▶ 펼치기' : '▼ 접기'}
                </span>
                <span>✦</span>
              </div>

              {!isMonthCollapsed && (
                <div className="w-full select-none animate-in fade-in duration-150 p-2">
                  <div className="divide-y divide-purple-900/30">
                    {monthSchedules.map((item) => {
                      const eventInfo = getEventForDate(item.date);
                      const isWatched = item.seat && item.seat.trim() !== "";

                      return (
                        <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 mahagonny-row-item rounded-lg">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="flex flex-col items-start flex-shrink-0">
                              <span className="font-black text-purple-100 text-xs tabular-nums">{item.date} ({item.day})</span>
                              <span className="text-[9px] text-purple-300 bg-purple-950/70 border border-purple-800/50 px-1 rounded mt-0.5 tabular-nums font-bold">{item.time}</span>
                            </div>

                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[11px] sm:text-xs font-bold truncate ${item.actor1 === '이진혁' ? 'text-fuchsia-400 font-black underline underline-offset-2' : 'text-purple-200'}`}>
                                  <span className="text-[9px] text-purple-400/60 font-normal">게스트: </span>{item.actor1}
                                </span>
                                <span className="text-purple-600">/</span>
                                <span className={`text-[11px] sm:text-xs font-bold truncate ${item.actor2 === '이진혁' ? 'text-fuchsia-400 font-black underline underline-offset-2' : 'text-purple-200'}`}>
                                  <span className="text-[9px] text-purple-400/60 font-normal">호스트: </span>{item.actor2}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleCastInfoClick(item)}
                                  className="ml-1 p-1 bg-purple-900/60 hover:bg-fuchsia-600 text-purple-200 hover:text-white rounded-md text-[10px] transition-all active:scale-95 border border-purple-700/50"
                                  title="클릭 시 '날짜 캐스트' 정보 복사"
                                >
                                  📋
                                </button>
                              </div>

                              <div className="text-[9px] text-purple-300/50 truncate" title={item.chorus.join(', ')}>
                                코러스: {item.chorus.join(' · ')}
                              </div>

                              {eventInfo && (
                                <div>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] border leading-tight ${eventInfo.color}`}>
                                    🎁 {eventInfo.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                            <input
                              type="text"
                              placeholder="좌석"
                              value={item.seat || ""}
                              onChange={(e) => handleSeatChange(item.id, e.target.value)}
                              className="w-11 sm:w-14 p-1 text-[11px] rounded-lg text-center font-black uppercase placeholder:font-normal placeholder:text-[9px] h-7 mahagonny-input-dark"
                            />

                            <select
                              value={item.cardTarget || 1}
                              onChange={(e) => handleCardTargetChange(item.id, e.target.value)}
                              disabled={!isWatched}
                              className={`p-1 text-[10px] border rounded-lg font-black h-7 focus:outline-none ${
                                isWatched
                                  ? 'border-fuchsia-500 bg-fuchsia-950 text-fuchsia-200 cursor-pointer shadow-[0_0_8px_rgba(217,70,239,0.3)]'
                                  : 'border-purple-900/40 bg-[#140f28]/60 text-purple-400/40 opacity-60'
                              }`}
                            >
                              {Array.from({ length: Math.max(3, totalCardBoards) }).map((_, i) => (
                                <option key={`card-opt-${i+1}`} value={i+1} className="bg-[#0f0a1f] text-purple-100">{i+1}번</option>
                              ))}
                            </select>

                            <button onClick={() => handleOpenCopyModal(item)} className="px-1.5 sm:px-2 py-1 text-[10px] mahagonny-btn-neon rounded-lg h-7 flex items-center justify-center">양도</button>
                            <button onClick={() => handleOpenExchangeModal(item)} className="px-1.5 sm:px-2 py-1 text-[10px] bg-purple-900/80 hover:bg-purple-800 text-fuchsia-200 border border-fuchsia-500/40 rounded-lg h-7 flex items-center justify-center font-bold active:scale-95 transition-all">교환</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* 🗓️ [월별 캘린더 뷰] (캡처 대상 제외) */}
      <section className="w-full flex flex-col gap-4 mb-5">
        {[11].map(m => {
          const monthSchedules = filteredSchedules.filter(item => item.month === m);
          if (monthSchedules.length === 0) return null;
          const isCalendarCollapsed = Boolean(calendarCollapsedMap[m]);

          return (
            <div key={`cal-section-${m}`} className="mahagonny-card overflow-hidden">
              <div
                onClick={() => toggleCalendarCollapse(m)}
                className="p-3 bg-[#130d29]/90 text-fuchsia-300 font-black text-center text-xs tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer select-none hover:bg-purple-950 border-b border-purple-800/40"
                title={`${m}월 캘린더 접기/펼치기`}
              >
                <span>🗓️</span>
                {m}월 캘린더로 보기
                <span className="text-[10px] text-fuchsia-400 font-bold ml-1">
                  {isCalendarCollapsed ? '▶ 펼치기' : '▼ 접기'}
                </span>
              </div>

              {!isCalendarCollapsed && (
                <div className="p-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-7 text-center font-black text-[11px] text-purple-300/80 mb-2">
                    <span className="text-rose-400">일</span>
                    <span>월</span>
                    <span>화</span>
                    <span>수</span>
                    <span>목</span>
                    <span>금</span>
                    <span className="text-indigo-400">토</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {generateCalendarDays(2026, m).map((dayObj) => {
                      if (dayObj.empty) return <div key={dayObj.key} className="h-20 md:h-24 bg-transparent" />;

                      const dayShows = monthSchedules.filter(s => s.date === dayObj.dateStr);
                      const hasShows = dayShows.length > 0;
                      const eventInfo = getEventForDate(dayObj.dateStr);
                      const isEventStart = eventInfo && eventInfo.startDate === dayObj.dateStr;

                      return (
                        <div
                          key={dayObj.key}
                          className={`p-1 border rounded-lg flex flex-col justify-between overflow-hidden transition-all ${
                            hasShows
                              ? 'min-h-[120px] md:min-h-[140px] bg-purple-950/40 border-purple-600/50 shadow-xs'
                              : 'h-20 md:h-24 bg-[#110a24]/50 border-purple-950/40 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-start items-center">
                              <span className="text-[10px] md:text-[11px] font-black text-purple-200 tabular-nums">{dayObj.dayNum}</span>
                            </div>

                            {eventInfo && (
                              <div className={`block text-[6.5px] md:text-[7.5px] font-black px-1 py-0.5 leading-tight whitespace-normal text-center border ${eventInfo.color} ${isEventStart ? 'rounded-md' : 'rounded-none'}`}>
                                {isEventStart ? eventInfo.name : '\u00A0'}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 overflow-y-auto max-h-[85px] text-[7.5px] md:text-[8.5px]">
                            {hasShows && dayShows.map(show => {
                              const isWatched = show.seat && show.seat.trim() !== "";
                              return (
                                <div
                                  key={`cal-show-${show.id}`}
                                  className={`px-1 py-0.5 rounded font-bold flex flex-col ${
                                    isWatched
                                      ? 'bg-fuchsia-700 text-white font-black shadow-[0_0_6px_rgba(217,70,239,0.5)]'
                                      : 'bg-purple-900/50 text-purple-200 border border-purple-700/30'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono text-[7px] md:text-[7.5px] font-black">● {show.time.substring(0, 5)}</span>
                                    {isWatched && <span className="text-[6.5px]">✓</span>}
                                  </div>
                                  <div className="text-[6.5px] md:text-[7.5px] leading-tight font-medium pl-1 text-purple-100">
                                    <span className={show.actor1 === '이진혁' ? 'font-black text-fuchsia-300' : ''}>{show.actor1}</span>,{' '}
                                    <span className={show.actor2 === '이진혁' ? 'font-black text-fuchsia-300' : ''}>{show.actor2}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* 📸 [📸 이미지 캡처 대상: ✨ 정산 타이틀부터 좌석표까지만 ✨] */}
      <div 
        ref={captureAreaRef} 
        className="w-full flex flex-col items-center rounded-3xl"
        style={{ backgroundColor: '#090614', padding: '16px', boxSizing: 'border-box' }}
      >

        {/* 🏷️ 마하고니 정산 메인 타이틀 바 */}
        <div className="w-full mahagonny-card py-3 px-4 mb-5 text-center shadow-md">
          <h2 className="text-base md:text-lg font-black text-white tracking-tight mahagonny-glow-text">
            ✨ 뮤지컬 마하고니 정산 ✨
          </h2>
        </div>

        {/* 4️⃣ [총 관람 합계] */}
        <section className="w-full mahagonny-card p-4 flex justify-around text-center mb-5">
          <div className="flex-1 border-r border-purple-800/40">
            <p className="text-xs font-black text-fuchsia-400">이진혁 배우 관람</p>
            <p className="text-2xl font-black mt-1 text-white">{leeJinHyukCount} <span className="text-xs font-bold text-purple-300/60">/ {totalLeeJinHyuk}회</span></p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-purple-300">총 관람합계</p>
            <p className="text-2xl font-black mt-1 text-white">{watchedShows.length} <span className="text-xs font-bold text-purple-300/60">/ {schedules.length}회</span></p>
          </div>
        </section>

        {/* 5️⃣ [페어 현황] */}
        <section className="w-full mahagonny-card p-4 mb-5">
          <div className="flex items-center justify-between mb-3 border-b border-purple-800/40 pb-2">
            <h2 className="font-black text-xs md:text-sm text-fuchsia-300 flex items-center gap-1.5">
              <span>👥</span> {searchActor ? `'${searchActor}' 포함 페어 현황` : '전체 페어별 현황'}
              <span className="text-purple-300/60 text-[11px] font-bold">({pairStats.length}개 조합)</span>
            </h2>
            <span className="text-[10px] text-purple-300/60 font-bold">게스트 · 호스트</span>
          </div>

          {pairStats.length === 0 ? (
            <div className="p-4 text-center text-xs text-purple-400/60 bg-purple-950/40 rounded-xl">
              검색어와 일치하는 페어가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {pairStats.map((pair) => {
                const isTarget = pair.actor1 === '이진혁' || pair.actor2 === '이진혁';
                return (
                  <div
                    key={pair.key}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isTarget
                        ? 'bg-fuchsia-950/50 border-fuchsia-500/70 shadow-[0_0_8px_rgba(217,70,239,0.2)]'
                        : 'bg-[#140f28]/60 border-purple-900/40 text-purple-200'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className={`font-black ${isTarget ? 'text-fuchsia-200' : 'text-purple-300'}`}>
                        {pair.key}
                      </span>
                    </div>
                    <div className="text-right pl-2">
                      <span className={`font-black text-sm tabular-nums ${pair.watched > 0 ? 'text-fuchsia-400' : 'text-purple-400/70'}`}>
                        {pair.watched}
                      </span>
                      <span className="text-[11px] font-bold text-purple-400/50 tabular-nums"> / {pair.total}회</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 6️⃣ [마하고니 단층 좌석 배치도 (A~S열)] */}
        <section className="w-full mahagonny-card p-4 md:p-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-3">
            <div className="py-1 px-4 mahagonny-btn-neon rounded-md font-black tracking-widest text-[11px]">S T A G E</div>
            <span className="text-[10px] text-fuchsia-300 font-bold">링크아트센터 드림1관 (A~S열)</span>
          </div>

          <div className="flex gap-2.5 justify-center items-center mb-4 text-[10px] bg-[#120c24]/70 px-3 py-1.5 rounded-xl text-purple-300 font-bold w-full flex-wrap border border-purple-900/40">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-fuchsia-600 rounded-sm"></div>1회 관람</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>2회 관람</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></div>3회 관람</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-rose-600 rounded-sm"></div>4회 이상</div>
          </div>

          <div className="w-full overflow-x-auto pb-2 flex flex-col gap-4">
            <div className="flex flex-col gap-1 w-full min-w-[650px] select-none p-3.5 bg-[#0e081f] rounded-2xl border border-purple-900/50">
              {renderMahagonnySeating()}
              
              <div className="w-full flex justify-center mt-2.5">
                <div className="w-56 py-1 bg-purple-950/70 border border-purple-800/50 text-[10px] font-black text-purple-300/80 rounded-md text-center">
                  C O N S O L
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
      {/* 📸 [이미지 캡처 대상 끝] */}

      {/* 💾 백업 / 복구 / 이미지 저장 바 */}
      <div className="w-full mahagonny-card p-4 flex items-center justify-between text-xs mt-6">
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportFile} className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 text-fuchsia-300 rounded-xl font-black shadow-sm transition-all border border-purple-700/50 active:scale-95">📥 백업</button>
          <button onClick={() => fileInputRef.current.click()} className="px-3.5 py-2 mahagonny-btn-neon rounded-xl font-black shadow-sm transition-all active:scale-95">📤 복구</button>
          <button onClick={handleCaptureImage} disabled={isCapturing} className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-black shadow-sm transition-all border border-emerald-500/50 active:scale-95 disabled:opacity-50">
            {isCapturing ? '캡처 중...' : '📸 이미지 저장'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
        </div>
        <button onClick={handleReset} className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl font-black border border-rose-600/40">초기화</button>
      </div>

      {/* 📋 1. 양도 모달 */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="mahagonny-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col border border-fuchsia-500/50">
            <div className="bg-[#130d29] p-4 text-fuchsia-300 flex justify-between items-center border-b border-purple-800/40">
              <div>
                <h3 className="font-black text-sm flex items-center gap-1">📋 양도 문구 생성</h3>
                <p className="text-[10px] text-purple-300/70 mt-0.5 font-bold">{selectedItem.date} {selectedItem.time} 회차</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-xl font-bold text-purple-300 hover:text-white transition-colors">×</button>
            </div>
            <div className="p-4 flex flex-col gap-3 text-xs text-purple-100">
              <div className="flex flex-col gap-1">
                <label className="font-black text-purple-300/70 text-[11px]">작품명 및 헤더</label>
                <input type="text" name="musicalName" value={modalInputs.musicalName} onChange={handleModalInputChange} className="p-2 mahagonny-input-dark rounded-xl font-bold" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-fuchsia-400 text-[11px]">🕊️ 양도할 좌석 직접 입력</label>
                <input
                  type="text"
                  name="transferSeat"
                  placeholder="예: A열 14-16 등 자유롭게 작성"
                  value={modalInputs.transferSeat}
                  onChange={handleModalInputChange}
                  className="p-2 border-2 border-fuchsia-500 bg-fuchsia-950/40 rounded-xl w-full font-black text-fuchsia-200 uppercase focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-black text-purple-300/70 text-[11px]">할인 종류</label>
                    <select
                      name="discountType"
                      value={modalInputs.discountType}
                      onChange={handleDiscountChange}
                      className="p-2 mahagonny-input-dark rounded-xl text-center font-black text-xs cursor-pointer"
                    >
                      <option value="오픈위크할인 40%" className="bg-[#120c24]">오픈위크할인 40%</option>
                      <option value="재관람할인 30%" className="bg-[#120c24]">재관람할인 30%</option>
                      <option value="40% 할인권" className="bg-[#120c24]">40% 할인권</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-black text-purple-300/70 text-[11px]">티켓 가격 (수수료포함)</label>
                    <input
                      type="text"
                      name="price"
                      value={modalInputs.price}
                      onChange={handleModalInputChange}
                      className="p-2 mahagonny-input-dark rounded-xl text-center font-mono font-black text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-0.5">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-purple-950/50 border border-purple-700/40 cursor-pointer select-none hover:bg-purple-900/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={useCoupon}
                      onChange={(e) => handleCouponToggle(e.target.checked)}
                      className="w-4 h-4 rounded text-fuchsia-600 focus:ring-fuchsia-500 border-purple-600 bg-purple-950 cursor-pointer accent-fuchsia-500"
                    />
                    <span className="font-black text-fuchsia-300 text-[11px] flex items-center gap-1">
                      <span>🏷️</span> 만원 쿠폰 적용 (-10,000원 차감 & '만쿠' 표기)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-700/40 cursor-pointer select-none hover:bg-emerald-900/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={useNaverCoupon}
                      onChange={(e) => handleNaverCouponToggle(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-emerald-600 bg-emerald-950 cursor-pointer accent-emerald-500"
                    />
                    <span className="font-black text-emerald-300 text-[11px] flex items-center gap-1">
                      <span>🟩</span> 네이버 쿠폰 적용 (-2,500원 차감 & '네쿠' 표기)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-purple-300/70 text-[11px]">괄호() 내 안내 문구</label>
                <input type="text" name="notice" value={modalInputs.notice} onChange={handleModalInputChange} className="p-2 mahagonny-input-dark rounded-xl font-bold" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-purple-300/70 text-[11px]">하단 검색용 태그</label>
                <input type="text" name="twitterTag" value={modalInputs.twitterTag} onChange={handleModalInputChange} className="p-2 mahagonny-input-dark rounded-xl font-mono font-bold" />
              </div>
            </div>

            <div className="p-3.5 bg-[#130d29] border-t border-purple-800/40 flex gap-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-purple-950 hover:bg-purple-900 text-purple-300 font-black rounded-xl border border-purple-700/40">취소</button>
              <button onClick={executeFinalCopy} className="flex-1 py-2.5 mahagonny-btn-neon font-black rounded-xl shadow active:scale-95 transition-all">📋 문구 복사</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 2. 교환 모달 */}
      {isExchangeModalOpen && exchangeItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="mahagonny-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col border border-fuchsia-500/50">
            <div className="bg-[#130d29] p-4 text-fuchsia-300 flex justify-between items-center border-b border-purple-800/40">
              <div>
                <h3 className="font-black text-sm flex items-center gap-1">🔄 교환 문구 생성</h3>
                <p className="text-[10px] text-purple-300/70 mt-0.5 font-bold">{exchangeItem.date} {exchangeItem.time} 회차 기준</p>
              </div>
              <button onClick={() => setIsExchangeModalOpen(false)} className="text-xl font-bold text-purple-300 hover:text-white transition-colors">×</button>
            </div>

            <div className="p-4 flex flex-col gap-3 text-xs text-purple-100 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col gap-1">
                <label className="font-black text-purple-300/70 text-[11px]">작품명 및 헤더</label>
                <input type="text" name="musicalName" value={exchangeInputs.musicalName} onChange={handleExchangeInputChange} className="p-2 mahagonny-input-dark rounded-xl font-bold" />
              </div>

              {/* 👤 [저] 정보 영역 */}
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 flex flex-col gap-2">
                <span className="font-black text-fuchsia-300 text-[11px] flex items-center gap-1">
                  <span>👤</span> [저] 내가 가진 표 정보
                </span>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-purple-400">날짜/시간대/출연진</label>
                  <input
                    type="text"
                    name="myDateInfo"
                    value={exchangeInputs.myDateInfo}
                    onChange={handleExchangeInputChange}
                    className="p-1.5 text-[11px] mahagonny-input-dark rounded-lg font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-fuchsia-400 font-bold">좌석 직접 입력</label>
                  <input
                    type="text"
                    name="mySeat"
                    placeholder="예: D열 6-9"
                    value={exchangeInputs.mySeat}
                    onChange={handleExchangeInputChange}
                    className="p-1.5 text-[11px] border border-fuchsia-500 bg-fuchsia-950/50 rounded-lg font-black text-fuchsia-200"
                  />
                </div>
              </div>

              {/* 😇 [천사] 정보 영역 */}
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 flex flex-col gap-2">
                <span className="font-black text-amber-300 text-[11px] flex items-center gap-1">
                  <span>😇</span> [천사] 구하는 표 정보
                </span>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-purple-400 flex justify-between">
                    <span>회차 목록에서 선택하여 추가</span>
                    <span className="text-[9px] text-fuchsia-400/80 font-mono">
                      {searchActor.trim() ? `'${searchActor.trim()}' 회차 (${targetSelectSchedules.length}건)` : `전체 (${targetSelectSchedules.length}건)`}
                    </span>
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={selectedTargetScheduleId}
                      onChange={(e) => setSelectedTargetScheduleId(e.target.value)}
                      className="flex-1 p-1.5 text-[10.5px] mahagonny-input-dark rounded-lg font-bold cursor-pointer"
                    >
                      <option value="">-- {searchActor.trim() ? `'${searchActor.trim()}' 회차 선택` : '구하는 회차 선택'} --</option>
                      {targetSelectSchedules.map(s => {
                        const allActors = getCleanCastString(s);
                        return (
                          <option key={`target-opt-${s.id}`} value={s.id} className="bg-[#120c24] text-purple-200">
                            {s.date} ({s.day}) {formatTimeSimple(s.time)} - {allActors}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddTargetSchedule}
                      className="px-2.5 py-1 mahagonny-btn-neon text-[11px] rounded-lg font-black flex-shrink-0 active:scale-95 transition-all"
                    >
                      ➕ 추가
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-purple-400">구하는 날짜/회차 (직접 작성 및 수정 가능)</label>
                  <textarea
                    rows={3}
                    name="targetDates"
                    placeholder="위 목록에서 선택하거나 자유롭게 입력 (예: 11/6, 13, 21낮,밤)"
                    value={exchangeInputs.targetDates}
                    onChange={handleExchangeInputChange}
                    className="p-1.5 text-[11px] mahagonny-input-dark rounded-lg font-bold resize-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-purple-400">구하는 좌석</label>
                  <input
                    type="text"
                    name="targetSeats"
                    placeholder="예: G-H통로"
                    value={exchangeInputs.targetSeats}
                    onChange={handleExchangeInputChange}
                    className="p-1.5 text-[11px] mahagonny-input-dark rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-purple-300/70 text-[11px]">안내 문구</label>
                <input type="text" name="bottomNote" value={exchangeInputs.bottomNote} onChange={handleExchangeInputChange} className="p-2 mahagonny-input-dark rounded-xl font-bold" />
              </div>
            </div>

            <div className="p-3.5 bg-[#130d29] border-t border-purple-800/40 flex gap-2">
              <button onClick={() => setIsExchangeModalOpen(false)} className="flex-1 py-2.5 bg-purple-950 hover:bg-purple-900 text-purple-300 font-black rounded-xl border border-purple-700/40">취소</button>
              <button onClick={executeExchangeCopy} className="flex-1 py-2.5 mahagonny-btn-neon font-black rounded-xl shadow active:scale-95 transition-all">📋 교환 복사</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 플로팅 좌석/도장판 통합 저장 버튼 */}
      <div className="fixed bottom-6 right-6 z-50 shadow-2xl">
        <button onClick={handleAllSave} className="w-16 h-16 bg-[#180f33] hover:bg-purple-900 active:scale-95 text-fuchsia-400 rounded-full flex flex-col items-center justify-center font-black transition-all border-2 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]" title="모든 좌석 및 도장판 정보 저장">
          <span className="text-xl">💾</span>
          <span className="text-[9px] leading-tight mt-0.5">전체저장</span>
        </button>
      </div>

    </div>
  );
}