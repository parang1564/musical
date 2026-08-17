import { useState, useEffect, useRef, useMemo } from 'react';
import { openDB } from 'idb';
import './anarchist.css';

// 🔗 공지 링크 상수
const FIRST_TICKET_LINK = "https://x.com/mbz_anarchist/status/2085597396302692384?s=20";
const REVISIT_BENEFIT_LINK = "https://x.com/mbz_anarchist/status/2085597121311633728?s=20";
const EVENT_NOTICE_LINK = "https://x.com/mbz_anarchist/status/2087736240338776409/photo/1";
const SEAT_MAP_NOTICE_LINK = "https://x.com/mbz_anarchist/status/2085596842814013917?s=20";

// 🎟️ 티켓 원가 및 할인 계산 데이터 (원가 77,000원 + 예매 수수료 2,000원)
const TICKET_ORIGIN_PRICE = 77000;
const TICKET_FEE = 2000;

const DISCOUNT_OPTIONS = {
  "재관람할인 30%": { rate: 0.3, label: "재관람할인 30%" },
  "프리뷰할인 50%": { rate: 0.5, label: "프리뷰할인 50%" },
  "40% 할인권": { rate: 0.4, label: "40% 할인권" },
};

// 할인 계산 헬퍼 함수
const calcDiscountPrice = (discountKey) => {
  const option = DISCOUNT_OPTIONS[discountKey] || DISCOUNT_OPTIONS["재관람할인 30%"];
  const discounted = TICKET_ORIGIN_PRICE * (1 - option.rate) + TICKET_FEE;
  return `${discounted.toLocaleString()}원`;
};

// 🎁 일자별 이벤트 매핑 함수
const getEventForDate = (dateStr) => {
  if (dateStr >= "09.15" && dateStr <= "09.20") {
    return { name: "프리뷰", color: "bg-amber-200 text-amber-950 border-amber-400 font-bold", link: EVENT_NOTICE_LINK, isTriple: false };
  }
  if (dateStr >= "09.22" && dateStr <= "09.27") {
    return { name: "커튼콜 & 트리플 적립", color: "bg-stone-800 text-amber-300 border-stone-900 font-bold", link: EVENT_NOTICE_LINK, isTriple: true };
  }
  if ((dateStr >= "09.29" && dateStr <= "09.30") || (dateStr >= "10.01" && dateStr <= "10.05")) {
    return { name: "스페셜 커튼콜 & 쿠폰팩 증정", color: "bg-red-700 text-white border-red-800 font-bold", link: EVENT_NOTICE_LINK, isTriple: false };
  }
  return null;
};

