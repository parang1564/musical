import { useState, useEffect, useRef } from 'react';
import { openDB } from 'idb';

// 🔗 공지 링크 상수
const FIRST_TICKET_LINK = "https://x.com/mbz_anarchist/status/2085597396302692384?s=20";
const REVISIT_BENEFIT_LINK = "https://x.com/mbz_anarchist/status/2085597121311633728?s=20";
const EVENT_NOTICE_LINK = "https://x.com/mbz_anarchist/status/2087736240338776409/photo/1";

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
    return { name: "프리뷰", color: "bg-amber-100 text-amber-800 border-amber-300", link: EVENT_NOTICE_LINK };
  }
  if (dateStr >= "09.22" && dateStr <= "09.27") {
    return { name: "커튼콜 & 트리플 적립", color: "bg-purple-100 text-purple-800 border-purple-300", link: EVENT_NOTICE_LINK };
  }
  if ((dateStr >= "09.29" && dateStr <= "09.30") || (dateStr >= "10.01" && dateStr <= "10.05")) {
    return { name: "스페셜 커튼콜 & 쿠폰팩 증정", color: "bg-emerald-100 text-emerald-800 border-emerald-300", link: EVENT_NOTICE_LINK };
  }
  return null;
};

// 📅 9월 ~ 10월 캐스팅 스케줄 기본 데이터
const defaultInitialData = [
  // --- 9월 일정 ---
  { id: 1, month: 9, date: "09.15", day: "화", time: "20:00", actor1: "정재환", actor2: "진호", mainActor: "김도빈", seat: "" },
  { id: 2, month: 9, date: "09.16", day: "수", time: "20:00", actor1: "박좌헌", actor2: "박준형", mainActor: "이진혁", seat: "" },
  { id: 3, month: 9, date: "09.17", day: "목", time: "20:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "" },
  { id: 4, month: 9, date: "09.18", day: "금", time: "20:00", actor1: "정재환", actor2: "박주혁", mainActor: "김도빈", seat: "" },
  { id: 5, month: 9, date: "09.19", day: "토", time: "15:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "" },
  { id: 6, month: 9, date: "09.19", day: "토", time: "19:00", actor1: "박좌헌", actor2: "박주혁", mainActor: "이진혁", seat: "" },
  { id: 7, month: 9, date: "09.20", day: "일", time: "14:00", actor1: "정재환", actor2: "진호", mainActor: "김도빈", seat: "" },
  { id: 8, month: 9, date: "09.20", day: "일", time: "18:00", actor1: "김재한", actor2: "박준형", mainActor: "이진혁", seat: "" },
  { id: 9, month: 9, date: "09.22", day: "화", time: "20:00", actor1: "박좌헌", actor2: "박주혁", mainActor: "이진혁", seat: "" },
  { id: 10, month: 9, date: "09.23", day: "수", time: "16:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "" },
  { id: 11, month: 9, date: "09.23", day: "수", time: "20:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "" },
  { id: 12, month: 9, date: "09.24", day: "목", time: "14:00", actor1: "정재환", actor2: "진호", mainActor: "김도빈", seat: "" },
  { id: 13, month: 9, date: "09.24", day: "목", time: "18:00", actor1: "김재한", actor2: "박준형", mainActor: "이진혁", seat: "" },
  { id: 14, month: 9, date: "09.26", day: "토", time: "14:00", actor1: "정재환", actor2: "박주혁", mainActor: "김도빈", seat: "" },
  { id: 15, month: 9, date: "09.26", day: "토", time: "18:00", actor1: "박좌헌", actor2: "박준형", mainActor: "김도빈", seat: "" },
  { id: 16, month: 9, date: "09.27", day: "일", time: "14:00", actor1: "정재환", actor2: "박준형", mainActor: "이진혁", seat: "" },
  { id: 17, month: 9, date: "09.27", day: "일", time: "18:00", actor1: "김재한", actor2: "진호", mainActor: "이진혁", seat: "" },
  { id: 18, month: 9, date: "09.29", day: "화", time: "20:00", actor1: "정재환", actor2: "진호", mainActor: "김도빈", seat: "" },
  { id: 19, month: 9, date: "09.30", day: "수", time: "16:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "" },
  { id: 20, month: 9, date: "09.30", day: "수", time: "20:00", actor1: "정재환", actor2: "박준형", mainActor: "이진혁", seat: "" },

  // --- 10월 일정 ---
  { id: 21, month: 10, date: "10.01", day: "목", time: "20:00", actor1: "박좌헌", actor2: "박주혁", mainActor: "최호승", seat: "" },
  { id: 22, month: 10, date: "10.02", day: "금", time: "20:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "" },
  { id: 23, month: 10, date: "10.03", day: "토", time: "15:00", actor1: "정재환", actor2: "박준형", mainActor: "최호승", seat: "" },
  { id: 24, month: 10, date: "10.03", day: "토", time: "19:00", actor1: "박좌헌", actor2: "박주혁", mainActor: "최호승", seat: "" },
  { id: 25, month: 10, date: "10.04", day: "일", time: "14:00", actor1: "정우연", actor2: "홍나현", mainActor: "이지현", seat: "" },
  { id: 26, month: 10, date: "10.04", day: "일", time: "18:00", actor1: "김재한", actor2: "박준형", mainActor: "이진혁", seat: "" },
  { id: 27, month: 10, date: "10.05", day: "월", time: "14:00", actor1: "박좌헌", actor2: "진호", mainActor: "김도빈", seat: "" },
  { id: 28, month: 10, date: "10.05", day: "월", time: "18:00", actor1: "정재환", actor2: "박주혁", mainActor: "김도빈", seat: "" }
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

const DB_NAME = 'MusicalSchedulerDB_Anarchist_v6';
const STORE_NAME = 'schedules';
const DB_VERSION = 1;

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export default function Anarchist() {
  const [schedules, setSchedules] = useState([]);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    month: 9, date: '', day: '', time: '20:00', actor1: '', actor2: '', mainActor: '이진혁', seat: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchActor, setSearchActor] = useState('이진혁');
  const [selectedSeatFromMap, setSelectedSeatFromMap] = useState('');

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
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'month' ? Number(value) : (name === 'seat' ? formatSeatInput(value) : value)
    }));
  };

  const handleSeatChange = (id, value) => {
    setSchedules(prev =>
      prev.map(item => item.id === id ? { ...item, seat: formatSeatInput(value) } : item)
    );
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

    setFormData({ month: 9, date: '', day: '', time: '20:00', actor1: '', actor2: '', mainActor: '이진혁', seat: '' });
    setSelectedSeatFromMap(''); 
    setShowForm(false);
    loadInitialData();
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setFormData({ ...item });
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
    alert('모든 변경사항이 내장 DB에 저장되었습니다! 💾');
  };

  const handleExportFile = () => {
    if (schedules.length === 0) {
      alert('백업할 데이터가 없습니다.');
      return;
    }
    const dataStr = JSON.stringify(schedules, null, 2);
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
        if (!Array.isArray(importedData)) throw new Error('올바른 형식이 아닙니다.');

        if (window.confirm('파일을 불러오면 현재 기록이 덮어써집니다. 진행하시겠습니까?')) {
          const db = await initDB();
          await db.clear(STORE_NAME);
          for (const item of importedData) {
            await db.put(STORE_NAME, { ...item, seat: formatSeatInput(item.seat) });
          }
          alert('성공적으로 데이터를 복구했습니다! 📂');
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
    if (window.confirm('정말 최초 기본 스케줄 상태로 되돌리시겠습니까?')) {
      const db = await initDB();
      await db.clear(STORE_NAME);
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

  const handleSeatMapCellClick = (seatKey) => {
    setSelectedSeatFromMap(seatKey);
    setFormData(prev => ({ ...prev, seat: seatKey }));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const watchedShows = schedules.filter(item => item.seat && item.seat.trim() !== "");
  const leeJinHyukCount = watchedShows.filter(item => item.mainActor === "이진혁").length;
  const otherActorsCount = watchedShows.filter(item => item.mainActor !== "이진혁").length;
  const totalLeeJinHyuk = schedules.filter(item => item.mainActor === "이진혁").length;

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
        <span className="w-4 md:w-5 font-black text-slate-500 text-center mr-0.5 md:mr-1 text-[11px] md:text-[12px]">{row}</span>
        
        {rowConfigMap[row].map((seatNumber, index) => {
          if (seatNumber === null) {
            return <div key={`space-${row}-${index}`} className="w-[10px] md:w-[15px] h-[18px] md:h-[20px] flex-shrink-0 bg-transparent" />;
          }

          const seatKey = `${row}-${seatNumber}`;
          const matchingShows = schedules.filter(s => s.seat === seatKey);
          const visitCount = matchingShows.length;
          
          let bgClass = "bg-slate-800 text-slate-400";
          if (visitCount === 1) bgClass = "bg-sky-400 text-slate-950 font-extrabold";
          else if (visitCount === 2) bgClass = "bg-emerald-500 text-white";
          else if (visitCount === 3) bgClass = "bg-amber-500 text-white";
          else if (visitCount >= 4) bgClass = "bg-rose-600 text-white font-black";

          const isCurrentSelected = selectedSeatFromMap === seatKey;
          const borderClass = isCurrentSelected ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 z-10 scale-110" : "";

          return (
            <div 
              key={`seat-${seatKey}`} 
              onClick={() => handleSeatMapCellClick(seatKey)}
              className={`w-[17px] md:w-[20px] h-[17px] md:h-[20px] text-[8px] md:text-[9.5px] rounded-sm flex items-center justify-center font-bold shadow-sm flex-shrink-0 cursor-pointer hover:scale-125 transition-transform ${bgClass} ${borderClass}`} 
              title={`${seatKey} (정산기록: ${visitCount}회)`}
            >
              <span className="leading-none text-center block w-full tabular-nums">{seatNumber}</span>
            </div>
          );
        })}
        
        <span className="w-4 md:w-5 font-black text-slate-500 text-center ml-0.5 md:ml-1 text-[11px] md:text-[12px]">{row}</span>
      </div>
    ));
  };

  return (
    <div className="p-3 md:p-6 lg:p-8 flex flex-col items-center font-sans max-w-4xl mx-auto min-h-screen pb-24">
      
      {/* 🎭 상단 전체 헤더 */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center gap-3 mb-6 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚩</span>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">뮤지컬 &lt;아나키스트&gt; 정산 & 관리</h1>
            <p className="text-[11px] text-slate-400 font-medium">일자별 이벤트 태그 및 와이드 좌석 배치도 연동</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={FIRST_TICKET_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span>🎟️</span> 1차
          </a>
          <a
            href={REVISIT_BENEFIT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span>🎁</span> 재관람 혜택
          </a>
          <button 
            onClick={() => { setShowForm(!showForm); setEditingId(null); }} 
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            {showForm ? '닫기' : '➕ 스케줄 추가'}
          </button>
        </div>
      </header>

      {/* ➕ 스케줄 추가 / 수정 입력 폼 */}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 flex flex-col gap-3.5 shadow-sm animate-in fade-in">
          <h3 className="font-bold text-slate-700 text-sm">{editingId ? '✏️ 스케줄 정보 수정하기' : '📅 새로운 회차 등록하기'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <select name="month" value={formData.month} onChange={handleInputChange} className="p-2.5 border rounded-xl bg-white font-medium">
              <option value={9}>9월</option>
              <option value={10}>10월</option>
            </select>
            <input type="text" name="date" placeholder="날짜 (예: 09.15)" value={formData.date} onChange={handleInputChange} className="p-2.5 border rounded-xl bg-white font-medium" />
            <input type="text" name="day" placeholder="요일" value={formData.day} onChange={handleInputChange} className="p-2.5 border rounded-xl bg-white font-medium" />
            <input type="text" name="time" placeholder="시간 (예: 20:00)" value={formData.time} onChange={handleInputChange} className="p-2.5 border rounded-xl bg-white font-medium" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <input type="text" name="mainActor" placeholder="덕형 (주연)" value={formData.mainActor} onChange={handleInputChange} className="p-2.5 border rounded-xl bg-white font-bold text-purple-700" />
            <input type="text" name="actor1" placeholder="자경" value={formData.actor1} onChange={handleInputChange} className="p-2.5 border rounded-xl bg-white font-medium" />
            <input type="text" name="actor2" placeholder="무혁" value={formData.actor2} onChange={handleInputChange} className="p-2.5 border rounded-xl bg-white font-medium" />
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <label className="font-bold text-purple-700 text-[11px]">📊 정산 및 관람 기록용 좌석 (배치도 자동 반영)</label>
            <input type="text" name="seat" placeholder="예: A11 이나 B5 처럼 하이픈 없이 적어도 자동인식" value={formData.seat} onChange={handleInputChange} className="p-2.5 border border-purple-300 rounded-xl bg-purple-50/40 font-bold text-purple-700 uppercase" />
          </div>
          <div className="flex gap-2 text-xs mt-1">
            <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition-all">
              {editingId ? '수정 완료하기' : '이 스케줄 저장하기'}
            </button>
          </div>
        </form>
      )}

      {/* 📊 관람 통계 대시보드 */}
      <section className="w-full bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex justify-around text-center mb-5">
        <div>
          <p className="text-xs font-bold text-purple-600">이진혁 (덕형)</p>
          <p className="text-xl font-black mt-1 text-slate-800">{leeJinHyukCount} <span className="text-xs font-normal text-slate-400">/ {totalLeeJinHyuk}회</span></p>
        </div>
        <div className="border-x border-slate-100 px-8">
          <p className="text-xs font-bold text-slate-500">타배우 (덕형)</p>
          <p className="text-xl font-black mt-1 text-slate-800">{otherActorsCount} <span className="text-xs font-normal text-slate-400">/ {schedules.length - totalLeeJinHyuk}회</span></p>
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-600">총 관람합계</p>
          <p className="text-xl font-black mt-1 text-slate-800">{watchedShows.length} <span className="text-xs font-normal text-slate-400">/ {schedules.length}회</span></p>
        </div>
      </section>

      {/* 🔍 배우 검색창 */}
      <div className="w-full relative mb-5">
        <input 
          type="text" 
          placeholder="🔍 출연 배우 이름으로 필터링 (예: 이진혁, 정재환, 김도빈, 김재한)" 
          value={searchActor}
          onChange={(e) => setSearchActor(e.target.value)}
          className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:border-teal-500 font-medium placeholder:text-slate-400"
        />
        {searchActor && (
          <button onClick={() => setSearchActor('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center pb-0.5">×</button>
        )}
      </div>

      {/* 📅 월별 스케줄 리스트 (이벤트 열 맨 끝 이동 및 자동 줄바꿈) */}
      <main className="w-full flex flex-col gap-4 text-sm mb-8">
        {[9, 10].map(m => {
          const monthSchedules = filteredSchedules.filter(item => item.month === m);
          if (monthSchedules.length === 0) return null;
          
          return (
            <div key={m} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className={`p-3 text-white font-bold text-center text-xs tracking-wider ${m === 9 ? 'bg-teal-600' : 'bg-slate-700'}`}>
                {m}월 일정 ({monthSchedules.length}회차)
              </div>
              <div className="w-full overflow-x-auto select-none">
                <div className="divide-y divide-slate-100 min-w-[620px]">
                  {monthSchedules.map((item) => {
                    const eventInfo = getEventForDate(item.date);

                    return (
                      <div key={item.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors gap-2">
                        
                        {/* 1. 날짜 / 시간 */}
                        <div className="flex flex-col items-start w-[55px] flex-shrink-0 pl-1">
                          <span className="font-bold text-slate-700 text-xs tabular-nums">{item.date}</span>
                          <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded mt-0.5 tabular-nums">{item.time}</span>
                        </div>

                        {/* 2. 출연진 (자경 / 무혁 / 덕형) */}
                        <div className="text-slate-600 text-[11px] w-[45px] flex-shrink-0 truncate text-left font-medium" title={`자경: ${item.actor1}`}>{item.actor1}</div>
                        <div className="text-slate-600 text-[11px] w-[45px] flex-shrink-0 truncate text-left font-medium" title={`무혁: ${item.actor2}`}>{item.actor2}</div>
                        <div className={`text-[12px] font-black w-[45px] text-center flex-shrink-0 ${item.mainActor === '이진혁' ? 'text-purple-600' : 'text-slate-600'}`} title={`덕형: ${item.mainActor}`}>{item.mainActor}</div>

                        {/* 3. 좌석 입력란 */}
                        <div className="w-[58px] flex-shrink-0">
                          <input type="text" placeholder="좌석" value={item.seat || ""} onChange={(e) => handleSeatChange(item.id, e.target.value)} className="w-full p-1 text-[11px] border border-purple-200 text-purple-700 rounded-lg text-center font-bold uppercase placeholder:font-normal placeholder:text-[9px] h-7" />
                        </div>

                        {/* 4. 🎁 [맨 끝 배치] 일자별 이벤트 태그 (줄바꿈 허용으로 전문 노출) */}
                        <div className="flex-1 min-w-[140px] px-1 text-left flex items-center">
                          {eventInfo ? (
                            <a
                              href={eventInfo.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold border transition-all hover:opacity-80 leading-tight break-words text-left ${eventInfo.color}`}
                              title={`${eventInfo.name} (클릭 시 공지 이동)`}
                            >
                              🎁 {eventInfo.name}
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-300">-</span>
                          )}
                        </div>

                        {/* 5. 조작 버튼 (복사 / 수정 / 삭제) */}
                        <div className="flex gap-1 justify-end pl-1 flex-shrink-0">
                          <button onClick={() => handleOpenCopyModal(item)} className="px-2 py-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium h-7 flex items-center justify-center">복사</button>
                          <button onClick={() => handleEditStart(item)} className="px-2 py-1 text-[10px] bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-medium h-7 flex items-center justify-center">수정</button>
                          <button onClick={() => handleScheduleDelete(item.id)} className="px-2 py-1 text-[10px] bg-red-400 hover:bg-red-500 text-white rounded-lg font-medium h-7 flex items-center justify-center">삭제</button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* 🪑 실시간 와이드 좌석 배치도 (B2F 1층 / B1F 2층) */}
      <section className="w-full bg-slate-900 text-white rounded-2xl p-4 md:p-6 flex flex-col items-center shadow-lg mb-6">
        
        <div className="w-full flex justify-between items-center mb-3">
          <div className="py-1 bg-slate-800 px-4 text-slate-300 rounded-lg font-black tracking-widest text-[11px]">S T A G E</div>
          <span className="text-[10px] text-slate-400 font-medium">좌석 터치 시 상단 스케줄 입력창에 자동 등록됩니다.</span>
        </div>
        
        <div className="flex gap-2.5 justify-center items-center mb-4 text-[10px] bg-slate-800 px-3 py-2 rounded-xl text-slate-300 font-medium w-full flex-wrap">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-sky-400 rounded-sm"></div>1회</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>2회</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></div>3회</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-rose-600 rounded-sm"></div>4회 이상</div>
        </div>

        <div className="w-full overflow-x-auto pb-2 flex flex-col gap-4">
          
          {/* B2F 객석 1층 */}
          <div className="flex flex-col gap-1 w-full min-w-[580px] select-none p-3 bg-slate-950 rounded-xl">
            <div className="text-[11px] font-bold text-slate-400 mb-1 pl-1">B2F 객석 1층</div>
            {renderRowBlock(floor1Rows)}
          </div>

          {/* B1F 객석 2층 */}
          <div className="flex flex-col gap-1 w-full min-w-[580px] select-none p-3 bg-slate-950 rounded-xl">
            <div className="text-[11px] font-bold text-slate-400 mb-1 pl-1">B1F 객석 2층</div>
            {renderRowBlock(floor2Rows)}
          </div>

        </div>
      </section>

      {/* 💾 하단 백업 및 복원 컨트롤 카드 */}
      <div className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <button onClick={handleExportFile} className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95">📥 파일 백업</button>
          <button onClick={() => fileInputRef.current.click()} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95">📤 파일 복구</button>
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
        </div>
        <button onClick={handleReset} className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold transition-all">초기화</button>
      </div>

      {/* 📋 양도 문구 팝업 모달 */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-amber-500 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1">📋 양도 문구 생성</h3>
                <p className="text-[10px] text-amber-100 mt-0.5">{selectedItem.date} {selectedItem.time} 회차</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-xl font-bold opacity-80 hover:opacity-100 transition-opacity">×</button>
            </div>
            <div className="p-4 flex flex-col gap-3 text-xs text-slate-700 bg-slate-50/50">
              
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-500 text-[11px]">작품명 및 헤더</label>
                <input type="text" name="musicalName" value={modalInputs.musicalName} onChange={handleModalInputChange} className="p-2 border border-slate-200 rounded-xl w-full bg-white focus:outline-none focus:border-amber-500 font-medium" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-amber-600 text-[11px]">🕊️ 양도할 좌석 직접 입력</label>
                <input 
                  type="text" 
                  name="transferSeat" 
                  placeholder="예: A열 14-16 등 자유롭게 작성" 
                  value={modalInputs.transferSeat} 
                  onChange={handleModalInputChange} 
                  className="p-2 border border-amber-300 bg-amber-50/30 rounded-xl w-full focus:outline-none focus:border-amber-500 font-bold text-amber-700 uppercase" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-500 text-[11px]">할인 종류</label>
                  <select 
                    name="discountType" 
                    value={modalInputs.discountType} 
                    onChange={handleDiscountChange}
                    className="p-2 border border-slate-200 rounded-xl w-full bg-white text-center font-bold text-slate-700 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="재관람할인 30%">재관람할인 30%</option>
                    <option value="프리뷰할인 50%">프리뷰할인 50%</option>
                    <option value="40% 할인권">40% 할인권</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-500 text-[11px]">티켓 가격 (수수료포함)</label>
                  <input 
                    type="text" 
                    name="price" 
                    value={modalInputs.price} 
                    onChange={handleModalInputChange} 
                    className="p-2 border border-slate-200 rounded-xl w-full bg-slate-50 text-center font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-500 text-[11px]">괄호() 내 안내 문구</label>
                <input type="text" name="notice" value={modalInputs.notice} onChange={handleModalInputChange} className="p-2 border border-slate-200 rounded-xl w-full bg-white font-medium" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-500 text-[11px]">하단 검색용 태그</label>
                <input type="text" name="twitterTag" value={modalInputs.twitterTag} onChange={handleModalInputChange} className="p-2 border border-slate-200 rounded-xl w-full bg-white font-mono" />
              </div>

            </div>
            
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex gap-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold rounded-xl">취소</button>
              <button onClick={executeFinalCopy} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-md active:scale-95 transition-all">📋 문구 복사</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 플로팅 좌석저장 버튼 */}
      <div className="fixed bottom-6 right-6 z-50 shadow-lg">
        <button onClick={handleAllSave} className="w-16 h-16 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full flex flex-col items-center justify-center font-bold transition-all shadow-md border-2 border-white" title="모든 좌석 정보 저장">
          <span className="text-xl">💾</span>
          <span className="text-[9px] leading-tight mt-0.5">좌석저장</span>
        </button>
      </div>

    </div>
  );
}