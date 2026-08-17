import { useState, useEffect, useRef, useMemo } from 'react';
import { openDB } from 'idb';

// 🔗 공지 및 링크 상수
const FIRST_TICKET_LINK = "https://x.com/newpro_OI/status/2085603813692711207?s=20";
const REVISIT_BENEFIT_LINK = "https://x.com/newpro_OI/status/2084874609149784274?s=20";
const SEAT_CHART_LINK = "https://x.com/newpro_OI/status/2084874555882082479?s=20";

// 🎟️ 티켓 원가 및 할인 계산 데이터 (원가 66,000원 + 예매 수수료 2,000원)
const TICKET_ORIGIN_PRICE = 66000;
const TICKET_FEE = 2000;

const DISCOUNT_OPTIONS = {
  "재관람할인 25%": { rate: 0.25, label: "재관람할인 25%" },
  "마티네할인 30%": { rate: 0.3, label: "마티네할인 30%" },
  "프리뷰할인 50%": { rate: 0.5, label: "프리뷰할인 50%" },
  "40% 할인권": { rate: 0.4, label: "40% 할인권" }
};

// 할인 계산 헬퍼 함수
const calcDiscountPrice = (discountKey) => {
  const option = DISCOUNT_OPTIONS[discountKey] || DISCOUNT_OPTIONS["재관람할인 25%"];
  const discounted = TICKET_ORIGIN_PRICE * (1 - option.rate) + TICKET_FEE;
  return `${discounted.toLocaleString()}원`;
};

// 📅 9월 프리뷰 및 1차 캐스팅 스케줄 기본 데이터
const defaultInitialData = [
  { id: 1, month: 9, date: "09.08", day: "화", time: "20:00", actor1: "박규원", actor2: "양지원", seat: "" },
  { id: 2, month: 9, date: "09.09", day: "수", time: "20:00", actor1: "변희상", actor2: "곽민수", seat: "" },
  { id: 3, month: 9, date: "09.10", day: "목", time: "20:00", actor1: "김지온", actor2: "김경록", seat: "" },
  { id: 4, month: 9, date: "09.11", day: "금", time: "20:00", actor1: "변희상", actor2: "곽민수", seat: "" },
  { id: 5, month: 9, date: "09.12", day: "토", time: "18:00", actor1: "박규원", actor2: "김경록", seat: "" },
  { id: 6, month: 9, date: "09.13", day: "일", time: "18:00", actor1: "김지온", actor2: "곽민수", seat: "" },
  { id: 7, month: 9, date: "09.15", day: "화", time: "20:00", actor1: "김지온", actor2: "양지원", seat: "" },
  { id: 8, month: 9, date: "09.16", day: "수", time: "16:00", actor1: "변희상", actor2: "김경록", seat: "" },
  { id: 9, month: 9, date: "09.16", day: "수", time: "20:00", actor1: "박규원", actor2: "곽민수", seat: "" },
  { id: 10, month: 9, date: "09.17", day: "목", time: "20:00", actor1: "박규원", actor2: "김경록", seat: "" },
  { id: 11, month: 9, date: "09.18", day: "금", time: "20:00", actor1: "김지온", actor2: "곽민수", seat: "" },
  { id: 12, month: 9, date: "09.19", day: "토", time: "14:00", actor1: "변희상", actor2: "양지원", seat: "" },
  { id: 13, month: 9, date: "09.19", day: "토", time: "18:00", actor1: "김지온", actor2: "김경록", seat: "" },
  { id: 14, month: 9, date: "09.20", day: "일", time: "14:00", actor1: "박규원", actor2: "곽민수", seat: "" },
  { id: 15, month: 9, date: "09.20", day: "일", time: "18:00", actor1: "김지온", actor2: "양지원", seat: "" }
];

