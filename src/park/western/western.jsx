import { useState, useEffect, useRef } from 'react';
import { openDB } from 'idb';

// 📅 최초 접속 시에만 들어가는 초기 스케줄 기본 데이터 (7월 웨스턴 스토리 스케줄)
const defaultInitialData = [
  { "id": 1, "month": 7, "date": "07.01", "day": "수", "time": "19:30", "jane": "조영화", "billy": "박규원", "wyatt": "최호승", "josephine": "한보라", "johnny": "최호중", "bud": "박세훈", "harry": "신준석", "seat": "", "mainActor": "박규원" },
  { "id": 2, "month": 7, "date": "07.02", "day": "목", "time": "19:30", "jane": "이채원", "billy": "홍기범", "wyatt": "송원근", "josephine": "최수진", "johnny": "원종환", "bud": "이동희", "harry": "신은호", "seat": "", "mainActor": "홍기범" },
  { "id": 3, "month": 7, "date": "07.03", "day": "금", "time": "19:30", "jane": "표바하", "billy": "정욱진", "wyatt": "김도빈", "josephine": "주다온", "johnny": "정상윤", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "정욱진" },
  { "id": 4, "month": 7, "date": "07.04", "day": "토", "time": "14:00", "jane": "조영화", "billy": "박규원", "wyatt": "송원근", "josephine": "한보라", "johnny": "최호중", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "박규원" },
  { "id": 5, "month": 7, "date": "07.04", "day": "토", "time": "18:30", "jane": "이채원", "billy": "홍기범", "wyatt": "김도빈", "josephine": "최수진", "johnny": "최호중", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "홍기범" },
  { "id": 6, "month": 7, "date": "07.05", "day": "일", "time": "14:00", "jane": "표바하", "billy": "정욱진", "wyatt": "최호승", "josephine": "주다온", "johnny": "원종환", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "정욱진" },
  { "id": 7, "month": 7, "date": "07.05", "day": "일", "time": "18:30", "jane": "이채원", "billy": "정욱진", "wyatt": "송원근", "josephine": "한보라", "johnny": "정상윤", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "정욱진" },
  { "id": 8, "month": 7, "date": "07.07", "day": "화", "time": "19:30", "jane": "조영화", "billy": "정욱진", "wyatt": "송원근", "josephine": "최수진", "johnny": "정상윤", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "정욱진" },
  { "id": 9, "month": 7, "date": "07.08", "day": "수", "time": "15:00", "jane": "이채원", "billy": "박규원", "wyatt": "김도빈", "josephine": "주다온", "johnny": "최호중", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "박규원" },
  { "id": 10, "month": 7, "date": "07.08", "day": "수", "time": "19:30", "jane": "표바하", "billy": "홍기범", "wyatt": "김도빈", "josephine": "한보라", "johnny": "최호중", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "홍기범" },
  { "id": 11, "month": 7, "date": "07.09", "day": "목", "time": "19:30", "jane": "조영화", "billy": "박규원", "wyatt": "최호승", "josephine": "주다온", "johnny": "정상윤", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "박규원" },
  { "id": 12, "month": 7, "date": "07.10", "day": "금", "time": "19:30", "jane": "이채원", "billy": "홍기범", "wyatt": "김도빈", "josephine": "최수진", "johnny": "원종환", "bud": "이동희", "harry": "신은호", "seat": "", "mainActor": "홍기범" },
  { "id": 13, "month": 7, "date": "07.11", "day": "토", "time": "14:00", "jane": "표바하", "billy": "박규원", "wyatt": "송원근", "josephine": "한보라", "johnny": "정상윤", "bud": "박세훈", "harry": "신준석", "seat": "", "mainActor": "박규원" },
  { "id": 14, "month": 7, "date": "07.11", "day": "토", "time": "18:30", "jane": "표바하", "billy": "홍기범", "wyatt": "송원근", "josephine": "주다온", "johnny": "정상윤", "bud": "박세훈", "harry": "신준석", "seat": "", "mainActor": "홍기범" },
  { "id": 15, "month": 7, "date": "07.12", "day": "일", "time": "14:00", "jane": "조영화", "billy": "정욱진", "wyatt": "최호승", "josephine": "최수진", "johnny": "원종환", "bud": "이동희", "harry": "신은호", "seat": "", "mainActor": "정욱진" },
  { "id": 16, "month": 7, "date": "07.12", "day": "일", "time": "18:30", "jane": "이채원", "billy": "정욱진", "wyatt": "최호승", "josephine": "한보라", "johnny": "원종환", "bud": "이동희", "harry": "신은호", "seat": "", "mainActor": "정욱진" },
  { "id": 17, "month": 7, "date": "07.14", "day": "화", "time": "19:30", "jane": "이채원", "billy": "홍기범", "wyatt": "최호승", "josephine": "주다온", "johnny": "정상윤", "bud": "이동희", "harry": "신은호", "seat": "", "mainActor": "홍기범" },
  { "id": 18, "month": 7, "date": "07.15", "day": "수", "time": "15:00", "jane": "조영화", "billy": "정욱진", "wyatt": "송원근", "josephine": "최수진", "johnny": "최호중", "bud": "박세훈", "harry": "신준석", "seat": "", "mainActor": "정욱진" },
  { "id": 19, "month": 7, "date": "07.15", "day": "수", "time": "19:30", "jane": "표바하", "billy": "정욱진", "wyatt": "김도빈", "josephine": "한보라", "johnny": "최호중", "bud": "박세훈", "harry": "신준석", "seat": "", "mainActor": "정욱진" },
  { "id": 20, "month": 7, "date": "07.16", "day": "목", "time": "19:30", "jane": "표바하", "billy": "박규원", "wyatt": "최호승", "josephine": "최수진", "johnny": "원종환", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "박규원" },
  { "id": 21, "month": 7, "date": "07.17", "day": "금", "time": "14:00", "jane": "이채원", "billy": "홍기범", "wyatt": "송원근", "josephine": "한보라", "johnny": "최호중", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "홍기범" },
  { "id": 22, "month": 7, "date": "07.17", "day": "금", "time": "18:30", "jane": "이채원", "billy": "박규원", "wyatt": "송원근", "josephine": "주다온", "johnny": "최호중", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "박규원" },
  { "id": 23, "month": 7, "date": "07.18", "day": "토", "time": "14:00", "jane": "조영화", "billy": "정욱진", "wyatt": "김도빈", "josephine": "한보라", "johnny": "정상윤", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "정욱진" },
  { "id": 24, "month": 7, "date": "07.18", "day": "토", "time": "18:30", "jane": "표바하", "billy": "정욱진", "wyatt": "김도빈", "josephine": "주다온", "johnny": "정상윤", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "정욱진" },
  { "id": 25, "month": 7, "date": "07.19", "day": "일", "time": "14:00", "jane": "이채원", "billy": "홍기범", "wyatt": "최호승", "josephine": "한보라", "johnny": "원종환", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "홍기범" },
  { "id": 26, "month": 7, "date": "07.19", "day": "일", "time": "18:30", "jane": "조영화", "billy": "박규원", "wyatt": "최호승", "josephine": "최수진", "johnny": "원종환", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "박규원" },
  { "id": 27, "month": 7, "date": "07.21", "day": "화", "time": "19:30", "jane": "이채원", "billy": "정욱진", "wyatt": "최호승", "josephine": "주다온", "johnny": "원종환", "bud": "이동희", "harry": "신은호", "seat": "", "mainActor": "정욱진" },
  { "id": 28, "month": 7, "date": "07.22", "day": "수", "time": "15:00", "jane": "표바하", "billy": "홍기범", "wyatt": "김도빈", "josephine": "최수진", "johnny": "최호중", "bud": "박세훈", "harry": "신준석", "seat": "", "mainActor": "홍기범" },
  { "id": 29, "month": 7, "date": "07.22", "day": "수", "time": "19:30", "jane": "조영화", "billy": "박규원", "wyatt": "송원근", "josephine": "한보라", "johnny": "정상윤", "bud": "박세훈", "harry": "신준석", "seat": "", "mainActor": "박규원" },
  { "id": 30, "month": 7, "date": "07.23", "day": "목", "time": "19:30", "jane": "조영화", "billy": "홍기범", "wyatt": "김도빈", "josephine": "최수진", "johnny": "정상윤", "bud": "이동희", "harry": "신은호", "seat": "", "mainActor": "홍기범" },
  { "id": 31, "month": 7, "date": "07.24", "day": "금", "time": "19:30", "jane": "표바하", "billy": "박규원", "wyatt": "최호승", "josephine": "주다온", "johnny": "원종환", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "박규원" },
  { "id": 32, "month": 7, "date": "07.25", "day": "토", "time": "14:00", "jane": "이채원", "billy": "홍기범", "wyatt": "송원근", "josephine": "최수진", "johnny": "정상윤", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "홍기범" },
  { "id": 33, "month": 7, "date": "07.25", "day": "토", "time": "18:30", "jane": "표바하", "billy": "박규원", "wyatt": "최호승", "josephine": "주다온", "johnny": "원종환", "bud": "이동희", "harry": "신준석", "seat": "", "mainActor": "박규원" },
  { "id": 34, "month": 7, "date": "07.26", "day": "일", "time": "14:00", "jane": "이채원", "billy": "정욱진", "wyatt": "김도빈", "josephine": "한보라", "johnny": "최호중", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "정욱진" },
  { "id": 35, "month": 7, "date": "07.26", "day": "일", "time": "18:30", "jane": "조영화", "billy": "정욱진", "wyatt": "김도빈", "josephine": "한보라", "johnny": "최호중", "bud": "박세훈", "harry": "신은호", "seat": "", "mainActor": "정욱진" }
];