// 📅 9월 ~ 10월 캐스팅 스케줄 기본 데이터
const defaultInitialData = [
  { id: 1, month: 9, date: "09.15", day: "화", time: "20:00", actor1: "정재환", actor2: "진호", mainActor: "김도빈", seat: "", cardTarget: 1 },
  { id: 2, month: 9, date: "09.16", day: "수", time: "20:00", actor1: "박좌헌", actor2: "박준형", mainActor: "이진혁", seat: "", cardTarget: 1 },
  { id: 3, month: 9, date: "09.17", day: "목", time: "20:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "", cardTarget: 1 },
  { id: 4, month: 9, date: "09.18", day: "금", time: "20:00", actor1: "정재환", actor2: "박주혁", mainActor: "김도빈", seat: "", cardTarget: 1 },
  { id: 5, month: 9, date: "09.19", day: "토", time: "15:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "", cardTarget: 1 },
  { id: 6, month: 9, date: "09.19", day: "토", time: "19:00", actor1: "박좌헌", actor2: "박주혁", mainActor: "이진혁", seat: "", cardTarget: 1 },
  { id: 7, month: 9, date: "09.20", day: "일", time: "14:00", actor1: "정재환", actor2: "진호", mainActor: "김도빈", seat: "", cardTarget: 1 },
  { id: 8, month: 9, date: "09.20", day: "일", time: "18:00", actor1: "김재한", actor2: "박준형", mainActor: "이진혁", seat: "", cardTarget: 1 },
  { id: 9, month: 9, date: "09.22", day: "화", time: "20:00", actor1: "박좌헌", actor2: "박주혁", mainActor: "이진혁", seat: "", cardTarget: 1 },
  { id: 10, month: 9, date: "09.23", day: "수", time: "16:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "", cardTarget: 1 },
  { id: 11, month: 9, date: "09.23", day: "수", time: "20:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "", cardTarget: 1 },
  { id: 12, month: 9, date: "09.24", day: "목", time: "14:00", actor1: "정재환", actor2: "진호", mainActor: "김도빈", seat: "", cardTarget: 1 },
  { id: 13, month: 9, date: "09.24", day: "목", time: "18:00", actor1: "김재한", actor2: "박준형", mainActor: "이진혁", seat: "", cardTarget: 1 },
  { id: 14, month: 9, date: "09.26", day: "토", time: "14:00", actor1: "정재환", actor2: "박주혁", mainActor: "김도빈", seat: "", cardTarget: 1 },
  { id: 15, month: 9, date: "09.26", day: "토", time: "18:00", actor1: "박좌헌", actor2: "박준형", mainActor: "김도빈", seat: "", cardTarget: 1 },
  { id: 16, month: 9, date: "09.27", day: "일", time: "14:00", actor1: "정재환", actor2: "박준형", mainActor: "이진혁", seat: "", cardTarget: 1 },
  { id: 17, month: 9, date: "09.27", day: "일", time: "18:00", actor1: "김재한", actor2: "진호", mainActor: "이진혁", seat: "", cardTarget: 1 },
  { id: 18, month: 9, date: "09.29", day: "화", time: "20:00", actor1: "정재환", actor2: "진호", mainActor: "김도빈", seat: "", cardTarget: 1 },
  { id: 19, month: 9, date: "09.30", day: "수", time: "16:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "", cardTarget: 1 },
  { id: 20, month: 9, date: "09.30", day: "수", time: "20:00", actor1: "정재환", actor2: "박준형", mainActor: "이진혁", seat: "", cardTarget: 1 },
  { id: 21, month: 10, date: "10.01", day: "목", time: "20:00", actor1: "박좌헌", actor2: "박주혁", mainActor: "최호승", seat: "", cardTarget: 1 },
  { id: 22, month: 10, date: "10.02", day: "금", time: "20:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "", cardTarget: 1 },
  { id: 23, month: 10, date: "10.03", day: "토", time: "15:00", actor1: "정재환", actor2: "박준형", mainActor: "최호승", seat: "", cardTarget: 1 },
  { id: 24, month: 10, date: "10.03", day: "토", time: "19:00", actor1: "박좌헌", actor2: "박주혁", mainActor: "최호승", seat: "", cardTarget: 1 },
  { id: 25, month: 10, date: "10.04", day: "일", time: "14:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "", cardTarget: 1 },
  { id: 26, month: 10, date: "10.04", day: "일", time: "18:00", actor1: "김재한", actor2: "박준형", mainActor: "이진혁", seat: "", cardTarget: 1 },
  { id: 27, month: 10, date: "10.05", day: "월", time: "14:00", actor1: "박좌헌", actor2: "진호", mainActor: "김도빈", seat: "", cardTarget: 1 },
  { id: 28, month: 10, date: "10.05", day: "월", time: "18:00", actor1: "정재환", actor2: "박주혁", mainActor: "김도빈", seat: "", cardTarget: 1 }
];

// 🪑 좌석 배치도 (B2F 1층 / B1F 2층)
const floor1Rows = {
  A: [22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  B: [22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  C: [null, null, null, null, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, null, null, null, null],
  D: [22, 21, 20, 19, null, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, null, 4, 3, 2, 1],
  E: [null, 21, 20, 19, 18, null, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, null, 4, 3, 2, 1],
  F: [22, 21, 20, 19, null, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, null, 4, 3, 2, 1],
  G: [22, 21, 20, 19, null, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, null, 4, 3, 2, 1],
  H: [22, 21, 20, 19, null, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, null, 4, 3, 2, 1],
  I: [22, 21, 20, 19, null, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, null, 4, 3, 2, 1],
  J: [22, 21, 20, 19, null, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, null, 4, 3, 2, 1],
  K: [22, 21, 20, 19, null, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, null, 4, 3, 2, 1],
  L: [null, null, null, null, 14, 13, 12, 11, null, 10, 9, 8, null, null, 7, 6, 5, null, 4, 3, 2, 1],
  M: [null, null, 16, 15, 14, 13, 12, 11, 10, 9, null, null, null, null, 8, 7, 6, 5, 4, 3, 2, 1]
};

const floor2Rows = {
  N: [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  O: [null, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  P: [null, null, null, null, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  Q: [null, null, 20, 19, 18, 17, null, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
};

const DB_NAME = 'MusicalSchedulerDB_Anarchist_vBtnTextUpdated';
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

export default function Anarchist() {
  const [schedules, setSchedules] = useState([]);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    month: 9, date: '', day: '', time: '20:00', actor1: '', actor2: '', mainActor: '이진혁', seat: '', cardTarget: 1
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchActor, setSearchActor] = useState('이진혁');

  const [cardBonuses, setCardBonuses] = useState({});
  const [extraCards, setExtraCards] = useState(0);
  const [cardCollapsedMap, setCardCollapsedMap] = useState({});
  const [monthCollapsedMap, setMonthCollapsedMap] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalInputs, setModalInputs] = useState({
    musicalName: '뮤지컬 아나키스트', 
    transferSeat: '', 
    discountType: '재관람할인 30%',
    price: calcDiscountPrice('재관람할인 30%'),
    notice: '',
    twitterTag: '@YeonMyuticket'
  });

  const formatSeatInput = (val) => {
    let clean = val.toUpperCase().trim().replace(/\s+/g, '').replace(/-/g, '');
    if (!clean) return '';
    const match = clean.match(/^([A-Q])(\d+)$/);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'month' || name === 'cardTarget' ? Number(value) : (name === 'seat' ? formatSeatInput(value) : value)
    }));
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
        if (item.id === targetId) {
          return { ...item, cardTarget: targetCardNum };
        }
        if (idx > targetIndex && (!item.seat || item.seat.trim() === "")) {
          return { ...item, cardTarget: targetCardNum };
        }
        return item;
      });
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.actor1 || !formData.actor2 || !formData.mainActor) {
      alert('모든 필수 정보를 입력해 주세요!');
      return;
    }

    const db = await initDB();
    if (editingId) {
      const updatedItem = { ...formData, id: editingId };
      await db.put(STORE_NAME, updatedItem);
      setEditingId(null);
      alert('스케줄이 수정되었습니다! ✏️');
    } else {
      const newItem = { ...formData, id: Date.now() };
      await db.put(STORE_NAME, newItem);
      alert('새로운 스케줄이 추가되었습니다! 📅');
    }

    setFormData({ month: 9, date: '', day: '', time: '20:00', actor1: '', actor2: '', mainActor: '이진혁', seat: '', cardTarget: 1 });
    setShowForm(false);
    loadInitialData();
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setFormData({ ...item, cardTarget: item.cardTarget || 1 });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScheduleDelete = async (id) => {
    if (window.confirm('정말 이 회차 스케줄을 삭제하시겠습니까?')) {
      const db = await initDB();
      await db.delete(STORE_NAME, id);
      alert('스케줄이 삭제되었습니다.');
      loadInitialData();
    }
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
    alert('모든 스케줄 및 도장판 정보가 저장되었습니다! 💾');
  };

  const handleExportFile = () => {
    if (schedules.length === 0) {
      alert('백업할 데이터가 없습니다.');
      return;
    }
    const backupObject = { 
      schedules, 
      cardBonuses, 
      extraCards,
      cardCollapsedMap,
      monthCollapsedMap
    };
    const dataStr = JSON.stringify(backupObject, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `anarchist_backup_${new Date().toISOString().split('T')[0]}.json`;
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
        if (!Array.isArray(scheduleList)) throw new Error('올바른 형식이 아닙니다.');

        if (window.confirm('파일을 불러오면 현재 기록이 덮어써집니다. 진행하시겠습니까?')) {
          const db = await initDB();
          await db.clear(STORE_NAME);
          for (const item of scheduleList) {
            await db.put(STORE_NAME, { ...item, seat: formatSeatInput(item.seat), cardTarget: item.cardTarget || 1 });
          }

          if (importedData.cardBonuses !== undefined) {
            await db.put(SETTING_STORE, { key: 'cardBonuses', value: importedData.cardBonuses });
          }
          if (importedData.extraCards !== undefined) {
            await db.put(SETTING_STORE, { key: 'extraCards', value: importedData.extraCards });
          }
          if (importedData.cardCollapsedMap !== undefined) {
            await db.put(SETTING_STORE, { key: 'cardCollapsedMap', value: importedData.cardCollapsedMap });
          }
          if (importedData.monthCollapsedMap !== undefined) {
            await db.put(SETTING_STORE, { key: 'monthCollapsedMap', value: importedData.monthCollapsedMap });
          }

          alert('성공적으로 스케줄 및 도장판 데이터를 복구했습니다! 📂');
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
    if (window.confirm('정말 최초 기본 상태로 되돌리시겠습니까?')) {
      const db = await initDB();
      await db.clear(STORE_NAME);
      await db.clear(SETTING_STORE);
      setCardBonuses({});
      setExtraCards(0);
      setCardCollapsedMap({});
      setMonthCollapsedMap({});
      loadInitialData();
      alert('초기화가 완료되었습니다.');
    }
  };

  const handleOpenCopyModal = (item) => {
    setSelectedItem(item);
    const eventInfo = getEventForDate(item.date);
    
    const defaultDiscount = (item.date >= "09.15" && item.date <= "09.20") 
      ? "프리뷰할인 50%" 
      : "재관람할인 30%";

    setModalInputs(prev => ({
      ...prev,
      transferSeat: item.seat || '',
      discountType: defaultDiscount,
      price: calcDiscountPrice(defaultDiscount),
      notice: eventInfo ? eventInfo.name : '증빙 필요, 찾아드릴 수 있습니다'
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
      price: calcDiscountPrice(selectedDiscount)
    }));
  };

  const executeFinalCopy = () => {
    if (!selectedItem) return;
    const item = selectedItem;
    const finalSeat = modalInputs.transferSeat.trim() === "" ? "미입력 좌석" : modalInputs.transferSeat;

    const [monthStr, dayStr] = item.date.split('.');
    const formattedDate = `${parseInt(monthStr, 10)}월 ${parseInt(dayStr, 10)}일`;
    const castingList = `${item.actor1} ${item.actor2} ${item.mainActor}`;
    const noticeText = modalInputs.notice.trim() ? ` (${modalInputs.notice})` : '';

    const copyText = `${modalInputs.musicalName} 양도\n\n${formattedDate} ${item.day}요일 ${item.time}\n${castingList}\n${finalSeat}\n${modalInputs.discountType} ${modalInputs.price}${noticeText}\n${modalInputs.twitterTag}`;

    navigator.clipboard.writeText(copyText)
      .then(() => {
        alert(`${item.date} 회차의 양도 문구가 클립보드에 복사되었습니다! 📋`);
        setIsModalOpen(false);
      })
      .catch(err => alert("복사 실패: " + err));
  };

  const watchedShows = schedules.filter(item => item.seat && item.seat.trim() !== "");
  const leeJinHyukCount = watchedShows.filter(item => item.mainActor === "이진혁").length;
  const totalLeeJinHyuk = schedules.filter(item => item.mainActor === "이진혁").length;

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
      const totalInThisCard = earnedStamps + thisBonus;

      cards.push({
        cardNumber: c,
        shows: cardShows,
        stamps: totalInThisCard,
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
      const pairKey = `${item.actor1} · ${item.actor2} · ${item.mainActor}`;
      if (!map[pairKey]) {
        map[pairKey] = {
          key: pairKey,
          actor1: item.actor1,
          actor2: item.actor2,
          mainActor: item.mainActor,
          total: 0,
          watched: 0
        };
      }
      map[pairKey].total += 1;
      if (item.seat && item.seat.trim() !== '') {
        map[pairKey].watched += 1;
      }
    });

    const allPairs = Object.values(map);
    const query = searchActor.trim();
    if (!query) {
      return allPairs.sort((a, b) => b.total - a.total);
    }

    return allPairs
      .filter(p => p.actor1.includes(query) || p.actor2.includes(query) || p.mainActor.includes(query))
      .sort((a, b) => b.total - a.total);
  }, [schedules, searchActor]);

  const filteredSchedules = schedules.filter(item => {
    if (!searchActor.trim()) return true;
    const query = searchActor.trim();
    return (
      item.actor1.includes(query) ||
      item.actor2.includes(query) ||
      item.mainActor.includes(query)
    );
  });

  const renderRowBlock = (rowConfigMap) => {
    return Object.keys(rowConfigMap).map(row => (
      <div key={row} className="flex items-center gap-0.5 md:gap-1 justify-center">
        <span className="w-4 md:w-5 font-black text-amber-500/80 text-center mr-0.5 md:mr-1 text-[11px] md:text-[12px] font-mono">{row}</span>
        
        {rowConfigMap[row].map((seatNumber, index) => {
          if (seatNumber === null) {
            return <div key={`space-${row}-${index}`} className="w-[10px] md:w-[15px] h-[18px] md:h-[20px] flex-shrink-0 bg-transparent" />;
          }

          const seatKey = `${row}-${seatNumber}`;
          const matchingShows = schedules.filter(s => s.seat === seatKey);
          const visitCount = matchingShows.length;
          
          let bgClass = "bg-stone-800 text-stone-400 border border-stone-700/60";
          if (visitCount === 1) bgClass = "bg-[#F3B329] text-stone-950 font-black border border-amber-500 shadow-sm";
          else if (visitCount === 2) bgClass = "bg-emerald-600 text-white font-bold border border-emerald-500";
          else if (visitCount === 3) bgClass = "bg-orange-600 text-white font-bold border border-orange-500";
          else if (visitCount >= 4) bgClass = "bg-red-700 text-white font-black border border-red-600 ring-1 ring-red-400";

          return (
            <div 
              key={`seat-${seatKey}`} 
              className={`w-[17px] md:w-[20px] h-[17px] md:h-[20px] text-[8px] md:text-[9.5px] rounded flex items-center justify-center font-bold shadow-sm flex-shrink-0 cursor-default select-none ${bgClass}`} 
              title={`${seatKey} (정산기록: ${visitCount}회)`}
            >
              <span className="leading-none text-center block w-full tabular-nums">{seatNumber}</span>
            </div>
          );
        })}
        
        <span className="w-4 md:w-5 font-black text-amber-500/80 text-center ml-0.5 md:ml-1 text-[11px] md:text-[12px] font-mono">{row}</span>
      </div>
    ));
  };

  return (
    <div className="anarchist-wrapper p-3 md:p-6 lg:p-8 flex flex-col items-center max-w-4xl mx-auto pb-28 selection:bg-stone-900 selection:text-[#F3B329]">
      
      {/* 🎭 포스터 스타일 상단 헤더 (버튼 문구: 1차, 좌석, 재관카드, 추가) */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center gap-3 mb-5 bg-[#FFF9E6] p-4 md:p-5 rounded-2xl shadow-md border-2 border-stone-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-xl shadow-inner border border-amber-400">
            🚲
          </div>
          <div>
            <span className="text-[10px] tracking-widest font-black text-red-700 uppercase block mb-0.5">MUSICAL ANARCHIST</span>
            <h1 className="text-xl md:text-2xl font-black text-stone-950 tracking-tighter">
              아나키스트
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={FIRST_TICKET_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1 border border-red-900 transition-all active:scale-95"
          >
            <span>🎟️</span> 1차
          </a>
          <a
            href={SEAT_MAP_NOTICE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-[#F3B329] hover:bg-[#e0a21f] text-stone-950 rounded-xl text-xs font-black shadow-sm flex items-center gap-1 border border-stone-900 transition-all active:scale-95"
          >
            <span>🪑</span> 좌석
          </a>
          <a
            href={REVISIT_BENEFIT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 border border-stone-950 transition-all active:scale-95"
          >
            <span>🎁</span> 재관카드
          </a>
          <button 
            onClick={() => { setShowForm(!showForm); setEditingId(null); }} 
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl text-xs font-black shadow-sm border border-stone-900 transition-all active:scale-95"
          >
            {showForm ? '닫기' : '➕ 추가'}
          </button>
        </div>
      </header>

      {/* ➕ 스케줄 추가 / 수정 입력 폼 */}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="w-full bg-[#FFFDF5] border-2 border-stone-900 rounded-2xl p-5 mb-5 flex flex-col gap-3.5 shadow-md animate-in fade-in">
          <h3 className="font-black text-stone-900 text-sm flex items-center gap-1.5">
            <span>⚙️</span> {editingId ? '스케줄 정보 수정하기' : '새로운 회차 등록하기'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <select name="month" value={formData.month} onChange={handleInputChange} className="p-2.5 border-2 border-stone-900 rounded-xl bg-white font-bold text-stone-800">
              <option value={9}>9월</option>
              <option value={10}>10월</option>
            </select>
            <input type="text" name="date" placeholder="날짜 (예: 09.15)" value={formData.date} onChange={handleInputChange} className="p-2.5 border-2 border-stone-900 rounded-xl bg-white font-bold" />
            <input type="text" name="day" placeholder="요일" value={formData.day} onChange={handleInputChange} className="p-2.5 border-2 border-stone-900 rounded-xl bg-white font-bold" />
            <input type="text" name="time" placeholder="시간 (예: 20:00)" value={formData.time} onChange={handleInputChange} className="p-2.5 border-2 border-stone-900 rounded-xl bg-white font-bold" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <input type="text" name="mainActor" placeholder="덕형 (주연)" value={formData.mainActor} onChange={handleInputChange} className="p-2.5 border-2 border-amber-600 bg-amber-50 rounded-xl font-black text-amber-950" />
            <input type="text" name="actor1" placeholder="자경" value={formData.actor1} onChange={handleInputChange} className="p-2.5 border-2 border-stone-900 rounded-xl bg-white font-bold" />
            <input type="text" name="actor2" placeholder="무혁" value={formData.actor2} onChange={handleInputChange} className="p-2.5 border-2 border-stone-900 rounded-xl bg-white font-bold" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-black text-red-800 text-[11px]">📍 관람 기록용 좌석 (배치도 자동 반영)</label>
              <input type="text" name="seat" placeholder="예: A11 이나 B5 처럼 하이픈 없이 적어도 자동인식" value={formData.seat} onChange={handleInputChange} className="p-2.5 border-2 border-red-700 rounded-xl bg-red-50/50 font-black text-red-900 uppercase" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-black text-amber-800 text-[11px]">🎫 적립할 도장판 번호</label>
              <select name="cardTarget" value={formData.cardTarget || 1} onChange={handleInputChange} className="p-2.5 border-2 border-stone-900 rounded-xl bg-white font-bold text-stone-900">
                {Array.from({ length: Math.max(3, totalCardBoards) }).map((_, i) => (
                  <option key={`opt-form-${i+1}`} value={i+1}>{i+1}번 도장판에 적립</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 text-xs mt-1">
            <button type="submit" className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-[#F3B329] font-black rounded-xl shadow transition-all border border-stone-950">
              {editingId ? '수정 완료하기' : '이 스케줄 저장하기'}
            </button>
          </div>
        </form>
      )}

      {/* 1️⃣ [배우이름 입력] 🔍 배우 검색창 */}
      <div className="w-full relative mb-4">
        <input 
          type="text" 
          placeholder="🔍 출연 배우 이름으로 필터링 (예: 이진혁, 정재환, 김도빈, 김재한)" 
          value={searchActor}
          onChange={(e) => setSearchActor(e.target.value)}
          className="w-full p-3.5 text-xs border-2 border-stone-900 rounded-2xl bg-[#FFFDF5] shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold placeholder:text-stone-400"
        />
        {searchActor && (
          <button onClick={() => setSearchActor('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-stone-600 hover:text-stone-950 bg-stone-200 rounded-full w-5 h-5 flex items-center justify-center pb-0.5">×</button>
        )}
      </div>

      {/* 2️⃣ [도장판별 적립] 🎫 재관람 혜택 카드 */}
      <section className="w-full bg-[#FFF9E6] border-2 border-stone-900 rounded-2xl p-4 shadow-md mb-5">
        
        <div className="flex items-center justify-between gap-2.5 mb-3 border-b-2 border-stone-900/10 pb-3">
          <div>
            <h2 className="font-black text-xs md:text-sm text-stone-950 flex items-center gap-1.5">
              <span>🎫</span> 도장판별 적립 & 혜택 매핑
            </h2>
            <p className="text-[10px] text-stone-500 font-bold mt-0.5">
              각 도장판별로 개별 접기/펼치기가 가능하며 상태가 자동 기억됩니다.
            </p>
          </div>

          <button 
            onClick={handleAddExtraCard}
            className="px-2.5 py-1.5 bg-[#F3B329] hover:bg-[#e0a21f] text-stone-950 text-[10.5px] font-black rounded-xl border border-stone-900 shadow-sm transition-all active:scale-95 flex-shrink-0"
          >
            ➕ 새 도장판 추가
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {cardBoardStats.map((board) => (
            <div key={`stamp-card-${board.cardNumber}`} className="bg-[#FFFDF5] border-2 border-stone-900/70 rounded-xl p-3 shadow-sm transition-all">
              
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${board.isCollapsed ? '' : 'mb-2.5 pb-2 border-b border-stone-200'}`}>
                
                <div 
                  onClick={() => toggleSingleCardCollapse(board.cardNumber)}
                  className="flex items-center gap-2 flex-wrap cursor-pointer select-none group"
                >
                  <span className="px-2 py-0.5 bg-stone-900 text-[#F3B329] text-[10.5px] font-black rounded-md">
                    {board.cardNumber}번
                  </span>
                  <span className="text-xs font-black text-stone-900 group-hover:text-amber-700 transition-colors">
                    {board.cardNumber}번 도장판 ({board.stamps} / 9)
                  </span>
                  {board.bonus > 0 && (
                    <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                      추가 +{board.bonus}
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400 font-bold ml-1">
                    {board.isCollapsed ? '▶ 펼치기' : '▼ 접기'}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex items-center bg-white border border-stone-900/40 rounded-lg px-1.5 py-0.5 gap-1 text-xs">
                    <span className="text-[9.5px] font-bold text-stone-500">추가</span>
                    <button onClick={() => handleCardBonusChange(board.cardNumber, -1)} className="w-4 h-4 bg-stone-200 hover:bg-stone-300 text-stone-900 rounded font-black flex items-center justify-center text-[10px]">-</button>
                    <span className="font-black text-amber-900 px-0.5 text-[11px]">{board.bonus}</span>
                    <button onClick={() => handleCardBonusChange(board.cardNumber, 1)} className="w-4 h-4 bg-amber-400 hover:bg-amber-500 text-stone-950 rounded font-black flex items-center justify-center text-[10px]">+</button>
                  </div>

                  {board.cardNumber > 1 && (
                    <button 
                      onClick={handleRemoveExtraCard} 
                      className="text-[9px] font-bold text-red-600 hover:underline pl-1"
                    >
                      제거
                    </button>
                  )}
                </div>
              </div>

              {!board.isCollapsed && (
                <div className="animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[10px]">
                    <span className="font-black text-stone-500">배정된 회차:</span>
                    {board.shows.length === 0 ? (
                      <span className="text-stone-400 font-medium">아직 배정된 회차가 없습니다 (스케줄에서 선택)</span>
                    ) : (
                      board.shows.map(s => {
                        const event = getEventForDate(s.date);
                        return (
                          <span key={`mapped-tag-${s.id}`} className="bg-stone-100 text-stone-800 border border-stone-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            {s.date}
                            <span className={`font-black text-[9px] ${event && event.isTriple ? 'text-purple-700' : 'text-stone-500'}`}>
                              ({event && event.isTriple ? '+3' : '+1'})
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    
                    <div className={`p-2.5 rounded-lg border-2 flex items-center justify-between transition-all ${
                      board.stamps >= 3 
                        ? 'bg-[#FFF2C9] border-amber-500 shadow-sm' 
                        : 'bg-white/80 border-stone-300 opacity-80'
                    }`}>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-stone-500 uppercase">STEP 1</span>
                        <span className="font-black text-stone-900 text-xs">3회 적립</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-950 block text-[11px]">40% 할인권 2매</span>
                        <span className={`text-[9px] font-extrabold ${board.stamps >= 3 ? 'text-emerald-700' : 'text-stone-400'}`}>
                          {board.stamps >= 3 ? '✓ 달성 완료' : `${3 - board.stamps}개 남음`}
                        </span>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-lg border-2 flex items-center justify-between transition-all ${
                      board.stamps >= 6 
                        ? 'bg-[#FFF2C9] border-amber-500 shadow-sm' 
                        : 'bg-white/80 border-stone-300 opacity-80'
                    }`}>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-stone-500 uppercase">STEP 2</span>
                        <span className="font-black text-stone-900 text-xs">6회 적립</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-950 block text-[11px]">지정 폴라로이드 1매</span>
                        <span className={`text-[9px] font-extrabold ${board.stamps >= 6 ? 'text-emerald-700' : 'text-stone-400'}`}>
                          {board.stamps >= 6 ? '✓ 달성 완료' : `${6 - board.stamps}개 남음`}
                        </span>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-lg border-2 flex items-center justify-between transition-all ${
                      board.stamps >= 9 
                        ? 'bg-[#FFF2C9] border-amber-500 shadow-sm' 
                        : 'bg-white/80 border-stone-300 opacity-80'
                    }`}>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-stone-500 uppercase">STEP 3</span>
                        <span className="font-black text-stone-900 text-xs">9회 적립</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-950 block text-[11px]">전캐스트 실황 OST</span>
                        <span className={`text-[9px] font-extrabold ${board.stamps >= 9 ? 'text-emerald-700' : 'text-stone-400'}`}>
                          {board.stamps >= 9 ? '✓ 달성 완료' : `${9 - board.stamps}개 남음`}
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

      {/* 3️⃣ [월별 스케줄] 📅 월별 스케줄 리스트 */}
      <main className="w-full flex flex-col gap-5 text-sm mb-8">
        {[9, 10].map(m => {
          const monthSchedules = filteredSchedules.filter(item => item.month === m);
          if (monthSchedules.length === 0) return null;
          const isMonthCollapsed = Boolean(monthCollapsedMap[m]);

          return (
            <div key={m} className="bg-[#FFFDF5] border-2 border-stone-900 rounded-2xl overflow-hidden shadow-md transition-all">
              
              <div 
                onClick={() => toggleMonthCollapse(m)}
                className="p-3 bg-stone-900 text-[#F3B329] font-black text-center text-xs tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer select-none hover:bg-stone-800 transition-colors"
                title={`${m}월 스케줄 접기/펼치기`}
              >
                <span>✦</span> 
                {m}월 회차 스케줄 ({monthSchedules.length}회) 
                <span className="text-[10px] text-amber-200/90 font-bold ml-1">
                  {isMonthCollapsed ? '▶ 펼치기' : '▼ 접기'}
                </span>
                <span>✦</span>
              </div>

              {!isMonthCollapsed && (
                <div className="w-full select-none animate-in fade-in duration-150">
                  <div className="divide-y divide-stone-900/10">
                    {monthSchedules.map((item) => {
                      const eventInfo = getEventForDate(item.date);
                      const isWatched = item.seat && item.seat.trim() !== "";

                      return (
                        <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-[#FFF5D6] transition-colors">
                          
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="flex flex-col items-start flex-shrink-0">
                              <span className="font-black text-stone-900 text-xs tabular-nums">{item.date}</span>
                              <span className="text-[9px] text-stone-600 bg-stone-200/80 px-1 rounded mt-0.5 tabular-nums font-bold">{item.time}</span>
                            </div>

                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-stone-800 text-[11px] sm:text-xs font-bold truncate" title={`자경: ${item.actor1}`}>{item.actor1}</span>
                                <span className="text-stone-800 text-[11px] sm:text-xs font-bold truncate" title={`무혁: ${item.actor2}`}>{item.actor2}</span>
                                <span className={`text-[11px] sm:text-xs font-black ${item.mainActor === '이진혁' ? 'text-red-700' : 'text-stone-900'}`} title={`덕형: ${item.mainActor}`}>
                                  {item.mainActor}
                                </span>
                              </div>

                              {eventInfo && (
                                <div>
                                  <a
                                    href={eventInfo.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-block px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] border transition-all hover:opacity-85 leading-tight ${eventInfo.color}`}
                                    title={`${eventInfo.name} (클릭 시 공지 이동)`}
                                  >
                                    🎁 {eventInfo.name}
                                  </a>
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
                              className="w-11 sm:w-14 p-1 text-[11px] border-2 border-stone-800 text-stone-900 bg-white rounded-lg text-center font-black uppercase placeholder:font-normal placeholder:text-[9px] h-7 focus:outline-none focus:border-amber-500" 
                            />

                            <select
                              value={item.cardTarget || 1}
                              onChange={(e) => handleCardTargetChange(item.id, e.target.value)}
                              disabled={!isWatched}
                              className={`p-1 text-[10px] border-2 rounded-lg font-black h-7 focus:outline-none ${
                                isWatched 
                                  ? 'border-amber-500 bg-[#FFF2C9] text-stone-950 cursor-pointer' 
                                  : 'border-stone-200 bg-stone-100 text-stone-400 opacity-60'
                              }`}
                              title={isWatched ? '적립할 도장판 번호를 선택하세요' : '좌석 입력 시 도장판에 자동 매핑됩니다'}
                            >
                              {Array.from({ length: Math.max(3, totalCardBoards) }).map((_, i) => (
                                <option key={`card-opt-${i+1}`} value={i+1}>{i+1}번</option>
                              ))}
                            </select>

                            <button onClick={() => handleOpenCopyModal(item)} className="px-1.5 sm:px-2 py-1 text-[10px] anarchist-btn-copy rounded-lg h-7 flex items-center justify-center">양도</button>
                            <button onClick={() => handleEditStart(item)} className="px-1.5 sm:px-2 py-1 text-[10px] bg-stone-700 hover:bg-stone-800 text-white rounded-lg font-bold h-7 flex items-center justify-center">수정</button>
                            <button onClick={() => handleScheduleDelete(item.id)} className="px-1.5 sm:px-2 py-1 text-[10px] bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold h-7 flex items-center justify-center">삭제</button>
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

      {/* 4️⃣ [총 관람 합계] 📊 관람 통계 대시보드 */}
      <section className="w-full bg-[#FFF9E6] border-2 border-stone-900 rounded-2xl shadow-md p-4 flex justify-around text-center mb-5">
        <div className="flex-1 border-r-2 border-stone-900/10">
          <p className="text-xs font-black text-amber-700">이진혁 (덕형) 관람</p>
          <p className="text-2xl font-black mt-1 text-stone-950">{leeJinHyukCount} <span className="text-xs font-bold text-stone-500">/ {totalLeeJinHyuk}회</span></p>
        </div>
        <div className="flex-1">
          <p className="text-xs font-black text-red-700">총 관람합계</p>
          <p className="text-2xl font-black mt-1 text-stone-950">{watchedShows.length} <span className="text-xs font-bold text-stone-500">/ {schedules.length}회</span></p>
        </div>
      </section>

      {/* 5️⃣ [페어 현황] 👥 페어별 회차 현황 카드 */}
      <section className="w-full bg-[#FFF9E6] border-2 border-stone-900 rounded-2xl p-4 shadow-md mb-5">
        <div className="flex items-center justify-between mb-3 border-b-2 border-stone-900/10 pb-2">
          <h2 className="font-black text-xs md:text-sm text-stone-950 flex items-center gap-1.5">
            <span>👥</span> {searchActor ? `'${searchActor}' 포함 페어 현황` : '전체 페어별 현황'}
            <span className="text-stone-500 text-[11px] font-bold">({pairStats.length}개 조합)</span>
          </h2>
          <span className="text-[10px] text-stone-500 font-bold">자경 · 무혁 · 덕형</span>
        </div>

        {pairStats.length === 0 ? (
          <div className="p-4 text-center text-xs text-stone-500 bg-stone-100/50 rounded-xl">
            검색어와 일치하는 페어가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {pairStats.map((pair) => (
              <div 
                key={pair.key} 
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  pair.mainActor === '이진혁' 
                    ? 'bg-[#FFF2C9] border-amber-400 hover:bg-[#ffeaa7]' 
                    : 'bg-white/80 border-stone-300 hover:bg-white'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className={`font-black ${pair.mainActor === '이진혁' ? 'text-amber-950' : 'text-stone-800'}`}>
                    {pair.key}
                  </span>
                </div>
                <div className="text-right pl-2">
                  <span className={`font-black text-sm tabular-nums ${pair.watched > 0 ? 'text-red-700' : 'text-stone-700'}`}>
                    {pair.watched}
                  </span>
                  <span className="text-[11px] font-bold text-stone-400 tabular-nums"> / {pair.total}회</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6️⃣ [좌석 배치도] 🪑 실시간 좌석 배치도 */}
      <section className="w-full bg-[#1C1A17] text-stone-100 rounded-3xl p-4 md:p-6 flex flex-col items-center shadow-xl mb-6 border-2 border-stone-900">
        
        <div className="w-full flex justify-between items-center mb-3">
          <div className="py-1 bg-[#F3B329] px-4 text-stone-950 rounded-md font-black tracking-widest text-[11px] shadow">S T A G E</div>
          <span className="text-[10px] text-amber-400 font-bold">좌석 배치 현황 (관람 회차별 자동 집계)</span>
        </div>
        
        <div className="flex gap-2.5 justify-center items-center mb-4 text-[10px] bg-stone-900 px-3 py-2 rounded-xl text-stone-300 font-bold w-full flex-wrap border border-stone-800">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#F3B329] rounded-sm"></div>1회</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-600 rounded-sm"></div>2회</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-orange-600 rounded-sm"></div>3회</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-700 rounded-sm"></div>4회 이상</div>
        </div>

        <div className="w-full overflow-x-auto pb-2 flex flex-col gap-4">
          
          {/* B2F 객석 1층 */}
          <div className="flex flex-col gap-1 w-full min-w-[580px] select-none p-3.5 bg-[#12110F] rounded-2xl border border-stone-800">
            <div className="text-[11px] font-black text-[#F3B329] mb-1.5 pl-1">B2F 객석 1층</div>
            {renderRowBlock(floor1Rows)}
          </div>

          {/* B1F 객석 2층 */}
          <div className="flex flex-col gap-1 w-full min-w-[580px] select-none p-3.5 bg-[#12110F] rounded-2xl border border-stone-800">
            <div className="text-[11px] font-black text-[#F3B329] mb-1.5 pl-1">B1F 객석 2층</div>
            {renderRowBlock(floor2Rows)}
          </div>

        </div>
      </section>

      {/* 💾 백업 & 복원 카드 */}
      <div className="w-full bg-[#FFF9E6] border-2 border-stone-900 rounded-2xl p-4 shadow-md flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <button onClick={handleExportFile} className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl font-black shadow-sm transition-all border border-stone-950 active:scale-95">📥 파일 백업</button>
          <button onClick={() => fileInputRef.current.click()} className="px-3.5 py-2 bg-[#F3B329] hover:bg-[#e0a21f] text-stone-950 rounded-xl font-black shadow-sm transition-all border border-stone-900 active:scale-95">📤 파일 복구</button>
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
        </div>
        <button onClick={handleReset} className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl font-black transition-all border border-red-300">초기화</button>
      </div>

      {/* 📋 양도 모달 */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#FFFDF5] rounded-3xl w-full max-w-sm shadow-2xl border-2 border-stone-900 overflow-hidden flex flex-col">
            <div className="bg-stone-900 p-4 text-[#F3B329] flex justify-between items-center border-b border-stone-800">
              <div>
                <h3 className="font-black text-sm flex items-center gap-1">📋 양도 문구 생성</h3>
                <p className="text-[10px] text-amber-200/80 mt-0.5 font-bold">{selectedItem.date} {selectedItem.time} 회차</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-xl font-bold text-stone-400 hover:text-white transition-colors">×</button>
            </div>
            <div className="p-4 flex flex-col gap-3 text-xs text-stone-800 bg-[#FFFDF5]">
              
              <div className="flex flex-col gap-1">
                <label className="font-black text-stone-600 text-[11px]">작품명 및 헤더</label>
                <input type="text" name="musicalName" value={modalInputs.musicalName} onChange={handleModalInputChange} className="p-2 border-2 border-stone-900 rounded-xl bg-white font-bold" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-red-700 text-[11px]">🕊️ 양도할 좌석 직접 입력</label>
                <input 
                  type="text" 
                  name="transferSeat" 
                  placeholder="예: A열 14-16 등 자유롭게 작성" 
                  value={modalInputs.transferSeat} 
                  onChange={handleModalInputChange} 
                  className="p-2 border-2 border-red-700 bg-red-50/40 rounded-xl w-full font-black text-red-900 uppercase focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-black text-stone-600 text-[11px]">할인 종류</label>
                  <select 
                    name="discountType" 
                    value={modalInputs.discountType} 
                    onChange={handleDiscountChange}
                    className="p-2 border-2 border-stone-900 rounded-xl bg-white text-center font-black text-stone-800 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="재관람할인 30%">재관람할인 30%</option>
                    <option value="프리뷰할인 50%">프리뷰할인 50%</option>
                    <option value="40% 할인권">40% 할인권</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-black text-stone-600 text-[11px]">티켓 가격 (수수료포함)</label>
                  <input 
                    type="text" 
                    name="price" 
                    value={modalInputs.price} 
                    onChange={handleModalInputChange} 
                    className="p-2 border-2 border-stone-900 rounded-xl bg-stone-100 text-center font-mono font-black text-stone-950" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-stone-600 text-[11px]">괄호() 내 안내 문구</label>
                <input type="text" name="notice" value={modalInputs.notice} onChange={handleModalInputChange} className="p-2 border-2 border-stone-900 rounded-xl bg-white font-bold" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-stone-600 text-[11px]">하단 검색용 태그</label>
                <input type="text" name="twitterTag" value={modalInputs.twitterTag} onChange={handleModalInputChange} className="p-2 border-2 border-stone-900 rounded-xl bg-white font-mono font-bold" />
              </div>

            </div>
            
            <div className="p-3.5 bg-[#FFF9E6] border-t-2 border-stone-900 flex gap-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-stone-300 hover:bg-stone-400 text-stone-900 font-black rounded-xl">취소</button>
              <button onClick={executeFinalCopy} className="flex-1 py-2.5 bg-[#F3B329] hover:bg-[#e0a21f] text-stone-950 font-black rounded-xl shadow border border-stone-900 active:scale-95 transition-all">📋 문구 복사</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 플로팅 좌석/도장판 통합 저장 버튼 */}
      <div className="fixed bottom-6 right-6 z-50 shadow-2xl">
        <button onClick={handleAllSave} className="w-16 h-16 bg-stone-900 hover:bg-stone-800 active:scale-95 text-[#F3B329] rounded-full flex flex-col items-center justify-center font-black transition-all border-2 border-[#F3B329] shadow-lg" title="모든 좌석 및 도장판 정보 저장">
          <span className="text-xl">💾</span>
          <span className="text-[9px] leading-tight mt-0.5">전체저장</span>
        </button>
      </div>

    </div>
  );
}