// 🪑 오셀로와 이아고 좌석 배치도
const othelloSeatRows = {
  A: [null, null, null, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, null, 14, 15, 16, 17, 18, 19, null],
  B: [null, null, null, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, null, 15, 16, 17, 18, 19, 20],
  C: [null, 1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, null, 14, 15, 16, 17, 18, 19, 20],
  D: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, null, 15, 16, 17, 18, 19, 20, 21],
  E: [null, 1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, null, 14, 15, 16, 17, 18, 19, 20],
  F: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, null, 15, 16, 17, 18, 19, 20],
  G: [null, 1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, null, 14, 15, 16, 17, 18, 19, 20],
  H: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, null, 15, 16, 17, 18, 19, 20],
  I: [null, 1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, null, 14, 15, 16, 17, 18, 19, null],
  J: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, null, 15, 16, 17, 18, 19, 20],
  K: [null, 1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, null, 14, 15, 16, 17, 18, 19, 20],
  L: [1, 2, 3, 4, 5, 6, null, 7, 8, 9, 10, 11, 12, 13, 14, null, 15, 16, 17, 18, 19, 20]
};

const DB_NAME = 'MusicalSchedulerDB_OthelloIago_v3_Poster';
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

export default function OthelloIago() {
  const [schedules, setSchedules] = useState([]);
  const fileInputRef = useRef(null);
  
  const [mainTargetActor, setMainTargetActor] = useState('박규원');

  const [formData, setFormData] = useState({
    month: 9, date: '', day: '', time: '20:00', actor1: '박규원', actor2: '', seat: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalInputs, setModalInputs] = useState({
    musicalName: '뮤지컬 오셀로와 이아고', 
    transferSeat: '', 
    discountType: '재관람할인 25%',
    price: calcDiscountPrice('재관람할인 25%'),
    notice: '증빙 필요, 찾아드릴 수 있습니다',
    twitterTag: '@YeonMyuticket'
  });

  const formatSeatInput = (val) => {
    let clean = val.toUpperCase().trim().replace(/\s+/g, '').replace(/-/g, '');
    if (!clean) return '';
    const match = clean.match(/^([A-L])(\d+)$/);
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
    if (!formData.date || !formData.actor1 || !formData.actor2) {
      alert('필수 정보를 입력해 주세요!');
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

    setFormData({ month: 9, date: '', day: '', time: '20:00', actor1: mainTargetActor || '박규원', actor2: '', seat: '' });
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
    alert('모든 변경사항이 저장되었습니다! 💾');
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
    link.download = `othello_iago_backup_${new Date().toISOString().split('T')[0]}.json`;
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
    if (window.confirm('정말 최초 기본 스케줄 상태로 되돌리시겠습니까? (수정된 스케줄이 초기화됩니다)')) {
      const db = await initDB();
      await db.clear(STORE_NAME);
      for (const item of defaultInitialData) {
        await db.put(STORE_NAME, item);
      }
      setSchedules(defaultInitialData);
      alert('초기화가 완료되었습니다.');
    }
  };

  const handleOpenCopyModal = (item) => {
    setSelectedItem(item);
    const defaultDiscount = "재관람할인 25%";

    setModalInputs(prev => ({
      ...prev,
      transferSeat: item.seat || '',
      discountType: defaultDiscount,
      price: calcDiscountPrice(defaultDiscount),
      notice: '증빙 필요, 찾아드릴 수 있습니다'
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
    const castingList = `${item.actor1} ${item.actor2}`;
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
  const targetActorTrimmed = mainTargetActor.trim();
  
  const targetActorShows = schedules.filter(item => 
    targetActorTrimmed ? (item.actor1.includes(targetActorTrimmed) || item.actor2.includes(targetActorTrimmed)) : true
  );
  const targetActorWatched = watchedShows.filter(item => 
    targetActorTrimmed ? (item.actor1.includes(targetActorTrimmed) || item.actor2.includes(targetActorTrimmed)) : true
  ).length;

  const pairStats = useMemo(() => {
    const map = {};
    schedules.forEach(item => {
      const pairKey = `${item.actor1} · ${item.actor2}`;
      if (!map[pairKey]) {
        map[pairKey] = {
          key: pairKey,
          actor1: item.actor1,
          actor2: item.actor2,
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
    if (!targetActorTrimmed) {
      return allPairs.sort((a, b) => b.total - a.total);
    }

    return allPairs
      .filter(p => p.actor1.includes(targetActorTrimmed) || p.actor2.includes(targetActorTrimmed))
      .sort((a, b) => b.total - a.total);
  }, [schedules, targetActorTrimmed]);

  const filteredSchedules = useMemo(() => {
    if (!targetActorTrimmed) return schedules;
    return schedules.filter(item => 
      item.actor1.includes(targetActorTrimmed) || item.actor2.includes(targetActorTrimmed)
    );
  }, [schedules, targetActorTrimmed]);

  const renderRowBlock = (rowConfigMap) => {
    return Object.keys(rowConfigMap).map(row => (
      <div key={row} className="flex items-center gap-0.5 md:gap-1 justify-center">
        <span className="w-4 md:w-5 font-serif font-black text-[#D4AF37] text-center mr-0.5 md:mr-1 text-[11px] md:text-[12px]">{row}</span>
        
        {rowConfigMap[row].map((seatNumber, index) => {
          if (seatNumber === null) {
            return <div key={`space-${row}-${index}`} className="w-[12px] sm:w-[15px] md:w-[18px] h-[18px] md:h-[20px] flex-shrink-0 bg-transparent" />;
          }

          const seatKey = `${row}-${seatNumber}`;
          const matchingShows = schedules.filter(s => s.seat === seatKey);
          const visitCount = matchingShows.length;
          
          let bgClass = "bg-[#181112] text-stone-400 border border-[#3D1A1F]";
          if (visitCount === 1) bgClass = "bg-gradient-to-br from-[#E2B755] to-[#B38728] text-[#120406] font-black border border-[#FFDF73] shadow-md shadow-[#9E1B28]/20";
          else if (visitCount === 2) bgClass = "bg-gradient-to-br from-[#1E824C] to-[#145A32] text-white font-bold border border-emerald-400 shadow-sm";
          else if (visitCount === 3) bgClass = "bg-gradient-to-br from-[#B84A1A] to-[#872E08] text-white font-bold border border-orange-400 shadow-sm";
          else if (visitCount >= 4) bgClass = "bg-gradient-to-br from-[#800F1A] to-[#450208] text-[#FFDF73] font-black border border-[#C92A38] ring-1 ring-[#FF4A5A]";

          return (
            <div 
              key={`seat-${seatKey}`} 
              className={`w-[17px] md:w-[20px] h-[17px] md:h-[20px] text-[8px] md:text-[9.5px] rounded flex items-center justify-center font-bold shadow-sm flex-shrink-0 cursor-default select-none transition-transform hover:scale-110 ${bgClass}`} 
              title={`${seatKey} (정산기록: ${visitCount}회)`}
            >
              <span className="leading-none text-center block w-full tabular-nums">{seatNumber}</span>
            </div>
          );
        })}
        
        <span className="w-4 md:w-5 font-serif font-black text-[#D4AF37] text-center ml-0.5 md:ml-1 text-[11px] md:text-[12px]">{row}</span>
      </div>
    ));
  };

  return (
    <div className="bg-[#0D0B0C] text-[#E8DCC4] min-h-screen w-full p-3 md:p-6 lg:p-8 flex flex-col items-center max-w-4xl mx-auto pb-28 selection:bg-[#680D16] selection:text-[#FFDF73]">
      
      {/* 🎭 포스터 스타일 상단 헤더 */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-gradient-to-b from-[#260509] to-[#160305] p-5 md:p-6 rounded-2xl shadow-2xl border border-[#5C141D] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#7A0C17]/25 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 z-10">
          {/* 🎙️🎀 붉은 리본이 묶인 스탠드 마이크 엠블럼 */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#21060B] to-[#0A0203] flex items-center justify-center relative shadow-inner border border-[#8C1F2B] flex-shrink-0">
            <span className="text-2xl leading-none select-none">🎙️</span>
            <span className="absolute -bottom-1 -right-1 text-sm select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">🎀</span>
          </div>
          <div>
            <span className="text-[10px] tracking-[0.25em] font-serif font-bold text-[#A8202E] uppercase block mb-0.5">
              MUSICAL OTHELLO & IAGO
            </span>
            <h1 className="text-xl md:text-2xl font-serif font-black text-[#F5EAD4] tracking-tight drop-shadow-[0_2px_10px_rgba(180,24,37,0.4)]">
              오셀로와 이아고 정산소
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end z-10">
          <a
            href={FIRST_TICKET_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-gradient-to-r from-[#6E0E18] to-[#45050C] hover:from-[#87121F] hover:to-[#570710] text-[#F5EAD4] rounded-xl text-xs font-bold shadow-lg border border-[#961D2B] transition-all active:scale-95 flex items-center gap-1"
          >
            <span>🎟️</span> 1차 티켓
          </a>
          <a
            href={REVISIT_BENEFIT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-[#1C0609] hover:bg-[#2B0A0F] text-[#D4AF37] rounded-xl text-xs font-bold shadow-md flex items-center gap-1 border border-[#52131B] transition-all active:scale-95"
          >
            <span>🎁</span> 재관람 혜택
          </a>
          <a
            href={SEAT_CHART_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-[#171415] hover:bg-[#262123] text-stone-300 rounded-xl text-xs font-bold shadow-md flex items-center gap-1 border border-stone-700 transition-all active:scale-95"
          >
            <span>🗺️</span> 좌석배치도
          </a>
          <button 
            onClick={() => { setShowForm(!showForm); setEditingId(null); }} 
            className="px-3.5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#AA8520] hover:from-[#E2BF4D] hover:to-[#B89228] text-[#140406] rounded-xl text-xs font-black shadow-md border border-[#F2D785] transition-all active:scale-95"
          >
            {showForm ? '닫기' : '➕ 스케줄 추가'}
          </button>
        </div>
      </header>

      {/* ➕ 스케줄 추가 / 수정 입력 폼 */}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="w-full bg-[#18080B] border border-[#5C141D] rounded-2xl p-5 mb-5 flex flex-col gap-3.5 shadow-2xl animate-in fade-in">
          <h3 className="font-serif font-black text-[#D4AF37] text-sm flex items-center gap-1.5 border-b border-[#3D0D14] pb-2">
            <span>⚙️</span> {editingId ? '스케줄 정보 수정하기' : '새로운 회차 등록하기'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <select name="month" value={formData.month} onChange={handleInputChange} className="p-2.5 border border-[#4A141A] rounded-xl bg-[#0D0406] font-bold text-stone-200 focus:outline-none focus:border-[#D4AF37]">
              <option value={9}>9월</option>
              <option value={10}>10월</option>
              <option value={11}>11월</option>
              <option value={12}>12월</option>
            </select>
            <input type="text" name="date" placeholder="날짜 (예: 09.08)" value={formData.date} onChange={handleInputChange} className="p-2.5 border border-[#4A141A] rounded-xl bg-[#0D0406] font-bold text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-[#D4AF37]" />
            <input type="text" name="day" placeholder="요일" value={formData.day} onChange={handleInputChange} className="p-2.5 border border-[#4A141A] rounded-xl bg-[#0D0406] font-bold text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-[#D4AF37]" />
            <input type="text" name="time" placeholder="시간 (예: 20:00)" value={formData.time} onChange={handleInputChange} className="p-2.5 border border-[#4A141A] rounded-xl bg-[#0D0406] font-bold text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-[#D4AF37]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            <input type="text" name="actor1" placeholder="오셀로" value={formData.actor1} onChange={handleInputChange} className="p-2 border border-[#7A1C26] bg-[#24080D] rounded-xl font-black text-[#F5D77F] focus:outline-none focus:border-[#D4AF37]" />
            <input type="text" name="actor2" placeholder="이아고" value={formData.actor2} onChange={handleInputChange} className="p-2 border border-[#4A141A] rounded-xl bg-[#0D0406] font-bold text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-[#D4AF37]" />
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <label className="font-bold text-[#E56A77] text-[11px]">📍 정산 및 관람 기록용 좌석 (배치도 자동 반영)</label>
            <input type="text" name="seat" placeholder="예: A11 또는 B5 등 하이픈 없이 적어도 자동인식" value={formData.seat} onChange={handleInputChange} className="p-2.5 border border-[#7A1C26] rounded-xl bg-[#24080D] font-black text-[#FFDF73] uppercase focus:outline-none focus:border-[#D4AF37]" />
          </div>
          <div className="flex gap-2 text-xs mt-1">
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#AA8520] hover:from-[#E2BF4D] hover:to-[#B89228] text-[#140406] font-black rounded-xl shadow transition-all border border-[#F2D785]">
              {editingId ? '수정 완료하기' : '이 스케줄 저장하기'}
            </button>
          </div>
        </form>
      )}

      {/* 🌟 기준 배우 설정 & 관람 통계 대시보드 */}
      <section className="w-full bg-gradient-to-b from-[#1C0508] to-[#120305] border border-[#52131B] rounded-2xl shadow-xl p-4 mb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2.5 bg-[#0D0204] p-3 rounded-xl border border-[#3D0D14] text-xs">
          <label className="font-bold text-[#D4AF37] flex items-center gap-1.5 flex-shrink-0 font-serif">
            <span>⚔️</span> 기준 배우:
          </label>
          <div className="relative flex-1 max-w-[220px]">
            <input 
              type="text" 
              value={mainTargetActor}
              onChange={(e) => setMainTargetActor(e.target.value)}
              placeholder="배우 이름 입력 (비우면 전체보기)" 
              className="w-full p-2 px-3 pr-7 border border-[#7A1C26] bg-[#21060B] rounded-lg font-black text-[#F5D77F] text-xs focus:outline-none focus:border-[#D4AF37]"
            />
            {mainTargetActor && (
              <button 
                onClick={() => setMainTargetActor('')} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 font-bold text-xs"
                title="입력 지우기 (전체보기)"
              >
                ×
              </button>
            )}
          </div>
          <span className="text-[10px] text-stone-500 hidden sm:inline font-medium">해당 배우의 페어 & 스케줄만 필터링됩니다</span>
        </div>

        <div className="flex justify-around text-center pt-1">
          <div className="flex-1 border-r border-[#3D0D14]">
            <p className="text-xs font-bold text-[#E56A77]">{mainTargetActor ? `${mainTargetActor} 관람` : '선택 배우 관람'}</p>
            <p className="text-2xl font-serif font-black mt-1 text-[#F5EAD4]">
              {targetActorWatched} <span className="text-xs font-sans font-normal text-stone-500">/ {targetActorShows.length}회</span>
            </p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-[#D4AF37]">전체 관람합계</p>
            <p className="text-2xl font-serif font-black mt-1 text-[#F5EAD4]">
              {watchedShows.length} <span className="text-xs font-sans font-normal text-stone-500">/ {schedules.length}회</span>
            </p>
          </div>
        </div>
      </section>

      {/* 👥 [기준 배우 연동] 페어별 회차 현황 카드 */}
      <section className="w-full bg-[#140407] border border-[#4A141A] rounded-2xl p-4 shadow-xl mb-5">
        <div className="flex items-center justify-between mb-3 border-b border-[#2E0A10] pb-2">
          <h2 className="font-serif font-bold text-xs md:text-sm text-[#F5EAD4] flex items-center gap-1.5">
            <span>👥</span> {mainTargetActor ? `'${mainTargetActor}' 출연 페어 현황` : '전체 페어별 현황'}
            <span className="text-stone-500 text-[11px] font-normal">({pairStats.length}개 조합)</span>
          </h2>
          <span className="text-[10px] text-[#A8202E] font-serif font-bold uppercase tracking-wider">OTHELLO · IAGO</span>
        </div>

        {pairStats.length === 0 ? (
          <div className="p-4 text-center text-xs text-stone-500 bg-[#0D0204] rounded-xl border border-[#2E0A10]">
            '{mainTargetActor}' 배우가 포함된 페어가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {pairStats.map((pair) => (
              <div 
                key={pair.key} 
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all bg-gradient-to-r from-[#2B080E] to-[#1F0509] border-[#8C1F2B] shadow-sm"
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[#F5D77F] font-black">
                    {pair.key}
                  </span>
                </div>
                <div className="text-right pl-2">
                  <span className={`font-serif font-black text-sm tabular-nums ${pair.watched > 0 ? 'text-[#E56A77]' : 'text-[#D4AF37]'}`}>
                    {pair.watched}
                  </span>
                  <span className="text-[11px] font-sans font-normal text-stone-500 tabular-nums"> / {pair.total}회</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 📅 [기준 배우 연동] 월별 스케줄 리스트 */}
      <main className="w-full flex flex-col gap-5 text-sm mb-8">
        {[9, 10, 11, 12].map(m => {
          const monthSchedules = filteredSchedules.filter(item => item.month === m);
          if (monthSchedules.length === 0) return null;
          
          return (
            <div key={m} className="bg-[#140407] border border-[#4A141A] rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-3 bg-gradient-to-r from-[#2B080E] via-[#4A0D15] to-[#2B080E] text-[#D4AF37] font-serif font-bold text-center text-xs tracking-widest uppercase flex items-center justify-center gap-2 border-b border-[#5C141D]">
                <span>✦</span> {m}월 회차 스케줄 {mainTargetActor && `('${mainTargetActor}' 출연)`} ({monthSchedules.length}회) <span>✦</span>
              </div>
              <div className="w-full select-none">
                <div className="divide-y divide-[#260509]">
                  {monthSchedules.map((item) => {
                    const isActor1Target = targetActorTrimmed && item.actor1.includes(targetActorTrimmed);
                    const isActor2Target = targetActorTrimmed && item.actor2.includes(targetActorTrimmed);

                    return (
                      <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-[#1F070B] transition-colors">
                        
                        {/* 👈 [좌측]: 일자/시간 + 출연진 */}
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                          <div className="flex flex-col items-start flex-shrink-0">
                            <span className="font-serif font-black text-[#F5EAD4] text-xs tabular-nums">{item.date}</span>
                            <span className="text-[9px] text-[#D4AF37] bg-[#24060A] border border-[#52131B] px-1 rounded mt-0.5 tabular-nums font-bold">{item.time}</span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className={`text-[11px] sm:text-xs font-bold truncate ${isActor1Target ? 'text-[#FFDF73] font-black underline underline-offset-4 decoration-[#9E1B28]' : 'text-stone-300'}`} title={`오셀로: ${item.actor1}`}>
                              {item.actor1}
                            </span>
                            <span className="text-stone-600 text-[10px]">·</span>
                            <span className={`text-[11px] sm:text-xs font-bold truncate ${isActor2Target ? 'text-[#FFDF73] font-black underline underline-offset-4 decoration-[#9E1B28]' : 'text-stone-300'}`} title={`이아고: ${item.actor2}`}>
                              {item.actor2}
                            </span>
                          </div>
                        </div>

                        {/* 👉 [우측]: 좌석 입력란 + 조작 버튼 */}
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                          <input 
                            type="text" 
                            placeholder="좌석" 
                            value={item.seat || ""} 
                            onChange={(e) => handleSeatChange(item.id, e.target.value)} 
                            className="w-11 sm:w-14 p-1 text-[11px] border border-[#52131B] text-[#FFDF73] bg-[#0A0203] rounded-lg text-center font-black uppercase placeholder:font-normal placeholder:text-[9px] placeholder:text-stone-600 h-7 focus:outline-none focus:border-[#D4AF37]" 
                          />
                          <button 
                            onClick={() => handleOpenCopyModal(item)} 
                            className="px-1.5 sm:px-2 py-1 text-[10px] bg-gradient-to-r from-[#D4AF37] to-[#AA8520] hover:from-[#E2BF4D] hover:to-[#B89228] text-[#140406] font-black rounded-lg h-7 flex items-center justify-center shadow transition-all active:scale-95"
                          >
                            양도
                          </button>
                          <button onClick={() => handleEditStart(item)} className="px-1.5 sm:px-2 py-1 text-[10px] bg-[#24080D] hover:bg-[#380D14] text-stone-300 rounded-lg font-bold h-7 flex items-center justify-center border border-[#4A141A]">수정</button>
                          <button onClick={() => handleScheduleDelete(item.id)} className="px-1.5 sm:px-2 py-1 text-[10px] bg-[#570912] hover:bg-[#780C19] text-[#F5EAD4] rounded-lg font-bold h-7 flex items-center justify-center border border-[#8C1422]">삭제</button>
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

      {/* 🪑 실시간 좌석 배치도 */}
      <section className="w-full bg-[#120305] text-[#E8DCC4] rounded-3xl p-4 md:p-6 flex flex-col items-center shadow-2xl mb-6 border border-[#52131B]">
        <div className="w-full flex justify-between items-center mb-3">
          <div className="py-1 bg-gradient-to-r from-[#D4AF37] to-[#AA8520] px-4 text-[#140406] rounded-md font-serif font-black tracking-[0.2em] text-[11px] shadow-md">S T A G E</div>
          <span className="text-[10px] text-[#D4AF37] font-serif font-bold">SEAT GUIDE (관람 회차별 자동 집계)</span>
        </div>
        
        <div className="flex gap-2.5 justify-center items-center mb-4 text-[10px] bg-[#0A0203] px-3 py-2 rounded-xl text-stone-400 font-bold w-full flex-wrap border border-[#2E0A10]">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-gradient-to-br from-[#E2B755] to-[#B38728] rounded-sm"></div>1회</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-600 rounded-sm"></div>2회</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-orange-600 rounded-sm"></div>3회</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#800F1A] border border-[#C92A38] rounded-sm"></div>4회 이상</div>
        </div>

        <div className="w-full overflow-x-auto pb-2 flex flex-col gap-4">
          <div className="flex flex-col gap-1 w-full min-w-[580px] select-none p-4 bg-[#080203] rounded-2xl border border-[#2E0A10]">
            <div className="text-[11px] font-serif font-black text-[#D4AF37] mb-1.5 pl-1">객석 (A열 ~ L열)</div>
            {renderRowBlock(othelloSeatRows)}
          </div>
        </div>
      </section>

      {/* 💾 백업 & 복원 카드 */}
      <div className="w-full bg-[#140407] border border-[#4A141A] rounded-2xl p-4 shadow-xl flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <button onClick={handleExportFile} className="px-3.5 py-2 bg-[#21060B] hover:bg-[#330910] text-[#D4AF37] rounded-xl font-bold shadow transition-all border border-[#52131B] active:scale-95">📥 파일 백업</button>
          <button onClick={() => fileInputRef.current.click()} className="px-3.5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#AA8520] hover:from-[#E2BF4D] hover:to-[#B89228] text-[#140406] rounded-xl font-black shadow transition-all border border-[#F2D785] active:scale-95">📤 파일 복구</button>
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
        </div>
        <button onClick={handleReset} className="px-3.5 py-2 bg-[#3D0A11] hover:bg-[#540E18] text-[#E56A77] rounded-xl font-bold transition-all border border-[#6B1420]">초기화</button>
      </div>

      {/* 📋 양도 모달 */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#140407] rounded-3xl w-full max-w-sm shadow-2xl border border-[#5C141D] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#2B080E] to-[#1C0508] p-4 text-[#D4AF37] flex justify-between items-center border-b border-[#4A141A]">
              <div>
                <h3 className="font-serif font-black text-sm flex items-center gap-1">📋 양도 문구 생성</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">{selectedItem.date} {selectedItem.time} 회차</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-xl font-bold text-stone-500 hover:text-white transition-colors">×</button>
            </div>
            <div className="p-4 flex flex-col gap-3 text-xs text-stone-300 bg-[#0F0305]">
              
              <div className="flex flex-col gap-1">
                <label className="font-bold text-stone-400 text-[11px]">작품명 및 헤더</label>
                <input type="text" name="musicalName" value={modalInputs.musicalName} onChange={handleModalInputChange} className="p-2 border border-[#4A141A] rounded-xl bg-[#080203] text-stone-200 font-bold focus:outline-none focus:border-[#D4AF37]" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#E56A77] text-[11px]">🕊️ 양도할 좌석 직접 입력</label>
                <input 
                  type="text" 
                  name="transferSeat" 
                  placeholder="예: A열 14-16 등 자유롭게 작성" 
                  value={modalInputs.transferSeat} 
                  onChange={handleModalInputChange} 
                  className="p-2 border border-[#7A1C26] bg-[#1F060A] rounded-xl w-full font-black text-[#FFDF73] uppercase focus:outline-none focus:border-[#D4AF37]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-stone-400 text-[11px]">할인 종류</label>
                  <select 
                    name="discountType" 
                    value={modalInputs.discountType} 
                    onChange={handleDiscountChange} 
                    className="p-2 border border-[#4A141A] rounded-xl bg-[#080203] text-center font-bold text-stone-200 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value="재관람할인 25%">재관람할인 25%</option>
                    <option value="마티네할인 30%">마티네할인 30%</option>
                    <option value="프리뷰할인 50%">프리뷰할인 50%</option>
                    <option value="40% 할인권">40% 할인권</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-stone-400 text-[11px]">티켓 가격 (수수료포함)</label>
                  <input 
                    type="text" 
                    name="price" 
                    value={modalInputs.price} 
                    onChange={handleModalInputChange} 
                    className="p-2 border border-[#4A141A] rounded-xl bg-[#080203] text-center font-mono font-black text-[#FFDF73] focus:outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-stone-400 text-[11px]">괄호() 내 안내 문구</label>
                <input type="text" name="notice" value={modalInputs.notice} onChange={handleModalInputChange} className="p-2 border border-[#4A141A] rounded-xl bg-[#080203] text-stone-200 font-bold focus:outline-none focus:border-[#D4AF37]" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-stone-400 text-[11px]">하단 검색용 태그</label>
                <input type="text" name="twitterTag" value={modalInputs.twitterTag} onChange={handleModalInputChange} className="p-2 border border-[#4A141A] rounded-xl bg-[#080203] text-stone-200 font-mono font-bold focus:outline-none focus:border-[#D4AF37]" />
              </div>

            </div>
            
            <div className="p-3.5 bg-[#140407] border-t border-[#3D0D14] flex gap-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-[#21060B] hover:bg-[#330910] text-stone-400 font-bold rounded-xl border border-[#4A141A]">취소</button>
              <button onClick={executeFinalCopy} className="flex-1 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#AA8520] hover:from-[#E2BF4D] hover:to-[#B89228] text-[#140406] font-black rounded-xl shadow transition-all border border-[#F2D785] active:scale-95">📋 문구 복사</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 플로팅 좌석저장 버튼 */}
      <div className="fixed bottom-6 right-6 z-50 shadow-2xl">
        <button onClick={handleAllSave} className="w-16 h-16 bg-gradient-to-b from-[#2B080E] to-[#140305] hover:from-[#3D0C14] hover:to-[#1F0508] active:scale-95 text-[#D4AF37] rounded-full flex flex-col items-center justify-center font-serif font-black transition-all border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]" title="모든 좌석 정보 저장">
          <span className="text-xl">💾</span>
          <span className="text-[9px] leading-tight mt-0.5">좌석저장</span>
        </button>
      </div>

    </div>
  );
}