const ACTOR_LIST = {
  jane: ["조영화", "이채원", "표바하"],
  billy: ["박규원", "홍기범", "정욱진"],
  wyatt: ["최호승", "송원근", "김도빈"]
};

const rowConfigurations = {
  1: 22, 2: 22, 3: 23, 4: 24, 5: 24, 6: 25, 7: 25, 8: 25, 9: 25, 10: 25,
  11: 25, 12: 25, 13: 25, 14: 25, 15: 25, 16: 25, 17: 25, 18: 25, 19: 25, 20: 25,
  21: 24, 22: 24, 23: 24, 24: 24, 25: 24, 26: 24, 27: 24, 28: 24, 29: 24, 30: 24
};
const rows = Object.keys(rowConfigurations);

const DB_NAME = 'WesternSchedulerDB_v1';
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

export default function Gloomy() {
  const [schedules, setSchedules] = useState([]);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    month: 7, date: '', day: '', time: '19:30', jane: '조영화', billy: '박규원', wyatt: '최호승', josephine: '', johnny: '', bud: '', harry: '', mainActor: '박규원', seat: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchActor, setSearchActor] = useState('');
  const [selectedSeatFromMap, setSelectedSeatFromMap] = useState('');

  const [isSeatMapModalOpen, setIsSeatMapModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [modalInputs, setModalInputs] = useState({
    musicalName: '뮤지컬 웨스턴 스토리 웨스스', 
    transferSeat: '', 
    discountType: '40%실물할인권소지자',
    price: '54,800',
    notice: '증빙 필요, 찾아드릴 수 없습니다',
    twitterTag: '@YeonMyuticket'
  });

  const formatSeatInput = (val) => {
    let clean = val.toUpperCase().trim().replace(/\s+/g, '').replace(/-/g, '');
    if (!clean) return '';
    const match = clean.match(/^(\d+)[열|-]?(\d+)번?$/);
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
      [name]: name === 'month' ? Number(value) : (name === 'seat' ? formatSeatInput(value) : value),
      ...(name === 'billy' ? { mainActor: value } : {})
    }));
  };

  const handleSeatChange = (id, value) => {
    setSchedules(prev =>
      prev.map(item => item.id === id ? { ...item, seat: formatSeatInput(value) } : item)
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.mainActor) {
      alert('필수 정보를 입력해 주세요!');
      return;
    }

    const db = await initDB();
    const submissionData = {
      ...formData,
      billy: formData.mainActor
    };

    if (editingId) {
      const updatedItem = { ...submissionData, id: editingId };
      await db.put(STORE_NAME, updatedItem);
      setEditingId(null);
      alert('스케줄이 수정되었습니다! ✏️');
    } else {
      const newItem = { ...submissionData, id: Date.now() };
      await db.put(STORE_NAME, newItem);
      alert('새로운 스케줄이 추가되었습니다! 📅');
    }

    setFormData({ month: 7, date: '', day: '', time: '19:30', jane: '조영화', billy: '박규원', wyatt: '최호승', josephine: '', johnny: '', bud: '', harry: '', mainActor: '박규원', seat: '' });
    setSelectedSeatFromMap(''); 
    setShowForm(false);
    loadInitialData();
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setFormData({
      ...item,
      jane: item.jane || '조영화',
      billy: item.billy || item.mainActor || '박규원',
      wyatt: item.wyatt || '최호승',
      josephine: item.josephine || '',
      johnny: item.johnny || '',
      bud: item.bud || '',
      harry: item.harry || '',
      mainActor: item.billy || item.mainActor || '박규원'
    });
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
    link.download = `western_backup_${new Date().toISOString().split('T')[0]}.json`;
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
    setModalInputs(prev => ({
      ...prev,
      transferSeat: item.seat || ''
    }));
    setIsModalOpen(true);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalInputs(prev => ({ ...prev, [name]: value }));
  };

  const executeFinalCopy = () => {
    if (!selectedItem) return;
    const item = selectedItem;
    const finalSeat = modalInputs.transferSeat.trim() === "" ? "미입력 좌석" : modalInputs.transferSeat.toUpperCase();

    // 📋 클립보드 복사 시 전 배역 이름 깔끔하게 노출 포맷팅
    const copyText = `${modalInputs.musicalName} 양도\n${item.date}(${item.day}) ${item.time}\n제인:${item.jane || ''} 빌리:${item.billy || item.mainActor || ''} 와이어트:${item.wyatt || ''}\n조세핀:${item.josephine || ''} 조니:${item.johnny || ''} 버드:${item.bud || ''} 해리:${item.harry || ''}\n좌석:${finalSeat}\n${modalInputs.discountType} ${modalInputs.price}(${modalInputs.notice})\n\n${modalInputs.twitterTag}`;

    navigator.clipboard.writeText(copyText)
      .then(() => {
        alert(`${item.date} 회차의 양도 문구가 클립보드에 최종 복사되었습니다! 📋`);
        setIsModalOpen(false);
      })
      .catch(err => alert("복사 실패: " + err));
  };

  const handleSeatMapCellClick = (seatKey) => {
    setSelectedSeatFromMap(seatKey);
    setFormData(prev => ({ ...prev, seat: seatKey }));
    setShowForm(true);
    setIsSeatMapModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const watchedShows = schedules.filter(item => item.seat && item.seat.trim() !== "");
  const parkGyuWonCount = watchedShows.filter(item => item.billy === "박규원" || item.mainActor === "박규원").length;
  const otherActorsCount = watchedShows.filter(item => item.billy !== "박규원" && item.mainActor !== "박규원").length;
  const totalParkGyuWon = schedules.filter(item => item.billy === "박규원" || item.mainActor === "박규원").length;

  const filteredSchedules = schedules.filter(item => {
    if (!searchActor.trim()) return true;
    const query = searchActor.trim();
    return (
      (item.jane && item.jane.includes(query)) ||
      (item.billy && item.billy.includes(query)) ||
      (item.wyatt && item.wyatt.includes(query)) ||
      (item.josephine && item.josephine.includes(query)) ||
      (item.johnny && item.johnny.includes(query)) ||
      (item.bud && item.bud.includes(query)) ||
      (item.harry && item.harry.includes(query)) ||
      (item.mainActor && item.mainActor.includes(query))
    );
  });

  const renderSeatGrid = (isZoomed = false) => {
    return (
      <div className="flex flex-col gap-1 w-full min-w-[430px] select-none p-1">
        {rows.map(row => {
          const displayRowLabel = Number(row) > 20 ? `2층 ${Number(row) - 20}` : `${row}`;
          
          return (
            <div key={row} className="flex items-center gap-0.5 justify-center">
              <span className={`w-10 font-black text-slate-500 text-right mr-2 ${isZoomed ? 'text-[11px]' : 'text-[9px]'}`}>
                {displayRowLabel}
              </span>
              {Array.from({ length: rowConfigurations[row] }, (_, i) => {
                const seatNumber = i + 1;
                const seatKey = `${row}-${seatNumber}`;
                const matchingShows = schedules.filter(s => s.seat === seatKey);
                const visitCount = matchingShows.length;
                
                let bgClass = "bg-slate-700 text-white";
                if (visitCount === 1) bgClass = "bg-sky-400 text-slate-950 font-extrabold";
                else if (visitCount === 2) bgClass = "bg-emerald-500 text-white";
                else if (visitCount === 3) bgClass = "bg-amber-500 text-white";
                else if (visitCount >= 4) bgClass = "bg-rose-600 text-white font-black";

                const isCurrentSelected = selectedSeatFromMap === seatKey;
                const borderClass = isCurrentSelected ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 z-10 scale-110" : "";
                const sizeClass = isZoomed ? "w-[22px] h-[22px] text-[11px]" : "w-[18px] h-[18px] text-[9px]";

                return (
                  <div 
                    key={seatNumber} 
                    onClick={() => handleSeatMapCellClick(seatKey)}
                    className={`rounded-sm flex items-center justify-center font-bold shadow-sm flex-shrink-0 cursor-pointer hover:scale-110 transition-transform ${sizeClass} ${bgClass} ${borderClass}`} 
                    title={`${displayRowLabel}열 ${seatNumber}번 (내 정산기록: ${visitCount}회)`}
                  >
                    <span className="leading-none text-center block w-full">{seatNumber}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-3 md:p-6 flex flex-col items-center font-sans max-w-xl mx-auto relative min-h-screen pb-24 overflow-x-hidden">
      
      {/* 🚢 헤더 및 제어 버튼 */}
      <header className="w-full flex flex-col gap-2 mb-5">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-amber-800">🌵 웨스턴 스토리 정산 & 관리</h1>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="px-3 py-1 bg-amber-700 text-white rounded text-xs font-bold">
            {showForm ? '닫기' : '➕ 스케줄 추가'}
          </button>
        </div>
        
        <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg gap-1 text-xs">
          <div className="flex gap-1">
            <button onClick={handleExportFile} className="px-2 py-1 bg-amber-600 text-white rounded font-bold">📥 파일 백업</button>
            <button onClick={() => fileInputRef.current.click()} className="px-2 py-1 bg-indigo-600 text-white rounded font-bold">📤 파일 복구</button>
            <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
          </div>
          <div>
            <button onClick={handleReset} className="px-2 py-1 bg-red-500 text-white rounded font-bold">초기화</button>
          </div>
        </div>
      </header>

      {/* ➕ 스케줄 추가 / 수정 입력 폼 */}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 mb-5 flex flex-col gap-3">
          <h3 className="font-bold text-slate-700 text-sm">{editingId ? '✏️ 스케줄 정보 수정하기' : '📅 새로운 회차 등록하기'}</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <select name="month" value={formData.month} onChange={handleInputChange} className="p-2 border rounded">
              <option value={6}>6월</option>
              <option value={7}>7월</option>
            </select>
            <input type="text" name="date" placeholder="날짜 (예: 07.01)" value={formData.date} onChange={handleInputChange} className="p-2 border rounded" />
            <input type="text" name="day" placeholder="요일" value={formData.day} onChange={handleInputChange} className="p-2 border rounded" />
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input type="text" name="time" placeholder="시간" value={formData.time} onChange={handleInputChange} className="p-2 border rounded" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 pl-0.5">빌리 역</span>
              <select name="billy" value={formData.billy} onChange={(e) => { handleInputChange(e); setFormData(p => ({...p, mainActor: e.target.value})); }} className="p-2 border rounded bg-white font-bold text-purple-700">
                {ACTOR_LIST.billy.map(act => <option key={act} value={act}>{act}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 pl-0.5">제인 역</span>
              <select name="jane" value={formData.jane} onChange={handleInputChange} className="p-2 border rounded bg-white">
                {ACTOR_LIST.jane.map(act => <option key={act} value={act}>{act}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 pl-0.5">와이어트 역</span>
              <select name="wyatt" value={formData.wyatt} onChange={handleInputChange} className="p-2 border rounded bg-white">
                {ACTOR_LIST.wyatt.map(act => <option key={act} value={act}>{act}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <input type="text" name="josephine" placeholder="조세핀" value={formData.josephine} onChange={handleInputChange} className="p-2 border rounded" />
            <input type="text" name="johnny" placeholder="조니 정상윤/원종환/최호중" value={formData.johnny} onChange={handleInputChange} className="p-2 border rounded" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <input type="text" name="bud" placeholder="버드 박세훈/이동희" value={formData.bud} onChange={handleInputChange} className="p-2 border rounded" />
            <input type="text" name="harry" placeholder="해리 신준석/신은호" value={formData.harry} onChange={handleInputChange} className="p-2 border rounded" />
          </div>
          
          <div className="flex flex-col gap-1 text-xs">
            <label className="font-bold text-purple-700 text-[10px]">📊 정산 및 관람 기록용 좌석 (현황판 반영)</label>
            <input type="text" name="seat" placeholder="예: 12열 15번 이나 12-15 형태로 입력" value={formData.seat} onChange={handleInputChange} className="p-2 border rounded font-bold text-purple-700 uppercase" />
          </div>
          <div className="flex gap-2 text-xs mt-1">
            <button type="submit" className="flex-1 py-2 bg-amber-700 text-white font-bold rounded">
              {editingId ? '수정 완료하기' : '이 스케줄 저장하기'}
            </button>
          </div>
        </form>
      )}

      {/* 📊 관람 횟수 대시보드 */}
      <section className="w-full bg-white border border-slate-100 rounded-lg shadow-sm p-4 flex justify-around text-center mb-4">
        <div>
          <p className="text-xs font-bold text-purple-600">박규원</p>
          <p className="text-lg font-black mt-1 text-slate-700">{parkGyuWonCount} <span className="text-xs font-normal text-slate-400">/ {totalParkGyuWon}회</span></p>
        </div>
        <div className="border-x border-slate-100 px-6">
          <p className="text-xs font-bold text-slate-500">타배우</p>
          <p className="text-lg font-black mt-1 text-slate-700">{otherActorsCount} <span className="text-xs font-normal text-slate-400">/ {schedules.length - totalParkGyuWon}회</span></p>
        </div>
        <div>
          <p className="text-xs font-bold text-amber-700">합계</p>
          <p className="text-lg font-black mt-1 text-slate-700">{watchedShows.length} <span className="text-xs font-normal text-slate-400">/ {schedules.length}회</span></p>
        </div>
      </section>

      {/* 🔍 배우 검색/필터링 입력창 */}
      <section className="w-full mb-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="🔍 배우 이름 필터링 (조영화, 박규원, 최호승, 한보라, 최호중, 박세훈, 신준석 등)" 
            value={searchActor}
            onChange={(e) => setSearchActor(e.target.value)}
            className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 shadow-sm focus:outline-none focus:border-amber-700 font-medium placeholder:text-slate-400"
          />
          {searchActor && (
            <button onClick={() => setSearchActor('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center pb-0.5">×</button>
          )}
        </div>
      </section>

      {/* 📅 월별 스케줄 출력 리스트 (7인 배역 명단 가로 스크롤 테이블화) */}
      <main className="w-full flex flex-col gap-3 mb-6 text-sm">
        {[6, 7].map(m => {
          const monthSchedules = filteredSchedules.filter(item => item.month === m);
          if (monthSchedules.length === 0) return null;
          
          return (
            <div key={m} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className={`p-2.5 text-white font-bold text-center text-xs tracking-wider ${m === 6 ? 'bg-amber-600' : 'bg-amber-800'}`}>{m}월 일정</div>
              
              <div className="w-full overflow-x-auto select-none">
                {/* 🔄 테이블 열 너비 고정 및 가로 스크롤 확보 */}
                <div className="min-w-[580px] divide-y divide-slate-100 text-[11px]">
                  {/* 테이블 헤더 라벨 가이드 */}
                  <div className="bg-slate-50 p-2 flex font-bold text-slate-400 text-[10px] uppercase text-center">
                    <div className="w-[50px] text-left">일시</div>
                    <div className="w-[45px]">제인</div>
                    <div className="w-[45px]">와이어트</div>
                    <div className="w-[45px]">빌리</div>
                    <div className="w-[45px]">조세핀</div>
                    <div className="w-[45px]">조니</div>
                    <div className="w-[45px]">버드</div>
                    <div className="w-[45px]">해리</div>
                    <div className="w-[50px]">좌석</div>
                    <div className="flex-1 text-right">관리</div>
                  </div>

                  {monthSchedules.map((item) => {
                    const currentBilly = item.billy || item.mainActor || '';
                    return (
                      <div key={item.id} className="p-2 flex items-center justify-start hover:bg-slate-50 transition-colors text-center text-slate-600">
                        {/* 일시 */}
                        <div className="flex flex-col items-start w-[50px] flex-shrink-0 text-left">
                          <span className="font-bold text-slate-700 text-xs tabular-nums">{item.date}</span>
                          <span className="text-[9px] text-slate-400 bg-slate-100 px-0.5 rounded mt-0.5 tabular-nums">{item.time}</span>
                        </div>
                        {/* 제인 */}
                        <div className="w-[45px] flex-shrink-0 truncate font-medium">{item.jane || ''}</div>
                        {/* 와이어트 */}
                        <div className="w-[45px] flex-shrink-0 truncate font-medium">{item.wyatt || ''}</div>
                        {/* 빌리 (박규원 강조) */}
                        <div className={`w-[45px] flex-shrink-0 truncate font-bold ${currentBilly === '박규원' ? 'text-purple-600' : 'text-slate-600'}`}>{currentBilly}</div>
                        {/* 조세핀 */}
                        <div className="w-[45px] flex-shrink-0 truncate font-medium text-slate-400">{item.josephine || ''}</div>
                        {/* 조니 */}
                        <div className="w-[45px] flex-shrink-0 truncate font-medium text-slate-400">{item.johnny || ''}</div>
                        {/* 버드 */}
                        <div className="w-[45px] flex-shrink-0 truncate font-medium text-slate-400">{item.bud || ''}</div>
                        {/* 해리 */}
                        <div className="w-[45px] flex-shrink-0 truncate font-medium text-slate-400">{item.harry || ''}</div>
                        {/* 좌석 인풋 */}
                        <div className="w-[50px] flex-shrink-0 px-0.5">
                          <input type="text" placeholder="좌석" value={item.seat || ""} onChange={(e) => handleSeatChange(item.id, e.target.value)} className="w-full p-0.5 text-[10px] border border-purple-200 text-purple-700 rounded text-center font-bold uppercase placeholder:font-normal placeholder:text-[9px] h-6" />
                        </div>
                        {/* 관리 버튼 컴포넌트 */}
                        <div className="flex gap-x-1 flex-1 justify-end pl-2">
                          <button onClick={() => handleOpenCopyModal(item)} className="w-[32px] text-center py-1 text-[9px] bg-amber-500 text-white rounded font-medium h-6 flex items-center justify-center">복사</button>
                          <button onClick={() => handleEditStart(item)} className="w-[32px] text-center py-1 text-[9px] bg-slate-500 text-white rounded font-medium h-6 flex items-center justify-center">수정</button>
                          <button onClick={() => handleScheduleDelete(item.id)} className="w-[32px] text-center py-1 text-[9px] bg-red-400 text-white rounded font-medium h-6 flex items-center justify-center">삭제</button>
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

      {/* 🪑 실시간 내 좌석 배치도 시각화 */}
      <section className="w-full bg-slate-900 text-white rounded-xl p-4 flex flex-col items-center shadow-md">
        <div className="w-full flex justify-between items-center mb-3">
          <div className="py-1 bg-slate-800 px-3 text-slate-400 rounded font-black tracking-widest text-[11px]">S T A G E</div>
          <button 
            onClick={() => setIsSeatMapModalOpen(true)} 
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow transition-all active:scale-95 flex items-center gap-1"
          >
            🔍 좌석표 크게 보기
          </button>
        </div>
        
        <div className="flex gap-3 justify-center items-center mb-4 text-[10px] bg-slate-800 px-3 py-1.5 rounded-md text-slate-300 font-medium w-full">
          <span className="text-slate-400 font-bold">정산 기록 횟수별:</span>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-sky-400 rounded-sm"></div>1회</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>2회</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></div>3회</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-rose-600 rounded-sm"></div>4회 이상</div>
        </div>

        <div className="w-full overflow-x-auto pb-1">
          {renderSeatGrid(false)}
        </div>
      </section>

      {/* 🔍 좌석표 크게 보기 전용 팝업 모달 */}
      {isSeatMapModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[110] flex flex-col p-4 overflow-hidden justify-center items-center">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
              <div>
                <h3 className="text-white font-extrabold text-sm">🪑 유니플렉스 1관 좌석표 (확대 모드)</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">원하는 좌석을 터치하면 상단 스케줄 입력창에 자동 등록됩니다.</p>
              </div>
              <button 
                onClick={() => setIsSeatMapModalOpen(false)} 
                className="text-white font-black text-lg bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="flex gap-3 justify-center items-center mb-4 text-[10px] bg-slate-800 px-3 py-1.5 rounded-md text-slate-300 font-medium">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-sky-400 rounded-sm"></div>1회</div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>2회</div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></div>3회</div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-rose-600 rounded-sm"></div>4회 이상</div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 rounded-xl p-3 flex justify-start items-start">
              {renderSeatGrid(true)}
            </div>

            <div className="mt-3 text-center">
              <button 
                onClick={() => setIsSeatMapModalOpen(false)} 
                className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 커스텀 양도 문구 팝업 모달 */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-amber-500 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1">📋 커스텀 양도 문구 생성</h3>
                <p className="text-[10px] text-amber-100 mt-0.5">{selectedItem.date} {selectedItem.time} 회차</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-xl font-bold opacity-80 hover:opacity-100 transition-opacity">×</button>
            </div>
            <div className="p-4 flex flex-col gap-3.5 text-xs text-slate-700 bg-slate-50/50">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-500 text-[11px]">작품명 및 헤더</label>
                <input type="text" name="musicalName" value={modalInputs.musicalName} onChange={handleModalInputChange} className="p-2 border border-slate-200 rounded-lg w-full bg-white focus:outline-none focus:border-amber-500 font-medium" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-amber-600 text-[11px]">🕊️ 양도할 좌석 직접 입력</label>
                <input type="text" name="transferSeat" placeholder="예: 1층 12열 15번 등 자유롭게 작성" value={modalInputs.transferSeat} onChange={handleModalInputChange} className="p-2 border border-amber-300 bg-amber-50/30 rounded-lg w-full focus:outline-none focus:border-amber-500 font-bold text-amber-700 uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-500 text-[11px]">할인 종류</label>
                  <input type="text" name="discountType" value={modalInputs.discountType} onChange={handleModalInputChange} className="p-2 border border-slate-200 rounded-lg w-full bg-white focus:outline-none focus:border-amber-500 font-medium text-center" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-500 text-[11px]">티켓 가격</label>
                  <input type="text" name="price" value={modalInputs.price} onChange={handleModalInputChange} className="p-2 border border-slate-200 rounded-lg w-full bg-white focus:outline-none focus:border-amber-500 font-medium text-center font-mono" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-500 text-[11px]">괄호() 내 안내 문구</label>
                <input type="text" name="notice" value={modalInputs.notice} onChange={handleModalInputChange} className="p-2 border border-slate-200 rounded-lg w-full bg-white focus:outline-none focus:border-amber-500 font-medium" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-500 text-[11px]">하단 검색용 태그</label>
                <input type="text" name="twitterTag" value={modalInputs.twitterTag} onChange={handleModalInputChange} className="p-2 border border-slate-200 rounded-lg w-full bg-white focus:outline-none focus:border-amber-500 font-mono" />
              </div>
            </div>
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-300 text-slate-700 font-bold rounded-xl">취소</button>
              <button onClick={executeFinalCopy} className="flex-1 py-2 bg-amber-500 text-white font-extrabold rounded-xl shadow-md active:scale-95 transition-all">📋 문구 복사하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 우측 하단 고정 플로팅 좌석저장 버튼 */}
      <div className="fixed bottom-6 right-6 z-50 shadow-lg">
        <button onClick={handleAllSave} className="w-16 h-16 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full flex flex-col items-center justify-center font-bold transition-all shadow-md group border-2 border-white" title="모든 좌석 정보 저장">
          <span className="text-xl">💾</span>
          <span className="text-[9px] leading-tight mt-0.5">좌석저장</span>
        </button>
      </div>

    </div>
  );
}